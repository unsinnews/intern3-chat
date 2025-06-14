import { useChatStore } from "@/lib/chat-store"
import type { UIMessage } from "ai"
import { nanoid } from "nanoid"
import { useCallback } from "react"
import { useChatIntegration } from "./use-chat-integration"

export function useChatActions({ threadId }: { threadId: string | undefined }) {
    const { files, setFiles, setTargetFromMessageId, setTargetMode } = useChatStore()
    const { status, append, stop, data, messages, setMessages, reload } = useChatIntegration({
        threadId
    })

    const handleInputSubmit = useCallback(
        (inputValue?: string, fileValues?: File[]) => {
            if (status === "streaming") {
                stop()
                return
            }

            if (status === "submitted") {
                return
            }

            if (!inputValue || !inputValue.trim()) {
                return
            }

            const finalInput = inputValue
            const finalFiles = fileValues ?? files

            if (finalInput?.trim() || (finalFiles && finalFiles.length > 0)) {
                setFiles([])
            }

            append({
                id: nanoid(),
                role: "user",
                content: inputValue,
                parts: [{ type: "text", text: inputValue }],
                createdAt: new Date()
            })

            setFiles([])
        },
        [append, stop, status, files, setFiles]
    )

    const handleRetry = useCallback(
        (message: UIMessage) => {
            const messageIndex = messages.findIndex((m) => m.id === message.id)
            if (messageIndex === -1) return

            const messagesUpToRetry = messages.slice(0, messageIndex + 1)
            console.log("[CA:handleRetry]", {
                messages,
                messagesUpToRetry: messagesUpToRetry.length,
                messageIndex,
                messageId: message.id
            })
            setMessages(messagesUpToRetry)
            setTargetFromMessageId(undefined)
            setTargetMode("normal")
            reload({
                body: {
                    targetMode: "retry",
                    targetFromMessageId: message.id
                }
            })
        },
        [messages, setMessages, reload]
    )

    const handleEditAndRetry = useCallback(
        (messageId: string, newContent: string) => {
            const messageIndex = messages.findIndex((m) => m.id === messageId)
            if (messageIndex === -1) return

            // Truncate messages and update the edited message
            const messagesUpToEdit = messages.slice(0, messageIndex)
            const updatedEditedMessage = {
                ...messages[messageIndex],
                content: newContent,
                parts: [{ type: "text" as const, text: newContent }]
            }

            console.log("alarm:handleEditAndRetry", {
                messagesUpToEdit: messagesUpToEdit.length,
                messageIndex,
                messageId
            })
            setMessages([...messagesUpToEdit, updatedEditedMessage])
            setTargetFromMessageId(undefined)
            setTargetMode("normal")
            reload({
                body: {
                    targetMode: "edit",
                    targetFromMessageId: messageId
                }
            })
        },
        [messages, setMessages, setTargetFromMessageId, reload]
    )

    return {
        handleInputSubmit,
        handleRetry,
        handleEditAndRetry
    }
}
