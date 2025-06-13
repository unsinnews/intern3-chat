"use client"

import type { Thread } from "@/convex/schema/thread"
import type { Infer } from "convex/values"
import { useEffect } from "react"
import { useChatStore } from "@/lib/chat-store"

export interface AutoResumeProps {
    autoResume: boolean
    thread?: Infer<typeof Thread>
    threadId?: string
    experimental_resume: () => void
    status?: "idle" | "streaming" | "submitted" | string
}

export function useAutoResume({
    autoResume,
    thread,
    threadId,
    experimental_resume,
    status
}: AutoResumeProps) {
    const attachedStreamId = useChatStore((s) =>
        threadId ? s.attachedStreamIds[threadId] : undefined
    )
    const setAttachedStreamId = useChatStore((s) => s.setAttachedStreamId)
    const pending = useChatStore((s) => (threadId ? s.pendingStreams[threadId] : false))

    useEffect(() => {
        // Debug: log state each time effect runs (concise)
        // console.log("[AR:evaluate]", {
        //     t: threadId,
        //     live: !!thread?.isLive,
        //     cur: thread?.currentStreamId?.slice(0, 5),
        //     att: attachedStreamId?.slice(0, 5)
        // })

        if (!autoResume) return
        if (!threadId) return
        if (!thread?.isLive || !thread.currentStreamId) return
        if (pending) return // we initiated this stream, wait for stream_id

        if (attachedStreamId === thread.currentStreamId) {
            // Already attached to this live stream
            return
        }

        console.log("[AR:resume]", {
            t: threadId,
            cur: thread.currentStreamId.slice(0, 5),
            att: attachedStreamId?.slice(0, 5)
        })

        experimental_resume()
        // Optimistically mark as attached
        setAttachedStreamId(threadId, thread.currentStreamId)
    }, [
        autoResume,
        thread?.isLive,
        thread?.currentStreamId,
        threadId,
        attachedStreamId,
        pending,
        experimental_resume,
        status,
        setAttachedStreamId
    ])
}
