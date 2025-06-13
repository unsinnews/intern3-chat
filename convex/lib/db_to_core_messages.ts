import type {
    AssistantContent,
    CoreAssistantMessage,
    CoreToolMessage,
    CoreUserMessage,
    ToolCallPart,
    ToolContent,
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
            const tool_calls: ToolCallPart[] = []
            const tool_results: ToolContent = []

            // First pass: collect all content and tool results separately
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
                    tool_calls.push({
                        type: "tool-call",
                        toolCallId: p.toolInvocation.toolCallId,
                        toolName: p.toolInvocation.toolName,
                        args: p.toolInvocation.args
                    })
                    // Collect tool results separately
                    tool_results.push({
                        type: "tool-result",
                        toolCallId: p.toolInvocation.toolCallId,
                        toolName: p.toolInvocation.toolName,
                        result: p.toolInvocation.result
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

            // Check if we should merge with the last assistant message
            const lastMessage = mapped_messages[mapped_messages.length - 1]

            if (
                lastMessage &&
                lastMessage.role === "assistant" &&
                tool_calls.length === 0 && // Don't merge if current message has tool results
                typeof lastMessage.content === "object"
            ) {
                // Merge with previous assistant message
                lastMessage.content.push(...mapped_content)
            } else {
                if (tool_calls.length > 0) {
                    to_commit_messages.unshift({
                        role: "assistant",
                        messageId: `${message.messageId}-tool-call`,
                        content: tool_calls
                    })
                    to_commit_messages.unshift({
                        role: "tool",
                        messageId: `${message.messageId}-tool-result`,
                        content: tool_results
                    })
                }

                // Create new assistant message
                to_commit_messages.unshift({
                    role: "assistant",
                    messageId: message.messageId,
                    content: mapped_content
                })
            }
        }

        mapped_messages.push(...to_commit_messages)
    }

    mapped_messages.reverse()

    // console.log("[cvx][chat] mapped_messages", mapped_messages.length)
    // for (let i = 0; i < mapped_messages.length; i++) {
    //     const m = mapped_messages[i]
    //     const roughContent =
    //         typeof m.content === "object"
    //             ? m.content
    //                   .map((c) => (c.type === "text" ? c.text.slice(0, 100) : `[${c.type}]`))
    //                   .join(",")
    //             : m.content
    //     console.log(` History[${i}](${m.role}) ${roughContent}`)
    // }
    return mapped_messages
}
