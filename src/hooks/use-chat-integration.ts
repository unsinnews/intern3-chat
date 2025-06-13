import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { backendToUiMessages } from "@/convex/lib/backend_to_ui_messages"
import { useToken } from "@/hooks/auth-hooks"
import { useAutoResume } from "@/hooks/use-auto-resume"
import { browserEnv } from "@/lib/browser-env"
import { useChatStore } from "@/lib/chat-store"
import { useModelStore } from "@/lib/model-store"
import { type Message, useChat } from "@ai-sdk/react"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery as useConvexQuery } from "convex/react"
import { useMemo } from "react"

interface UseChatIntegrationProps {
    threadId: string | undefined
}

export function useChatIntegration({ threadId }: UseChatIntegrationProps) {
    const tokenData = useToken()
    const queryClient = useQueryClient()
    const { selectedModel } = useModelStore()
    const {
        rerenderTrigger,
        shouldUpdateQuery,
        setShouldUpdateQuery,
        generateIdSeeded,
        setSeedNextId,
        triggerRerender
    } = useChatStore()

    const threadMessages = useConvexQuery(
        api.threads.getThreadMessages,
        threadId ? { threadId: threadId as Id<"threads"> } : "skip"
    )

    const thread = useConvexQuery(
        api.threads.getThread,
        threadId ? { threadId: threadId as Id<"threads"> } : "skip"
    )

    const initialMessages = useMemo(() => {
        if (!threadMessages || "error" in threadMessages) return []
        return backendToUiMessages(threadMessages)
    }, [threadMessages])

    const chatHelpers = useChat({
        id: threadId === undefined ? `new_chat_${rerenderTrigger}` : threadId,
        headers: {
            authorization: `Bearer ${tokenData.token}`
        },
        experimental_throttle: 50,
        experimental_prepareRequestBody(body) {
            if (threadId) {
                useChatStore.getState().setPendingStream(threadId, true)
            }
            const proposedNewAssistantId = generateIdSeeded()
            setSeedNextId(proposedNewAssistantId)

            const messages = body.messages as Message[]
            const message = messages[messages.length - 1]
            return {
                id: threadId,
                proposedNewAssistantId,
                model: selectedModel,
                message: {
                    parts: message?.parts,
                    role: message?.role,
                    messageId: message?.id
                }
            }
        },
        initialMessages,
        onFinish: () => {
            if (shouldUpdateQuery) {
                setShouldUpdateQuery(false)
                triggerRerender()
            }
        },
        api: `${browserEnv("VITE_CONVEX_API_URL")}/chat`,
        generateId: generateIdSeeded
    })

    useAutoResume({
        autoResume: true,
        thread: thread || undefined,
        threadId,
        experimental_resume: chatHelpers.experimental_resume,
        status: chatHelpers.status
    })

    return chatHelpers
}
