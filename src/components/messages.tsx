import type { useChatIntegration } from "@/hooks/use-chat-integration"
import { browserEnv } from "@/lib/browser-env"
import { useChatStore } from "@/lib/chat-store"
import { getChatWidthClass, useChatWidthStore } from "@/lib/chat-width-store"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { Code, FileType, Image as ImageIcon, RotateCcw } from "lucide-react"
import { memo, useState } from "react"
import { StickToBottom } from "use-stick-to-bottom"
import { ChatActions } from "./chat-actions"
import { MemoizedMarkdown } from "./memoized-markdown"
import { WebSearchToolRenderer } from "./renderers/web-search-ui"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Loader } from "./ui/loader"
import { Textarea } from "./ui/textarea"

const getFileType = (part: { data: string; filename?: string; mimeType?: string }): {
    isImage: boolean
    isCode: boolean
    isText: boolean
} => {
    const fileName = part.filename?.toLowerCase() || ""
    const mimeType = part.mimeType || ""

    const isImage =
        mimeType.startsWith("image/") || !!fileName.match(/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/)

    const isCode =
        !!fileName.match(
            /\.(js|jsx|ts|tsx|py|java|c|cpp|go|rs|php|rb|swift|kt|dart|vue|svelte|css|scss|html|xml|json|yaml|yml)$/
        ) ||
        mimeType === "application/javascript" ||
        mimeType === "application/typescript" ||
        mimeType === "application/json"

    const isText = mimeType.startsWith("text/") || !!fileName.match(/\.(md|mdx|txt)$/) || isCode

    return { isImage, isCode, isText }
}

const getFileIcon = (part: { data: string; filename?: string; mimeType?: string }) => {
    const { isImage, isCode } = getFileType(part)

    if (isImage) return <ImageIcon className="size-4 text-blue-500" />
    if (isCode) return <Code className="size-4 text-green-500" />
    return <FileType className="size-4 text-gray-500" />
}

const FileAttachment = memo(
    ({
        part,
        onPreview
    }: {
        part: { data: string; filename?: string; mimeType?: string }
        onPreview?: () => void
    }) => {
        const { isImage } = getFileType(part)
        const fileName = part.filename || "Unknown file"
        const [imageError, setImageError] = useState(false)

        const handleInteraction = () => {
            if (onPreview) {
                onPreview()
            }
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleInteraction()
            }
        }

        const handleImageError = () => {
            setImageError(true)
        }

        if (isImage) {
            if (imageError) {
                return (
                    <div className="group relative flex w-full max-w-md items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 transition-colors">
                        <div className="text-center">
                            <ImageIcon className="mx-auto mb-2 h-12 w-12 text-destructive/70" />
                            <p className="font-medium text-destructive text-sm">
                                Image unavailable
                            </p>
                            <p className="mt-1 text-muted-foreground text-xs">
                                File may have been deleted
                            </p>
                            {fileName !== "Unknown file" && (
                                <p className="mt-1 text-muted-foreground text-xs">{fileName}</p>
                            )}
                        </div>
                    </div>
                )
            }

            return (
                <div className="group relative">
                    <img
                        src={`${browserEnv("VITE_CONVEX_API_URL")}/r2?key=${part.data}`}
                        alt={fileName}
                        className="w-full max-w-md cursor-pointer rounded-lg object-contain transition-opacity hover:opacity-90"
                        onClick={handleInteraction}
                        onKeyDown={handleKeyDown}
                        onError={handleImageError}
                        tabIndex={onPreview ? 0 : -1}
                        role={onPreview ? "button" : undefined}
                    />
                    {fileName !== "Unknown file" && (
                        <p className="mt-1 text-muted-foreground text-xs">{fileName}</p>
                    )}
                </div>
            )
        }

        return (
            <div
                className="group relative inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-secondary/50 p-3 transition-colors hover:bg-secondary/80"
                onClick={handleInteraction}
                onKeyDown={handleKeyDown}
                tabIndex={onPreview ? 0 : -1}
                role={onPreview ? "button" : undefined}
            >
                <div className="flex items-center gap-2">
                    {getFileIcon(part)}
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{fileName}</span>
                        <span className="text-muted-foreground text-xs">File</span>
                    </div>
                </div>
            </div>
        )
    }
)
FileAttachment.displayName = "FileAttachment"

const PartsRenderer = memo(
    ({
        part,
        markdown,
        id,
        onFilePreview
    }: {
        part: UIMessage["parts"][number]
        markdown: boolean
        id: string
        onFilePreview?: (part: { data: string; filename?: string; mimeType?: string }) => void
    }) => {
        switch (part.type) {
            case "text":
                return markdown ? (
                    <MemoizedMarkdown content={part.text} id={id} />
                ) : (
                    <div>
                        {part.text.split("\n").map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
                    </div>
                )
            case "reasoning":
                return markdown ? (
                    <div className="prose prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 mb-12 prose-li:mb-0 max-w-none rounded-lg border bg-muted/50 prose-pre:bg-transparent p-4 prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground leading-[1.65rem] [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8 [&_.ignore-pre-bg>div]:bg-transparent [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background">
                        <MemoizedMarkdown content={part.reasoning} id={id} />
                    </div>
                ) : (
                    <div className="rounded-lg border bg-muted/50 p-4">
                        {part.reasoning.split("\n").map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
                    </div>
                )
            case "tool-invocation":
                if (part.toolInvocation.toolName === "web_search")
                    return <WebSearchToolRenderer toolInvocation={part.toolInvocation} />
                return null
            case "file":
                return <FileAttachment part={part} onPreview={() => onFilePreview?.(part)} />
        }
    }
)
PartsRenderer.displayName = "PartsRenderer"

const EditableMessage = memo(
    ({
        message,
        onSave,
        onCancel
    }: {
        message: UIMessage
        onSave: (newContent: string) => void
        onCancel: () => void
    }) => {
        const textContent = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n")

        const [editedContent, setEditedContent] = useState(textContent)

        const handleSave = () => {
            onSave(editedContent)
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSave()
            }
            if (e.key === "Escape") {
                onCancel()
            }
        }
        const renderFilePreview = () => {
            if (!previewFile) return null

            const { isImage, isText } = getFileType(previewFile)
            const fileName = previewFile.filename || "Unknown file"

            return (
                <div className="max-h-[70vh] overflow-auto">
                    {isImage ? (
                        <img
                            src={`${browserEnv("VITE_CONVEX_API_URL")}/r2?key=${previewFile.data}`}
                            alt={fileName}
                            className="h-auto w-full rounded object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                                const errorDiv = target.nextElementSibling as HTMLElement
                                if (errorDiv) errorDiv.style.display = "flex"
                            }}
                        />
                    ) : isText ? (
                        <div className="rounded bg-muted p-4 text-sm">
                            <p className="text-muted-foreground">
                                File preview not available in edit mode
                            </p>
                            <p className="font-medium">{fileName}</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                            <div className="text-center">
                                <FileType className="mx-auto mb-2 size-12" />
                                <p>Binary file: {fileName}</p>
                                <p className="mt-1 text-xs">Preview not available</p>
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        return (
            <div className="rounded-2xl bg-primary">
                <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full resize-none border-none bg-transparent p-4 pb-2 text-primary-foreground shadow-none outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                />
                <div className="flex justify-end gap-2 px-4 pb-3">
                    <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-md">
                        Cancel
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSave}
                        className="rounded-md"
                    >
                        Send
                    </Button>
                </div>
            </div>
        )
    }
)
EditableMessage.displayName = "EditableMessage"

export function Messages({
    messages,
    onRetry,
    onEditAndRetry,
    status
}: {
    messages: UIMessage[]
    onRetry?: (message: UIMessage) => void
    onEditAndRetry?: (messageId: string, newContent: string) => void
    status: ReturnType<typeof useChatIntegration>["status"]
}) {
    const { setTargetFromMessageId, targetFromMessageId, setTargetMode, targetMode } =
        useChatStore()
    const { chatWidthState } = useChatWidthStore()

    const [previewFile, setPreviewFile] = useState<{
        data: string
        filename?: string
        mimeType?: string
    } | null>(null)

    const handleEdit = (message: UIMessage) => {
        setTargetFromMessageId(message.id)
        setTargetMode("edit")
    }

    const handleSaveEdit = (newContent: string) => {
        if (targetFromMessageId && onEditAndRetry) {
            onEditAndRetry(targetFromMessageId, newContent)
        }
        setTargetFromMessageId(undefined)
        setTargetMode("normal")
    }

    const handleCancelEdit = () => {
        setTargetFromMessageId(undefined)
        setTargetMode("normal")
    }

    const handleFilePreview = (part: { data: string; filename?: string; mimeType?: string }) => {
        setPreviewFile(part)
    }

    const renderFilePreview = () => {
        if (!previewFile) return null

        const { isImage } = getFileType(previewFile)
        const fileName = previewFile.filename || "Unknown file"

        return (
            <div className="max-h-[70vh] overflow-auto">
                {isImage ? (
                    <img
                        src={`${browserEnv("VITE_CONVEX_API_URL")}/r2?key=${previewFile.data}`}
                        alt={fileName}
                        className="h-auto w-full rounded object-contain"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const errorDiv = target.nextElementSibling as HTMLElement
                            if (errorDiv) errorDiv.style.display = "flex"
                        }}
                    />
                ) : (
                    <div className="rounded bg-muted p-4 text-sm">
                        <p className="text-muted-foreground">File content preview not supported</p>
                        <p className="font-medium">{fileName}</p>
                    </div>
                )}
                {isImage && (
                    <div className="hidden items-center justify-center p-8 text-destructive">
                        <div className="text-center">
                            <ImageIcon className="mx-auto mb-2 size-12 text-destructive/70" />
                            <p className="font-medium">Image unavailable</p>
                            <p className="mt-1 text-muted-foreground text-sm">
                                File may have been deleted: {fileName}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const lastMessage = messages[messages.length - 1]
    const isStreamingWithoutContent =
        status === "streaming" &&
        lastMessage?.role === "assistant" &&
        (!lastMessage.parts ||
            lastMessage.parts.length === 0 ||
            lastMessage.parts.every(
                (part) =>
                    (part.type === "text" && (!part.text || part.text.trim() === "")) ||
                    (part.type === "reasoning" && (!part.reasoning || part.reasoning.trim() === ""))
            ))

    const showTypingLoader = status === "submitted" || isStreamingWithoutContent

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")

    return (
        <>
            <StickToBottom.Content>
                <div className="p-4 pt-0">
                    <div
                        className={cn(
                            "mx-auto space-y-3 pb-40",
                            getChatWidthClass(chatWidthState.chatWidth)
                        )}
                    >
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "prose relative prose-ol:my-2 prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 max-w-none prose-pre:bg-transparent prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground leading-[1.65rem] [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8 [&_.ignore-pre-bg>div]:bg-transparent [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background",
                                    "group prose-img:mx-auto prose-img:my-4 prose-code:before:hidden prose-code:after:hidden",
                                    "mb-8",
                                    message.role === "user" &&
                                        targetFromMessageId !== message.id &&
                                        "my-12 ml-auto w-fit max-w-md rounded-md border border-border bg-secondary/50 px-4 py-2 text-foreground"
                                )}
                            >
                                {targetFromMessageId === message.id && targetMode === "edit" ? (
                                    <EditableMessage
                                        message={message}
                                        onSave={handleSaveEdit}
                                        onCancel={handleCancelEdit}
                                    />
                                ) : (
                                    <>
                                        <div className="prose-p:not-last:mb-4">
                                            {message.parts
                                                .filter((part) => part.type !== "file")
                                                .map((part, index) => (
                                                    <PartsRenderer
                                                        key={`${message.id}-text-${index}`}
                                                        part={part}
                                                        markdown={message.role === "assistant"}
                                                        id={`${message.id}-text-${index}`}
                                                        onFilePreview={handleFilePreview}
                                                    />
                                                ))}
                                        </div>

                                        {message.parts.some((part) => part.type === "file") && (
                                            <div className="mt-3 space-y-3">
                                                {message.parts
                                                    .filter((part) => part.type === "file")
                                                    .map((part, index) => (
                                                        <PartsRenderer
                                                            key={`${message.id}-file-${index}`}
                                                            part={part}
                                                            markdown={message.role === "assistant"}
                                                            id={`${message.id}-file-${index}`}
                                                            onFilePreview={handleFilePreview}
                                                        />
                                                    ))}
                                            </div>
                                        )}

                                        {message.role === "user" ? (
                                            <ChatActions
                                                role={message.role}
                                                message={message}
                                                onRetry={onRetry}
                                                onEdit={
                                                    message.parts.some(
                                                        (part) => part.type === "file"
                                                    )
                                                        ? undefined
                                                        : handleEdit
                                                }
                                            />
                                        ) : (
                                            <ChatActions
                                                role={message.role}
                                                message={message}
                                                onRetry={undefined}
                                                onEdit={undefined}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}

                        {status === "error" && (
                            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive p-4">
                                <div className="flex w-full items-center justify-between">
                                    <p className="text-destructive-foreground">
                                        Oops! Something went wrong.
                                    </p>
                                    {lastUserMessage && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onRetry?.(lastUserMessage)}
                                            className="text-destructive-foreground hover:text-destructive-foreground/80"
                                        >
                                            <RotateCcw />
                                            Retry
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex min-h-[3rem] items-center gap-2 py-4">
                            {showTypingLoader && <Loader variant="typing" size="md" />}
                        </div>
                    </div>
                </div>
            </StickToBottom.Content>

            <Dialog
                open={!!previewFile}
                onOpenChange={(open) => {
                    if (!open) {
                        setTimeout(() => setPreviewFile(null), 150)
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-4xl">
                    {previewFile && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {getFileIcon(previewFile)}
                                    {previewFile.filename || "Unknown file"}
                                </DialogTitle>
                            </DialogHeader>
                            {renderFilePreview()}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
