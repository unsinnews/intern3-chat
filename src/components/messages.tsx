import type { useChatIntegration } from "@/hooks/use-chat-integration"
import { browserEnv } from "@/lib/browser-env"
import { useChatStore } from "@/lib/chat-store"
import { getChatWidthClass, useChatWidthStore } from "@/lib/chat-width-store"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { RotateCcw } from "lucide-react"
import { memo, useState } from "react"
import { StickToBottom } from "use-stick-to-bottom"
import { ChatActions } from "./chat-actions"
import { MemoizedMarkdown } from "./memoized-markdown"
import { WebSearchToolRenderer } from "./renderers/web-search-ui"
import { Button } from "./ui/button"
import { Loader } from "./ui/loader"
import { Textarea } from "./ui/textarea"

const PartsRenderer = memo(
    ({
        part,
        markdown,
        id
    }: {
        part: UIMessage["parts"][number]
        markdown: boolean
        id: string
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
                if (part.mimeType?.startsWith("image/")) {
                    return (
                        <img
                            src={`${browserEnv("VITE_CONVEX_API_URL")}/r2?key=${part.data}`}
                            alt="Uploaded attachment"
                        />
                    )
                }
                return <div>{part.data}</div>
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

        return (
            <div className="rounded-2xl bg-primary">
                <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="mt-12 w-full resize-none border-none bg-transparent p-4 pb-2 text-primary-foreground shadow-none outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                />
                <div className="flex justify-end gap-2 px-4 pb-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="rounded-full text-background hover:bg-background/10 hover:text-background"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSave}
                        className="rounded-full bg-primary-foreground text-primary"
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
                                "group prose-code:before:hidden prose-code:after:hidden",
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
                                        {message.parts.map((part, index) => (
                                            <PartsRenderer
                                                key={`${message.id}-${index}`}
                                                part={part}
                                                markdown={message.role === "assistant"}
                                                id={`${message.id}-${index}`}
                                            />
                                        ))}
                                    </div>
                                    {message.role === "user" ? (
                                        <ChatActions
                                            role={message.role}
                                            message={message}
                                            onRetry={onRetry}
                                            onEdit={handleEdit}
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
    )
}
