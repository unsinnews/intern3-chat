import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { MemoizedMarkdown } from "./memoized-markdown"
import { ScrollArea } from "./ui/scroll-area"
import { memo } from "react"

const PartsRenderer = memo(({ part, markdown, id }: { part: UIMessage["parts"][number], markdown: boolean, id: string }) => {
    switch (part.type) {
        case "text":
            return markdown ? <MemoizedMarkdown content={part.text} id={id} /> : <div>{part.text.split("\n").map((line, index) => <div key={index}>{line}</div>)}</div>
        case "reasoning":
            return markdown ? (
                <div className="border rounded-lg p-4 bg-muted/50">
                    <MemoizedMarkdown content={part.reasoning} id={id} />
                </div>
            ) : (
                <div className="border rounded-lg p-4 bg-muted/50">
                    {part.reasoning.split("\n").map((line, index) => <div key={index}>{line}</div>)}
                </div>
            )
    }
});
PartsRenderer.displayName = "PartsRenderer";

export function Messages({ messages }: { messages: UIMessage[] }) {
    return (
        <ScrollArea className="h-full p-4">
            <div className="mx-auto max-w-2xl space-y-3 pb-40">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "prose relative prose-ol:my-2 prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 prose-p:mb-4 max-w-none prose-pre:bg-transparent prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground leading-[1.65rem] [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8 [&_.ignore-pre-bg>div]:bg-transparent [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background",
                            "prose-code:before:hidden prose-code:after:hidden",
                            "mb-8",
                            message.role === "user" &&
                            "ml-auto w-fit max-w-md rounded-xl bg-primary px-2.5 py-1.5 text-primary-foreground"
                        )}
                    >
                        {message.parts.map((part) => (
                            <PartsRenderer part={part} markdown={message.role === "assistant"} id={message.id} />
                        ))}
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
