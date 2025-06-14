import type {
    FileUIPart,
    ReasoningUIPart,
    TextUIPart,
    ToolInvocationUIPart
} from "@ai-sdk/ui-utils"

import { ChatError } from "@/lib/errors"
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google"
import { createDataStream, smoothStream, streamText } from "ai"
import type { Infer } from "convex/values"
import { internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import { httpAction } from "../_generated/server"
import { dbMessagesToCore } from "../lib/db_to_core_messages"
import { getUserIdentity } from "../lib/identity"
import { MODELS_SHARED, getLanguageModel } from "../lib/models"
import { getResumableStreamContext } from "../lib/resumable_stream_context"
import { type AbilityId, getToolkit } from "../lib/toolkit"
import type { HTTPAIMessage } from "../schema/message"
import type { ErrorUIPart } from "../schema/parts"
import { generateThreadName } from "./generate_thread_name"
import { manualStreamTransform } from "./manual_stream_transform"
import { buildPrompt } from "./prompt"
import { RESPONSE_OPTS } from "./shared"

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

    const model = MODELS_SHARED.find((m) => m.id === body.model)
    if (!model) return new ChatError("bad_request:api", "Unsupported model").toResponse()

    const userApiKeys = await ctx.runQuery(internal.apikeys.getAllApiKeys)
    if ("error" in userApiKeys) return new ChatError("unauthorized:chat").toResponse()

    const modelResult = getLanguageModel(model.id, userApiKeys)
    if (modelResult instanceof ChatError) return modelResult.toResponse()

    // Track token usage
    const totalTokenUsage = {
        promptTokens: 0,
        completionTokens: 0,
        reasoningTokens: 0
    }

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

            // Consume the stream and collect usage info
            for await (const chunk of result.fullStream) {
                if (chunk.type === "step-finish" && chunk.usage) {
                    totalTokenUsage.promptTokens += chunk.usage.promptTokens || 0
                    totalTokenUsage.completionTokens += chunk.usage.completionTokens || 0
                    totalTokenUsage.reasoningTokens += chunk.usage.reasoningTokens || 0
                }
            }

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
                    modelId: body.model, // Use the actual selected model
                    promptTokens: totalTokenUsage.promptTokens,
                    completionTokens: totalTokenUsage.completionTokens,
                    reasoningTokens: totalTokenUsage.reasoningTokens,
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
