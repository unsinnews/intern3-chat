import type { useChat } from "@ai-sdk/react"
import { nanoid } from "nanoid"

import { ModelSelector } from "@/components/model-selector"
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    PromptInputTextarea
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import type { modelSchema } from "@/convex/lib/models"
import { useModelStore } from "@/lib/model-store"
import { ArrowUp, Paperclip, Square, X } from "lucide-react"
import { useRef, useState } from "react"
import type { z } from "zod"

export function MultimodalInput({
    models,
    append
}: {
    models: z.infer<typeof modelSchema>[]
    append: ReturnType<typeof useChat>["append"]
}) {
    const { selectedModel, setSelectedModel } = useModelStore()
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const uploadInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async () => {
        if (input.trim() || files.length > 0) {
            setIsLoading(true)
            await append({
                id: nanoid(),
                role: "user",
                content: input,
                parts: [{ type: "text", text: input }],
                createdAt: new Date()
            })
            setIsLoading(false)
            setInput("")
            setFiles([])
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files)
            setFiles((prev) => [...prev, ...newFiles])
        }
    }

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
        if (uploadInputRef?.current) {
            uploadInputRef.current.value = ""
        }
    }

    return (
        <PromptInput
            value={input}
            onValueChange={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-2xl"
        >
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
                        >
                            <Paperclip className="size-4" />
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <button
                                onClick={() => handleRemoveFile(index)}
                                className="rounded-full p-1 hover:bg-secondary/50"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <PromptInputTextarea placeholder="Ask me anything..." />

            <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                    {selectedModel && (
                        <ModelSelector
                            models={models}
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                        />
                    )}
                    <PromptInputAction tooltip="Attach files">
                        <label
                            htmlFor="file-upload"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl hover:bg-secondary-foreground/10"
                        >
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <Paperclip className="size-5 text-primary" />
                        </label>
                    </PromptInputAction>
                </div>

                <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
                    <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleSubmit}
                    >
                        {isLoading ? (
                            <Square className="size-5 fill-current" />
                        ) : (
                            <ArrowUp className="size-5" />
                        )}
                    </Button>
                </PromptInputAction>
            </PromptInputActions>
        </PromptInput>
    )
}
