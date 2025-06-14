import type {
    DataStreamString,
    FileUIPart,
    ReasoningUIPart,
    TextUIPart,
    ToolInvocationUIPart
} from "@ai-sdk/ui-utils"

import { ChatError } from "@/lib/errors"
import {
    type TextStreamPart,
    type ToolCall,
    createDataStream,
    formatDataStreamPart,
    smoothStream,
    streamText
} from "ai"
import type { Infer } from "convex/values"
import { internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import { httpAction } from "../_generated/server"
import { dbMessagesToCore } from "../lib/db_to_core_messages"
import { getUserIdentity } from "../lib/identity"
import { createLanguageModel, getProviderFromModelId } from "../lib/models"
import { getResumableStreamContext } from "../lib/resumable_stream_context"
import type { HTTPAIMessage } from "../schema/message"
import type { ErrorUIPart } from "../schema/parts"
import { manualStreamTransform } from "./manual_stream_transform"
import { RESPONSE_OPTS } from "./shared"
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google"
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai"
import { generateThreadName } from "./generate_thread_name"
import { getToolkit, type AbilityId } from "../lib/toolkit"
import { buildPrompt } from "./prompt"

export const chatPOST = httpAction(async (ctx, req) => {
    const body: {
        id?: string
        message: Infer<typeof HTTPAIMessage>
        model: string
        proposedNewAssistantId: string
        enabledTools: AbilityId[]
        targetFromMessageId?: string
        targetMode?: "normal" | "edit" | "retry"
    } = await req.json()

    if (body.targetFromMessageId && !body.id) {
        return new ChatError("bad_request:chat").toResponse()
    }

    const user = await getUserIdentity(ctx.auth, { allowAnons: true })
    if ("error" in user) return new ChatError("unauthorized:chat").toResponse()

    const mutationResult = await ctx.runMutation(internal.threads.createThreadOrInsertMessages, {
        threadId: body.id as Id<"threads">,
        authorId: user.id,
        userMessage: "message" in body ? body.message : undefined,
        proposedNewAssistantId: body.proposedNewAssistantId,
        targetFromMessageId: body.targetFromMessageId,
        targetMode: body.targetMode
    })

    if (mutationResult instanceof ChatError) return mutationResult.toResponse()
    if (!mutationResult) return new ChatError("bad_request:chat").toResponse()

    const dbMessages = await ctx.runQuery(internal.messages.getMessagesByThreadId, {
        threadId: mutationResult.threadId
    })
    const streamId = await ctx.runMutation(internal.streams.appendStreamId, {
        threadId: mutationResult.threadId
    })

    const mapped_messages = await dbMessagesToCore(dbMessages)

    const streamStartTime = Date.now()

    const remoteCancel = new AbortController()
    const parts: Array<
        | TextUIPart
        | (ReasoningUIPart & { duration?: number })
        | ToolInvocationUIPart
        | (Omit<FileUIPart, "data"> & { assetUrl: string })
        | Infer<typeof ErrorUIPart>
    > = []

    const provider = getProviderFromModelId(body.model)
    if (!provider) return new ChatError("bad_request:api", "Unsupported model").toResponse()

    const userApiKey = await ctx.runQuery(internal.apikeys.getDecryptedApiKey, {
        userId: user.id,
        provider
    })

    const modelResult = createLanguageModel(body.model, provider, userApiKey)
    if (modelResult instanceof ChatError) return modelResult.toResponse()

    const stream = createDataStream({
        execute: async (dataStream) => {
            await ctx.runMutation(internal.threads.updateThreadStreamingState, {
                threadId: mutationResult.threadId,
                isLive: true,
                streamStartedAt: streamStartTime,
                currentStreamId: streamId
            })

            let nameGenerationPromise: Promise<string | ChatError> | undefined
            if (!body.id) {
                nameGenerationPromise = generateThreadName(
                    ctx,
                    mutationResult.threadId,
                    mapped_messages,
                    user.id
                )
            }

            dataStream.writeData({
                type: "thread_id",
                content: mutationResult.threadId
            })

            dataStream.writeData({
                type: "stream_id",
                content: streamId
            })

            const result = streamText({
                model: modelResult,
                maxSteps: 100,
                abortSignal: remoteCancel.signal,
                experimental_transform: smoothStream(),
                tools: getToolkit(ctx, body.enabledTools),
                messages: [
                    {
                        role: "system",
                        content: buildPrompt(body.enabledTools)
                    },
                    ...mapped_messages
                ],

                providerOptions: {
                    google: {
                        thinkingConfig: {
                            includeThoughts: true
                        }
                    } satisfies GoogleGenerativeAIProviderOptions
                }
            })

            dataStream.merge(
                result.fullStream.pipeThrough(
                    manualStreamTransform(parts, mutationResult.assistantMessageId)
                )
            )

            await result.consumeStream()
            remoteCancel.abort()

            await ctx.runMutation(internal.messages.patchMessage, {
                threadId: mutationResult.threadId,
                messageId: mutationResult.assistantMessageId,
                parts:
                    parts.length > 0
                        ? parts
                        : [
                              {
                                  type: "error",
                                  error: {
                                      code: "no-response",
                                      message:
                                          "The model did not generate a response. Please try again."
                                  }
                              }
                          ],
                metadata: {
                    modelId: "gpt-4.1-mini",
                    serverDurationMs: Date.now() - streamStartTime
                }
            })

            if (nameGenerationPromise) {
                const res = await nameGenerationPromise
                if (res instanceof ChatError) res.toResponse()
            }

            await ctx
                .runMutation(internal.threads.updateThreadStreamingState, {
                    threadId: mutationResult.threadId,
                    isLive: false,
                    currentStreamId: undefined
                })
                .catch((err) => console.error("Failed to update thread state:", err))
        },
        onError: (error) => {
            console.error("[cvx][chat][stream] Fatal error:", error)
            // Mark thread as not live on error
            ctx.runMutation(internal.threads.updateThreadStreamingState, {
                threadId: mutationResult.threadId,
                isLive: false
            }).catch((err) => console.error("Failed to update thread state:", err))
            return "Stream error occurred"
        }
    })

    const streamContext = getResumableStreamContext()
    if (streamContext) {
        return new Response(
            (await streamContext.resumableStream(streamId, () => stream))?.pipeThrough(
                new TextEncoderStream()
            ),
            RESPONSE_OPTS
        )
    }

    return new Response(stream.pipeThrough(new TextEncoderStream()), RESPONSE_OPTS)
})
