import type { Message as AIUIMessage } from "ai"
import type { Infer } from "convex/values"
import type { Message } from "../schema"

type AIUIMessageWithParts = Omit<AIUIMessage, "parts"> & {
    parts: NonNullable<AIUIMessage["parts"]>
}

export const backendToUiMessages = (messages: Infer<typeof Message>[]): AIUIMessageWithParts[] => {
    if (!messages || messages.length === 0) {
        return []
    }

    const result = messages.map((message) => {
        const uiMessage: AIUIMessageWithParts = {
            id: message.messageId,
            role: message.role,
            createdAt: new Date(message.createdAt),
            content: message.parts?.find((p) => p.type === "text")?.text || "",
            parts: (message.parts as unknown as NonNullable<AIUIMessage["parts"]>) ?? []
        }
        return uiMessage
    })

    return result
}
