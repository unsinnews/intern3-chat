"use client"

import type { Thread } from "@/convex/schema"
import type { UseChatHelpers } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import type { Infer } from "convex/values"
import { useEffect, useRef } from "react"

export type DataPart = { type: "append-message"; message: string }

export interface Props {
    autoResume: boolean
    initialMessages: UIMessage[]
    loadingMessages: "loading" | "error" | "ready"
    experimental_resume: UseChatHelpers["experimental_resume"]
    data: UseChatHelpers["data"]
    setMessages: UseChatHelpers["setMessages"]
    thread?: Infer<typeof Thread>
    threadId?: string
    status: UseChatHelpers["status"]
    messages: UIMessage[]
}

const STREAM_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

export function useAutoResume({
    autoResume,
    initialMessages,
    loadingMessages,
    experimental_resume,
    data,
    setMessages,
    thread,
    threadId,
    status,
    messages
}: Props) {
    const hasAttemptedResume = useRef(false)
    const hasEverStreamed = useRef(false)
    const lastKnownMessageCount = useRef<number>(0)
    const currentThreadId = useRef<string | undefined>(undefined)
    const lastKnownStreamStartTime = useRef<number | undefined>(undefined)
    const sessionStartTime = useRef<number>(Date.now()) // Track when this hook instance started

    // Track if we've ever been in a streaming state
    useEffect(() => {
        if (status === "streaming") {
            hasEverStreamed.current = true
            console.log("[useAutoResume] Status changed to streaming", {
                threadId,
                hasEverStreamed: hasEverStreamed.current,
                messageCount: messages.length
            })
        }
        console.log("[useAutoResume] Status changed", {
            status,
            threadId,
            hasEverStreamed: hasEverStreamed.current,
            hasAttemptedResume: hasAttemptedResume.current
        })
    }, [status, threadId])

    // Track message count changes
    useEffect(() => {
        if (messages.length > lastKnownMessageCount.current) {
            console.log("[useAutoResume] Message count increased", {
                from: lastKnownMessageCount.current,
                to: messages.length,
                threadId,
                status
            })
            lastKnownMessageCount.current = messages.length
        }
    }, [messages.length, threadId, status])

    // Reset state when thread changes
    useEffect(() => {
        // Detect thread change
        if (threadId !== currentThreadId.current) {
            console.log("[useAutoResume] Thread changed:", {
                from: currentThreadId.current,
                to: threadId,
                resetState: true
            })

            // Only reset state if we're actually navigating between different threads
            // Don't reset if we're just getting the thread ID for the first time (undefined -> actual ID)
            const isInitialThreadIdAssignment =
                currentThreadId.current === undefined && threadId !== undefined
            const isActualThreadNavigation =
                currentThreadId.current !== undefined && threadId !== currentThreadId.current

            if (isActualThreadNavigation) {
                console.log("[useAutoResume] Actual thread navigation - resetting state")
                // Reset all tracking state for new thread
                hasAttemptedResume.current = false
                hasEverStreamed.current = false
                lastKnownMessageCount.current = 0
                lastKnownStreamStartTime.current = undefined
            } else if (isInitialThreadIdAssignment) {
                console.log(
                    "[useAutoResume] Initial thread ID assignment - keeping streaming state"
                )
                // Don't reset hasEverStreamed since we're just getting the thread ID
                // for a stream that may have already started in this session
                hasAttemptedResume.current = false
                lastKnownMessageCount.current = 0
                lastKnownStreamStartTime.current = undefined
            }

            currentThreadId.current = threadId
        }
    }, [threadId])

    // Handle auto-resume based on thread state
    useEffect(() => {
        console.log("[useAutoResume] Main effect triggered", {
            autoResume,
            loadingMessages,
            threadIsLive: thread?.isLive,
            threadStreamStartedAt: thread?.streamStartedAt,
            threadId,
            status,
            hasAttemptedResume: hasAttemptedResume.current,
            hasEverStreamed: hasEverStreamed.current,
            lastKnownStreamStartTime: lastKnownStreamStartTime.current,
            messageCount: messages.length,
            initialMessageCount: initialMessages.length
        })

        if (!autoResume) {
            console.log("[useAutoResume] Auto-resume disabled")
            return
        }
        if (loadingMessages !== "ready") {
            console.log("[useAutoResume] Messages not ready:", loadingMessages)
            return
        }
        if (!thread?.isLive || !thread?.streamStartedAt) {
            console.log("[useAutoResume] Thread not live or no stream start time", {
                isLive: thread?.isLive,
                streamStartedAt: thread?.streamStartedAt
            })
            return
        }
        if (!threadId) {
            console.log("[useAutoResume] No thread ID")
            return
        }

        // Capture values to avoid closure issues
        const streamStartedAt = thread.streamStartedAt
        const isLive = thread.isLive

        // Check if this is a new stream for this thread
        const isNewStream = streamStartedAt !== lastKnownStreamStartTime.current
        console.log("[useAutoResume] Stream analysis", {
            streamStartedAt,
            lastKnownStreamStartTime: lastKnownStreamStartTime.current,
            isNewStream,
            streamAge: Date.now() - streamStartedAt
        })

        // Add a small delay to prevent race conditions when status changes
        const timeoutId = setTimeout(() => {
            console.log("[useAutoResume] Timeout callback executing", {
                hasAttemptedResume: hasAttemptedResume.current,
                isNewStream,
                hasEverStreamed: hasEverStreamed.current,
                status,
                streamAge: Date.now() - streamStartedAt
            })

            if (hasAttemptedResume.current && !isNewStream) {
                console.log("[useAutoResume] Already attempted resume for this stream")
                return
            }

            // Don't resume if we've already streamed this specific stream
            if (hasEverStreamed.current && !isNewStream) {
                console.log("[useAutoResume] Already streamed this specific stream")
                return
            }

            // Don't resume if stream is stale
            if (Date.now() - streamStartedAt >= STREAM_TIMEOUT_MS) {
                console.log("[useAutoResume] Stream is stale", {
                    streamAge: Date.now() - streamStartedAt,
                    timeout: STREAM_TIMEOUT_MS
                })
                return
            }

            // Don't resume if this is a very recent stream and we've streamed before
            // This prevents resuming streams we just initiated in this session
            const streamAge = Date.now() - streamStartedAt
            const sessionAge = Date.now() - sessionStartTime.current
            if (hasEverStreamed.current && streamAge < 10000 && sessionAge < 30000) {
                console.log(
                    "[useAutoResume] Very recent stream in current session - likely our own stream",
                    {
                        streamAge,
                        sessionAge,
                        hasEverStreamed: hasEverStreamed.current
                    }
                )
                return
            }

            // Don't resume if currently streaming
            if (status === "streaming" || status === "submitted") {
                console.log("[useAutoResume] Currently streaming or submitted", { status })
                return
            }

            // Check if messages have already been updated beyond initial state
            const messagesMatchInitial =
                messages.length === initialMessages.length &&
                messages.every((msg, idx) => msg.id === initialMessages[idx]?.id)

            console.log("[useAutoResume] Message comparison", {
                messagesLength: messages.length,
                initialLength: initialMessages.length,
                messagesMatchInitial,
                lastMessageIds: messages.slice(-2).map((m) => ({
                    id: m.id,
                    role: m.role,
                    contentLength: m.content?.length || 0
                })),
                lastInitialIds: initialMessages
                    .slice(-2)
                    .map((m) => ({ id: m.id, role: m.role, contentLength: m.content?.length || 0 }))
            })

            // Only resume if messages still match initial (haven't received updates yet)
            if (!messagesMatchInitial) {
                // Messages have diverged from initial, we're already receiving updates
                console.log(
                    "[useAutoResume] Messages have diverged from initial - already receiving updates"
                )
                return
            }

            // Additional check: if we have an assistant message with content, we're likely already synced
            const lastMessage = messages[messages.length - 1]
            if (
                lastMessage?.role === "assistant" &&
                lastMessage.content &&
                lastMessage.content.trim() !== ""
            ) {
                console.log("[useAutoResume] Last message is complete assistant message", {
                    lastMessageRole: lastMessage.role,
                    contentLength: lastMessage.content?.length,
                    contentPreview: lastMessage.content?.substring(0, 50) + "..."
                })
                return
            }

            console.log("[useAutoResume] 🚀 RESUMING STREAM:", {
                threadId,
                isLive,
                streamAge: Date.now() - streamStartedAt,
                status,
                hasEverStreamed: hasEverStreamed.current,
                isNewStream,
                messagesMatchInitial,
                messageCount: messages.length,
                initialCount: initialMessages.length
            })

            hasAttemptedResume.current = true
            lastKnownStreamStartTime.current = streamStartedAt
            experimental_resume()
        }, 100) // 100ms delay to let local state settle

        return () => clearTimeout(timeoutId)
    }, [
        loadingMessages,
        thread,
        threadId,
        status,
        autoResume,
        experimental_resume,
        messages,
        initialMessages
    ])

    // Reset flags when navigating to a different thread
    useEffect(() => {
        // Reset on thread change (detected by message count dropping or thread ID change)
        if (messages.length < lastKnownMessageCount.current) {
            console.log("[useAutoResume] Message count dropped - resetting flags", {
                from: lastKnownMessageCount.current,
                to: messages.length
            })
            hasAttemptedResume.current = false
            hasEverStreamed.current = false
            lastKnownMessageCount.current = messages.length
        }
    }, [messages.length])

    // Handle append-message data parts
    useEffect(() => {
        if (!data || data.length === 0) return

        const dataPart = data[0] as DataPart

        if (dataPart.type === "append-message") {
            console.log("[useAutoResume] Handling append-message data part", {
                message: JSON.parse(dataPart.message)
            })
            const message = JSON.parse(dataPart.message) as UIMessage
            setMessages([...initialMessages, message])
        }
    }, [data, initialMessages, setMessages])
}
