import type {
    AssistantContent,
    CoreAssistantMessage,
    CoreToolMessage,
    CoreUserMessage,
    UserContent
} from "ai"
import type { Infer } from "convex/values"
import type { Message } from "../schema/message"

export type CoreMessage = (CoreAssistantMessage | CoreToolMessage | CoreUserMessage) & {
    messageId: string
}

export const dbMessagesToCore = async (
    messages: Infer<typeof Message>[]
): Promise<CoreMessage[]> => {
    const mapped_messages: CoreMessage[] = []
    for await (const message of messages) {
        const to_commit_messages: ((CoreAssistantMessage | CoreToolMessage | CoreUserMessage) & {
            messageId: string
        })[] = []
        if (message.role === "user") {
            const mapped_content: UserContent = []

            for (const p of message.parts) {
                if (p.type === "text") {
                    mapped_content.push({ type: "text", text: p.text })
                }
                //  todo: handle images,files
            }

            if (mapped_content.length === 0) {
                console.log(`[cvx][chat] Skipping message with no content: ${message.messageId}`)
                continue
            }

            const lastMessage = mapped_messages[mapped_messages.length - 1]
            if (
                lastMessage &&
                lastMessage.role === "user" &&
                typeof lastMessage.content === "object"
            ) {
                lastMessage.content.push(...mapped_content)
            } else {
                to_commit_messages.unshift({
                    role: "user",
                    messageId: message.messageId,
                    content: mapped_content
                })
            }
        } else if (message.role === "assistant") {
            const mapped_content: AssistantContent = []
            for (const p of message.parts) {
                if (p.type === "text") {
                    mapped_content.push({ type: "text", text: p.text })
                } else if (p.type === "file") {
                    mapped_content.push({
                        type: "file",
                        mimeType: p.mimeType || "application/octet-stream",
                        filename: p.filename || "",
                        data: p.assetUrl || ""
                    })
                } else if (p.type === "tool-invocation") {
                    mapped_content.push({
                        type: "tool-call",
                        toolCallId: p.toolInvocation.toolCallId,
                        toolName: p.toolInvocation.toolName,
                        args: p.toolInvocation.args
                    })
                    to_commit_messages.push({
                        role: "tool",
                        messageId: `${message.messageId}-${p.toolInvocation.toolCallId}`,
                        content: [
                            {
                                type: "tool-result",
                                toolCallId: p.toolInvocation.toolCallId,
                                toolName: p.toolInvocation.toolName,
                                result: p.toolInvocation.result
                            }
                        ]
                    })
                } else if (p.type === "reasoning") {
                    mapped_content.push({
                        type: "reasoning",
                        text: p.reasoning
                    })
                }
            }

            if (mapped_content.length === 0) {
                continue
            }

            const lastMessage = mapped_messages[mapped_messages.length - 1]
            if (
                lastMessage &&
                lastMessage.role === "assistant" &&
                to_commit_messages.length === 0 &&
                typeof lastMessage.content === "object"
            ) {
                lastMessage.content.push(...mapped_content)
            } else {
                to_commit_messages.unshift({
                    role: "assistant",
                    messageId: message.messageId,
                    content: mapped_content
                })
            }
        }

        mapped_messages.push(...to_commit_messages)
    }

    return mapped_messages
}
