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

    // Track if we've ever been in a streaming state
    useEffect(() => {
        if (status === "streaming") {
            hasEverStreamed.current = true
        }
    }, [status])

    // Track message count changes
    useEffect(() => {
        if (messages.length > lastKnownMessageCount.current) {
            lastKnownMessageCount.current = messages.length
        }
    }, [messages.length])

    // Reset state when thread changes
    useEffect(() => {
        // Detect thread change
        if (threadId !== currentThreadId.current) {
            console.log("[useAutoResume] Thread changed:", {
                from: currentThreadId.current,
                to: threadId
            })

            // Reset all tracking state for new thread
            hasAttemptedResume.current = false
            hasEverStreamed.current = false
            lastKnownMessageCount.current = 0
            lastKnownStreamStartTime.current = undefined
            currentThreadId.current = threadId
        }
    }, [threadId])

    // Handle auto-resume based on thread state
    useEffect(() => {
        if (!autoResume) return
        if (loadingMessages !== "ready") return
        if (!thread?.isLive || !thread?.streamStartedAt) return
        if (!threadId) return

        // Capture values to avoid closure issues
        const streamStartedAt = thread.streamStartedAt
        const isLive = thread.isLive

        // Check if this is a new stream for this thread
        const isNewStream = streamStartedAt !== lastKnownStreamStartTime.current

        // Add a small delay to prevent race conditions when status changes
        const timeoutId = setTimeout(() => {
            if (hasAttemptedResume.current && !isNewStream) return

            // Don't resume if we've already streamed this specific stream
            if (hasEverStreamed.current && !isNewStream) return

            // Don't resume if stream is stale
            if (Date.now() - streamStartedAt >= STREAM_TIMEOUT_MS) return

            // Don't resume if currently streaming
            if (status === "streaming" || status === "submitted") return

            // Check if messages have already been updated beyond initial state
            const messagesMatchInitial =
                messages.length === initialMessages.length &&
                messages.every((msg, idx) => msg.id === initialMessages[idx]?.id)

            // Only resume if messages still match initial (haven't received updates yet)
            if (!messagesMatchInitial) {
                // Messages have diverged from initial, we're already receiving updates
                return
            }

            // Additional check: if we have an assistant message with content, we're likely already synced
            const lastMessage = messages[messages.length - 1]
            if (
                lastMessage?.role === "assistant" &&
                lastMessage.content &&
                lastMessage.content.trim() !== ""
            ) {
                return
            }

            console.log("[useAutoResume] Resuming stream:", {
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
            const message = JSON.parse(dataPart.message) as UIMessage
            setMessages([...initialMessages, message])
        }
    }, [data, initialMessages, setMessages])
}
