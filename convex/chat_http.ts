import type {
    DataStreamString,
    FileUIPart,
    ReasoningUIPart,
    TextUIPart,
    ToolInvocationUIPart
} from "@ai-sdk/ui-utils"

import { ChatError } from "@/lib/errors"
import { Redis } from "@upstash/redis"
import {
    type TextStreamPart,
    type ToolCall,
    createDataStream,
    formatDataStreamPart,
    smoothStream,
    streamText
} from "ai"
import type { Infer } from "convex/values"
import { differenceInSeconds } from "date-fns"
import {
    type ResumableStreamContext,
    type Subscriber,
    createResumableStreamContext
} from "resumable-stream"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { httpAction, query } from "./_generated/server"
import { dbMessagesToCore } from "./lib/db_to_core_messages"
import { getUserIdentity } from "./lib/identity"
import { createLanguageModel, getProviderFromModelId } from "./lib/models"
import type { Thread } from "./schema"
import type { HTTPAIMessage } from "./schema/message"
import type { ErrorUIPart } from "./schema/parts"

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

const globalAbortSignals: Record<string, AbortController> = {}
let globalStreamContext: ResumableStreamContext | null = null
const getStreamContext = () => {
    if (!globalStreamContext) {
        if (!process.env.UPSTASH_REDIS_REST_URL) {
            console.log(" > Resumable streams are disabled due to missing UPSTASH_REDIS_REST_URL")
            return null
        }
        if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
            console.log(" > Resumable streams are disabled due to missing UPSTASH_REDIS_REST_TOKEN")
            return null
        }

        try {
            globalStreamContext = createResumableStreamContext({
                waitUntil: (promise) => promise,
                subscriber: {
                    connect: async () => {},
                    subscribe: (async (channel: string, callback: (message: string) => void) => {
                        const subscriber = redis.subscribe(channel)
                        subscriber.on("message", (message) => {
                            callback((message.message as any).toString())
                        })
                        const controller = new AbortController()
                        controller.signal.addEventListener("abort", () => {
                            subscriber.unsubscribe()
                        })
                        globalAbortSignals[channel] = controller
                        return
                    }) satisfies Subscriber["subscribe"],
                    unsubscribe: (async (channel: string) => {
                        globalAbortSignals[channel]?.abort()
                        delete globalAbortSignals[channel]
                        return undefined as unknown
                    }) satisfies Subscriber["unsubscribe"]
                },
                publisher: {
                    connect: async () => {},
                    publish: async (channel: string, message: string) => {
                        return await redis.publish(channel, message)
                    },
                    set: async (key: string, value: string, options?: { EX?: number }) => {
                        if (options?.EX) {
                            return await redis.set(key, value, { ex: options.EX })
                        }
                        return await redis.set(key, value)
                    },
                    get: async (key: string) => {
                        return (await redis.get(key)) as string | number | null
                    },
                    incr: async (key: string) => {
                        return await redis.incr(key)
                    }
                }
            })
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes("REDIS_URL")) {
                console.log(" > Resumable streams are disabled due to missing REDIS_URL")
            } else {
                console.error(error)
            }
        }
    }

    return globalStreamContext
}

export const chatPOST = httpAction(async (ctx, req) => {
    const body: {
        id?: string
        message: Infer<typeof HTTPAIMessage>
        model: string
        proposedNewAssistantId: string
    } = await req.json()
    const user = await getUserIdentity(ctx.auth, { allowAnons: true })
    if ("error" in user) return new ChatError("unauthorized:chat").toResponse()

    const mutationResult = await ctx.runMutation(internal.threads.createThreadOrInsertMessages, {
        threadId: body.id as Id<"threads">,
        authorId: user.id,
        userMessage: "message" in body ? body.message : undefined,
        proposedNewAssistantId: body.proposedNewAssistantId
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

    if (!provider) {
        return new ChatError("bad_request:api", "Unsupported model").toResponse()
    }

    const userApiKey = await ctx.runQuery(internal.apikeys.getDecryptedApiKey, {
        userId: user.id,
        provider
    })

    const modelResult = createLanguageModel(body.model, provider, userApiKey)

    if (!modelResult) {
        return new ChatError("bad_request:api", "No model found").toResponse()
    }

    if (modelResult instanceof ChatError) {
        return modelResult.toResponse()
    }

    const stream = createDataStream({
        execute: async (dataStream) => {
            dataStream.writeData({
                type: "thread_id",
                content: mutationResult.threadId
            })

            let reasoningStartedAt = -1

            const appendTextPart = (text: string, type: "text" | "reasoning") => {
                if (parts.length > 0 && parts[parts.length - 1]?.type === type) {
                    if (type === "text") {
                        ;(parts[parts.length - 1] as TextUIPart).text += text
                    } else if (type === "reasoning") {
                        ;(parts[parts.length - 1] as ReasoningUIPart).reasoning += text
                        ;(
                            parts[parts.length - 1] as ReasoningUIPart & {
                                duration?: number
                            }
                        ).duration = Date.now() - reasoningStartedAt
                    }
                } else {
                    if (type === "text") {
                        parts.push({
                            type: "text",
                            text
                        })
                    } else if (type === "reasoning") {
                        if (reasoningStartedAt === -1) {
                            reasoningStartedAt = Date.now()
                        }
                        parts.push({
                            type: "reasoning",
                            reasoning: text,
                            details: []
                        })
                    }
                }
            }

            const result = streamText({
                model: modelResult,
                abortSignal: remoteCancel.signal,
                experimental_transform: smoothStream(),
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant."
                    },
                    ...mapped_messages.reverse()
                ]
            })

            dataStream.merge(
                result.fullStream.pipeThrough(
                    new TransformStream<TextStreamPart<any>, DataStreamString>({
                        transform: async (chunk, controller) => {
                            const chunkType = chunk.type
                            switch (chunkType) {
                                case "text-delta": {
                                    controller.enqueue(
                                        formatDataStreamPart("text", chunk.textDelta)
                                    )
                                    appendTextPart(chunk.textDelta, "text")
                                    break
                                }

                                case "reasoning": {
                                    controller.enqueue(
                                        formatDataStreamPart("reasoning", chunk.textDelta)
                                    )
                                    appendTextPart(chunk.textDelta, "reasoning")
                                    break
                                }

                                case "redacted-reasoning": {
                                    controller.enqueue(
                                        formatDataStreamPart("redacted_reasoning", {
                                            data: chunk.data
                                        })
                                    )
                                    appendTextPart(chunk.data, "reasoning")
                                    break
                                }

                                case "reasoning-signature": {
                                    controller.enqueue(
                                        formatDataStreamPart("reasoning_signature", {
                                            signature: chunk.signature
                                        })
                                    )
                                    break
                                }

                                case "file": {
                                    controller.enqueue(
                                        formatDataStreamPart("file", {
                                            mimeType: chunk.mimeType,
                                            data: chunk.base64
                                        })
                                    )
                                    break
                                }

                                case "source": {
                                    controller.enqueue(formatDataStreamPart("source", chunk.source))
                                    break
                                }

                                case "tool-call-streaming-start": {
                                    controller.enqueue(
                                        formatDataStreamPart("tool_call_streaming_start", {
                                            toolCallId: chunk.toolCallId,
                                            toolName: chunk.toolName
                                        })
                                    )
                                    break
                                }

                                case "tool-call-delta": {
                                    controller.enqueue(
                                        formatDataStreamPart("tool_call_delta", {
                                            toolCallId: chunk.toolCallId,
                                            argsTextDelta: chunk.argsTextDelta
                                        })
                                    )
                                    break
                                }

                                case "tool-call": {
                                    controller.enqueue(
                                        formatDataStreamPart("tool_call", {
                                            toolCallId: chunk.toolCallId,
                                            toolName: chunk.toolName,
                                            args: chunk.args
                                        } as ToolCall<string, any>)
                                    )

                                    parts.push({
                                        type: "tool-invocation",
                                        toolInvocation: {
                                            state: "call",
                                            args: chunk.args,
                                            toolCallId: chunk.toolCallId,
                                            toolName: chunk.toolName
                                        }
                                    })
                                    break
                                }

                                case "tool-result": {
                                    controller.enqueue(
                                        formatDataStreamPart("tool_result", {
                                            toolCallId: chunk.toolCallId,
                                            result: chunk.result
                                        })
                                    )

                                    const found = parts.findIndex(
                                        (p) =>
                                            p.type === "tool-invocation" &&
                                            p.toolInvocation.toolCallId === chunk.toolCallId
                                    )
                                    if (found !== -1) {
                                        const _part = parts[found] as ToolInvocationUIPart
                                        _part.toolInvocation.state = "result"
                                        ;(_part.toolInvocation as any).result = chunk.result
                                    }

                                    break
                                }

                                case "error": {
                                    console.error(`[cvx][chat][stream] Error: ${chunk.error}`)
                                    let error_message = "An error occurred"
                                    if (typeof chunk.error === "string") {
                                        error_message = chunk.error
                                    } else if (chunk.error instanceof Error) {
                                        error_message = chunk.error.message
                                    } else if ("error" in (chunk.error as any)) {
                                        if (
                                            (chunk.error as { error: Error }).error instanceof Error
                                        ) {
                                            error_message = (chunk.error as { error: Error }).error
                                                .message
                                        } else {
                                            error_message = (
                                                chunk.error as { error: { error: any } }
                                            ).error.error.toString()
                                        }
                                    }

                                    parts.push({
                                        type: "error",
                                        error: {
                                            code: "unknown",
                                            message: error_message
                                        }
                                    })
                                    controller.enqueue(formatDataStreamPart("error", error_message))
                                    break
                                }

                                case "step-start": {
                                    controller.enqueue(
                                        formatDataStreamPart("start_step", {
                                            messageId: mutationResult.assistantMessageId
                                        })
                                    )
                                    break
                                }

                                case "step-finish": {
                                    controller.enqueue(
                                        formatDataStreamPart("finish_step", {
                                            finishReason: chunk.finishReason,
                                            usage: {
                                                promptTokens: chunk.usage.promptTokens,
                                                completionTokens: chunk.usage.completionTokens
                                            },
                                            isContinued: chunk.isContinued
                                        })
                                    )
                                    break
                                }

                                case "finish": {
                                    break
                                }

                                default: {
                                    const exhaustiveCheck: never = chunkType
                                    throw new Error(`Unknown chunk type: ${exhaustiveCheck}`)
                                }
                            }
                        }
                    })
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
        }
    })

    const streamContext = getStreamContext()
    if (streamContext) {
        console.log(" > Resumable stream context found")
        return new Response(
            (await streamContext.resumableStream(streamId, () => stream))?.pipeThrough(
                new TextEncoderStream()
            ),
            {
                status: 200,
                statusText: "OK",
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-Vercel-AI-Data-Stream": "v1",
                    "Keep-Alive": "timeout=5, max=100"
                }
            }
        )
    }

    return new Response(stream.pipeThrough(new TextEncoderStream()), {
        status: 200,
        statusText: "OK",
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Vercel-AI-Data-Stream": "v1",
            "Keep-Alive": "timeout=5, max=100"
        }
    })
})

export const chatGET = httpAction(async (ctx, req) => {
    const streamContext = getStreamContext()
    const resumeRequestedAt = new Date()

    if (!streamContext) {
        return new Response(null, { status: 204 })
    }

    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get("threadId")
    if (!threadId) return new ChatError("bad_request:api").toResponse()

    const session = await getUserIdentity(ctx.auth, { allowAnons: false })

    if ("error" in session) return new ChatError("unauthorized:chat").toResponse()

    let chat: Infer<typeof Thread> | null

    try {
        chat = await ctx.runQuery(internal.threads.getThreadById, {
            threadId: threadId as Id<"threads">
        })
    } catch {
        return new ChatError("not_found:chat").toResponse()
    }

    if (!chat) return new ChatError("not_found:chat").toResponse()

    if (chat.authorId !== session.id) return new ChatError("forbidden:chat").toResponse()

    const streams = await ctx.runQuery(internal.streams.getStreamsByThreadId, {
        threadId: threadId as Id<"threads">
    })

    if (!streams.length) return new ChatError("not_found:stream").toResponse()

    const recentStreamId = streams.at(-1)

    if (!recentStreamId) return new ChatError("not_found:stream").toResponse()

    const emptyDataStream = createDataStream({
        execute: () => {}
    })

    const stream = await streamContext.resumableStream(recentStreamId._id, () => emptyDataStream)

    /*
     * For when the generation is streaming during SSR
     * but the resumable stream has concluded at this point.
     */
    if (!stream) {
        const messages = await ctx.runQuery(internal.messages.getMessagesByThreadId, {
            threadId: threadId as Id<"threads">
        })
        const mostRecentMessage = messages.at(-1)

        if (!mostRecentMessage) {
            return new Response(emptyDataStream, { status: 200 })
        }

        if (mostRecentMessage.role !== "assistant") {
            return new Response(emptyDataStream, { status: 200 })
        }

        const messageCreatedAt = new Date(mostRecentMessage.createdAt)

        if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
            return new Response(emptyDataStream, { status: 200 })
        }

        const restoredStream = createDataStream({
            execute: (buffer) => {
                buffer.writeData({
                    type: "append-message",
                    message: JSON.stringify(mostRecentMessage)
                })
            }
        })

        return new Response(restoredStream, { status: 200 })
    }

    return new Response(stream, { status: 200 })
})

export const demo = query(async (ctx) => {
    const user = await getUserIdentity(ctx.auth, { allowAnons: true })
    if ("error" in user) {
        return "Unauthorized"
    }
    return user.id
})
