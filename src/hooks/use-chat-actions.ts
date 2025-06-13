import { useChatStore } from "@/lib/chat-store"
import type { UseChatHelpers } from "@ai-sdk/react"
import { nanoid } from "nanoid"
import { useCallback } from "react"

interface UseChatActionsProps {
    append: UseChatHelpers["append"]
    stop: UseChatHelpers["stop"]
    status: UseChatHelpers["status"]
}

export function useChatActions({ append, stop, status }: UseChatActionsProps) {
    const { files, setFiles } = useChatStore()

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

    return {
        handleInputSubmit
    }
}
