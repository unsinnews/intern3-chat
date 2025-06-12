import type { Message as AIUIMessage } from "ai"
import type { Infer } from "convex/values"
import type { Message } from "../schema"

export const backendToUiMessages = (messages: Infer<typeof Message>[]): AIUIMessage[] => {
    if (!messages || messages.length === 0) {
        return []
    }

    const result = messages.map((message) => {
        const uiMessage: AIUIMessage = {
            id: message.messageId,
            role: message.role,
            createdAt: new Date(message.createdAt),
            content: message.parts?.find((p) => p.type === "text")?.text || "",
            parts: message.parts as any
        }
        return uiMessage
    })

    return result
}
