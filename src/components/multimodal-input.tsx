import { ModelSelector } from "@/components/model-selector"
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    type PromptInputRef,
    PromptInputTextarea
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { browserEnv } from "@/lib/browser-env"
import { type UploadedFile, useChatStore } from "@/lib/chat-store"
import { getChatWidthClass, useChatWidthStore } from "@/lib/chat-width-store"
import { useModelStore } from "@/lib/model-store"
import { cn } from "@/lib/utils"
import type { useChat } from "@ai-sdk/react"
import { useLocation } from "@tanstack/react-router"
import {
    ArrowUp,
    Code,
    FileType,
    Globe,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    Square,
    Upload,
    X
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface ExtendedUploadedFile extends UploadedFile {
    file?: File
}

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
    const { chatWidthState } = useChatWidthStore()

    const isLoading = status === "streaming"
    const uploadInputRef = useRef<HTMLInputElement>(null)
    const promptInputRef = useRef<PromptInputRef>(null)
    const [dragActive, setDragActive] = useState(false)
    const [fileContents, setFileContents] = useState<Record<string, string>>({})
    const [dialogFile, setDialogFile] = useState<{
        content: string
        fileName: string
        fileType: string
    } | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [extendedFiles, setExtendedFiles] = useState<ExtendedUploadedFile[]>([])

    useEffect(() => {
        setExtendedFiles(uploadedFiles.map((file) => ({ ...file })))
    }, [uploadedFiles])

    const handleSubmit = async () => {
        const inputValue = promptInputRef.current?.getValue() || ""

        if (!inputValue.trim()) {
            promptInputRef.current?.focus()
            return
        }

        promptInputRef.current?.clear()
        localStorage.removeItem("user-input")
        onSubmit(inputValue, uploadedFiles)
    }

    const readFileContent = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                resolve(result)
            }
            reader.onerror = () => resolve("Error reading file")

            if (file.type.startsWith("image/")) {
                reader.readAsDataURL(file)
            } else if (
                file.type.startsWith("text/") ||
                file.type === "application/json" ||
                file.type === "application/javascript" ||
                file.type === "application/typescript" ||
                file.name.endsWith(".md") ||
                file.name.endsWith(".mdx") ||
                file.name.endsWith(".txt") ||
                file.name.endsWith(".js") ||
                file.name.endsWith(".ts") ||
                file.name.endsWith(".jsx") ||
                file.name.endsWith(".tsx") ||
                file.name.endsWith(".css") ||
                file.name.endsWith(".scss") ||
                file.name.endsWith(".html") ||
                file.name.endsWith(".xml") ||
                file.name.endsWith(".json") ||
                file.name.endsWith(".yaml") ||
                file.name.endsWith(".yml") ||
                file.name.endsWith(".py") ||
                file.name.endsWith(".java") ||
                file.name.endsWith(".c") ||
                file.name.endsWith(".cpp") ||
                file.name.endsWith(".go") ||
                file.name.endsWith(".rs") ||
                file.name.endsWith(".php") ||
                file.name.endsWith(".rb") ||
                file.name.endsWith(".swift") ||
                file.name.endsWith(".kt") ||
                file.name.endsWith(".dart") ||
                file.name.endsWith(".vue") ||
                file.name.endsWith(".svelte")
            ) {
                reader.readAsText(file)
            } else {
                resolve(`Binary file: ${file.name}`)
            }
        })
    }, [])

    const uploadFile = useCallback(async (file: File): Promise<ExtendedUploadedFile> => {
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
            file
        }
    }, [])

    const handleFileUpload = useCallback(
        async (filesToUpload: File[]) => {
            if (filesToUpload.length === 0) return

            setUploading(true)
            try {
                const uploadPromises = filesToUpload.map((file) => uploadFile(file))
                const uploadedResults = await Promise.all(uploadPromises)

                for (const result of uploadedResults) {
                    addUploadedFile(result)

                    if (result.file) {
                        const content = await readFileContent(result.file)
                        setFileContents((prev) => ({
                            ...prev,
                            [result.key]: content
                        }))
                    }
                }

                if (uploadInputRef.current) {
                    uploadInputRef.current.value = ""
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Upload failed")
            } finally {
                setUploading(false)
            }
        },
        [uploadFile, addUploadedFile, setUploading, readFileContent]
    )

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files)
            handleFileUpload(newFiles)
        }
    }

    const handleRemoveFile = (key: string) => {
        removeUploadedFile(key)
        setFileContents((prev) => {
            const newContents = { ...prev }
            delete newContents[key]
            return newContents
        })
    }

    const handlePaste = useCallback(
        async (e: ClipboardEvent) => {
            const items = Array.from(e.clipboardData?.items || [])
            const files: File[] = []
            let hasText = false

            for (const item of items) {
                if (item.kind === "file") {
                    const file = item.getAsFile()
                    if (file) {
                        files.push(file)
                        e.preventDefault()
                    }
                } else if (item.kind === "string" && item.type === "text/plain") {
                    hasText = true
                }
            }

            if (files.length > 0) {
                await handleFileUpload(files)
            }

            if (!hasText && files.length === 0) {
                e.preventDefault()
            }
        },
        [handleFileUpload]
    )

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

    const getFileType = (
        uploadedFile: ExtendedUploadedFile
    ): { isImage: boolean; isCode: boolean; isText: boolean } => {
        const fileName = uploadedFile.fileName.toLowerCase()
        const fileType = uploadedFile.file?.type || uploadedFile.fileType

        const isImage =
            fileType.startsWith("image/") ||
            !!fileName.match(/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/)

        const isCode =
            !!fileName.match(
                /\.(js|jsx|ts|tsx|py|java|c|cpp|go|rs|php|rb|swift|kt|dart|vue|svelte|css|scss|html|xml|json|yaml|yml)$/
            ) ||
            fileType === "application/javascript" ||
            fileType === "application/typescript" ||
            fileType === "application/json"

        const isText = fileType.startsWith("text/") || !!fileName.match(/\.(md|mdx|txt)$/) || isCode

        return { isImage, isCode, isText }
    }

    const getFileIcon = (uploadedFile: ExtendedUploadedFile) => {
        const { isImage, isCode } = getFileType(uploadedFile)

        if (isImage) return <ImageIcon className="size-4 text-blue-500" />
        if (isCode) return <Code className="size-4 text-green-500" />
        return <FileType className="size-4 text-gray-500" />
    }

    const renderFilePreview = (uploadedFile: ExtendedUploadedFile) => {
        const content = fileContents[uploadedFile.key]
        const { isImage, isText } = getFileType(uploadedFile)

        return (
            <div key={uploadedFile.key} className="group relative">
                <button
                    type="button"
                    onClick={() => {
                        setDialogFile({
                            content,
                            fileName: uploadedFile.fileName,
                            fileType: uploadedFile.fileType
                        })
                        setDialogOpen(true)
                    }}
                    className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-secondary/50 transition-colors hover:bg-secondary/80"
                >
                    {content && isImage ? (
                        <img
                            src={content}
                            alt=""
                            className="h-full w-full rounded-md object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center">
                            {getFileIcon(uploadedFile)}
                        </div>
                    )}
                </button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(uploadedFile.key)
                    }}
                    className="-top-2 -right-2 absolute h-5 w-5 rounded-full bg-destructive p-0 text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/80 group-hover:opacity-100"
                >
                    <X className="size-3" />
                </Button>
            </div>
        )
    }

    const renderDialogContent = () => {
        if (!dialogFile) return null

        const isImage = dialogFile.fileType.startsWith("image/")
        const isText =
            dialogFile.fileType.startsWith("text/") ||
            !!dialogFile.fileName
                .toLowerCase()
                .match(
                    /\.(md|mdx|txt|js|jsx|ts|tsx|py|java|c|cpp|go|rs|php|rb|swift|kt|dart|vue|svelte|css|scss|html|xml|json|yaml|yml)$/
                )

        return (
            <div className="max-h-[70vh] overflow-auto">
                {isImage ? (
                    <img
                        src={dialogFile.content}
                        alt={dialogFile.fileName}
                        className="h-auto w-full rounded object-contain"
                    />
                ) : isText ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-4 text-sm">
                        {dialogFile.content}
                    </pre>
                ) : (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        <div className="text-center">
                            <FileType className="mx-auto mb-2 size-12" />
                            <p>Binary file: {dialogFile.fileName}</p>
                            <p className="mt-1 text-xs">Preview not available</p>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const [isClient, setIsClient] = useState(false)
    const location = useLocation()

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
            if (
                document.activeElement?.tagName === "TEXTAREA" ||
                document.activeElement?.tagName === "INPUT"
            ) {
                handlePaste(e)
            }
        }

        document.addEventListener("paste", handleGlobalPaste)
        return () => document.removeEventListener("paste", handleGlobalPaste)
    }, [handlePaste])

    useEffect(() => {
        if (location.pathname.includes("/thread/")) {
            const timer = setTimeout(() => {
                promptInputRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [location.pathname])

    if (!isClient) return null

    return (
        <>
            <div
                className="@container w-full md:px-2"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <PromptInput
                    ref={promptInputRef}
                    onSubmit={handleSubmit}
                    className={cn(
                        "mx-auto w-full",
                        getChatWidthClass(chatWidthState.chatWidth),
                        dragActive && "rounded-lg ring-2 ring-primary ring-offset-2"
                    )}
                >
                    {extendedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-3">
                            {extendedFiles.map(renderFilePreview)}
                        </div>
                    )}
                    <PromptInputTextarea autoFocus placeholder="Ask me anything..." />

                    <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2">
                            {dragActive && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-primary border-dashed bg-primary/5">
                                    <div className="text-center">
                                        <Upload className="mx-auto mb-2 h-8 w-8 text-foreground" />
                                        <p className="font-medium text-foreground text-sm">
                                            Drop files here to upload
                                        </p>
                                    </div>
                                </div>
                            )}
                            {selectedModel && (
                                <ModelSelector
                                    selectedModel={selectedModel}
                                    onModelChange={setSelectedModel}
                                />
                            )}

                            <PromptInputAction tooltip="Attach files">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => uploadInputRef.current?.click()}
                                    className={cn(
                                        "flex size-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-accent bg-secondary/70 backdrop-blur-lg hover:bg-secondary/80"
                                    )}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                        ref={uploadInputRef}
                                        accept="image/*,.txt,.md,.mdx,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.go,.rs,.php,.rb,.swift,.kt,.dart,.vue,.svelte,.css,.scss,.html,.xml,.json,.yaml,.yml"
                                    />
                                    {uploading ? (
                                        <Loader2 className="size-4 animate-spin text-foreground" />
                                    ) : (
                                        <Paperclip className="-rotate-45 size-4 text-foreground" />
                                    )}
                                </Button>
                            </PromptInputAction>

                            <PromptInputAction tooltip="Search the web">
                                <Button
                                    type="button"
                                    variant={
                                        enabledTools.includes("web_search") ? "default" : "ghost"
                                    }
                                    onClick={() => {
                                        setEnabledTools(
                                            enabledTools.includes("web_search")
                                                ? enabledTools.filter(
                                                      (tool) => tool !== "web_search"
                                                  )
                                                : [...enabledTools, "web_search"]
                                        )
                                    }}
                                    className={cn(
                                        "size-8 shrink-0",
                                        !enabledTools.includes("web_search") &&
                                            "border border-accent bg-secondary/70 backdrop-blur-lg hover:bg-secondary/80"
                                    )}
                                >
                                    <Globe className="size-4" />
                                </Button>
                            </PromptInputAction>
                        </div>

                        <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
                            <Button
                                variant="default"
                                size="icon"
                                className="size-8 shrink-0 rounded-md"
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

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) {
                        setTimeout(() => setDialogFile(null), 150)
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-4xl">
                    {dialogFile && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {getFileIcon({
                                        fileName: dialogFile.fileName,
                                        fileType: dialogFile.fileType
                                    } as ExtendedUploadedFile)}
                                    {dialogFile.fileName}
                                </DialogTitle>
                            </DialogHeader>
                            {renderDialogContent()}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
