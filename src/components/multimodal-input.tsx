import { ModelSelector } from "@/components/model-selector"
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    type PromptInputRef,
    PromptInputTextarea
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { browserEnv } from "@/lib/browser-env"
import { type UploadedFile, useChatStore } from "@/lib/chat-store"
import { useModelStore } from "@/lib/model-store"
import { cn } from "@/lib/utils"
import type { useChat } from "@ai-sdk/react"
import { ArrowUp, Globe, Loader2, Paperclip, Square, Upload, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"

export function MultimodalInput({
    onSubmit,
    status
}: {
    onSubmit: (input?: string, files?: UploadedFile[]) => void
    status: ReturnType<typeof useChat>["status"]
}) {
    const { selectedModel, setSelectedModel, enabledTools, setEnabledTools } = useModelStore()
    const { uploadedFiles, addUploadedFile, removeUploadedFile, uploading, setUploading } =
        useChatStore()

    const isLoading = status === "streaming"
    const uploadInputRef = useRef<HTMLInputElement>(null)
    const promptInputRef = useRef<PromptInputRef>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleSubmit = async () => {
        const inputValue = promptInputRef.current?.getValue() || ""

        // Check if input is empty or just whitespace
        if (!inputValue.trim()) {
            // Focus the textarea if input is empty
            promptInputRef.current?.focus()
            return
        }

        onSubmit(inputValue, uploadedFiles)
        promptInputRef.current?.clear()
        localStorage.setItem("user-input", inputValue)
    }

    const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${browserEnv("VITE_CONVEX_API_URL")}/upload`, {
            method: "POST",
            body: formData
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Upload failed")
        }

        const result = await response.json()
        return {
            ...result,
            file // Keep original file for display
        }
    }, [])

    const handleFileUpload = useCallback(
        async (filesToUpload: File[]) => {
            if (filesToUpload.length === 0) return

            setUploading(true)
            try {
                const uploadPromises = filesToUpload.map((file) => uploadFile(file))
                const uploadedResults = await Promise.all(uploadPromises)

                uploadedResults.forEach((result) => addUploadedFile(result))

                // Clear the file input
                if (uploadInputRef.current) {
                    uploadInputRef.current.value = ""
                }
            } catch (error) {
                console.error("Upload failed:", error)
                // You might want to show a toast notification here
            } finally {
                setUploading(false)
            }
        },
        [uploadFile, addUploadedFile, setUploading]
    )

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files)
            handleFileUpload(newFiles)
        }
    }

    const handleRemoveFile = (key: string) => {
        removeUploadedFile(key)
    }

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const newFiles = Array.from(e.dataTransfer.files)
                handleFileUpload(newFiles)
            }
        },
        [handleFileUpload]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
    }, [])

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    return (
        <div className="@container w-full">
            <PromptInput
                ref={promptInputRef}
                onSubmit={handleSubmit}
                className={cn(
                    "mx-auto w-full @md:min-w-2xl max-w-2xl",
                    dragActive && "rounded-lg ring-2 ring-primary ring-offset-2"
                )}
            >
                <PromptInputTextarea placeholder="Ask me anything..." />

                <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                        {selectedModel && (
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                            />
                        )}

                        {uploadedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 pb-2">
                                {uploadedFiles.map((uploadedFile) => (
                                    <div
                                        key={uploadedFile.key}
                                        className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
                                    >
                                        <Paperclip className="size-4" />
                                        <div className="flex flex-col">
                                            <span className="max-w-[120px] truncate">
                                                {uploadedFile.fileName}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {formatFileSize(uploadedFile.fileSize)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(uploadedFile.key)}
                                            className="rounded-full p-1 hover:bg-secondary/50"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {dragActive && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-primary border-dashed bg-primary/5">
                                <div className="text-center">
                                    <Upload className="mx-auto mb-2 h-8 w-8 text-primary" />
                                    <p className="font-medium text-primary text-sm">
                                        Drop files here to upload
                                    </p>
                                </div>
                            </div>
                        )}
                        <PromptInputAction tooltip="Attach files">
                            <label
                                htmlFor="file-upload"
                                className="flex h-9 w-9 cursor-pointer items-center justify-center gap-1 rounded-full border border-accent hover:bg-secondary"
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    ref={uploadInputRef}
                                />
                                {uploading ? (
                                    <Loader2 className="size-5 animate-spin text-primary" />
                                ) : (
                                    <Paperclip className="-rotate-45 size-5 text-primary" />
                                )}
                                {/* <span className="text-sm">Attach</span> */}
                            </label>
                        </PromptInputAction>

                        <PromptInputAction tooltip="Search the web">
                            <button
                                type="button"
                                onClick={() => {
                                    setEnabledTools(
                                        enabledTools.includes("web_search")
                                            ? enabledTools.filter((tool) => tool !== "web_search")
                                            : [...enabledTools, "web_search"]
                                    )
                                }}
                                className={cn(
                                    "flex h-9 w-9 cursor-pointer items-center justify-center gap-1 rounded-full border border-accent hover:bg-secondary",
                                    enabledTools.includes("web_search") &&
                                        "bg-secondary-foreground/10"
                                )}
                            >
                                <Globe className="size-4 text-primary" />
                                {/* <span className="text-sm">Search</span> */}
                            </button>
                        </PromptInputAction>
                    </div>

                    <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
                        <Button
                            variant="default"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            disabled={status === "submitted" || uploading}
                            onClick={handleSubmit}
                            type="submit"
                        >
                            {isLoading ? (
                                <Square className="size-5 fill-current" />
                            ) : status === "submitted" ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <ArrowUp className="size-5" />
                            )}
                        </Button>
                    </PromptInputAction>
                </PromptInputActions>
            </PromptInput>
        </div>
    )
}
