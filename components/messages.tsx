import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";

export function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "prose max-w-none font-claude-message relative leading-[1.65rem] prose-headings:font-semibold prose-p:mb-4 prose-p:my-0 prose-strong:font-medium prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-transparent prose-pre:text-foreground prose-pre:p-0 [&_pre>div]:bg-background [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_.ignore-pre-bg>div]:bg-transparent [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8",
            message.role === "user" &&
              "bg-primary text-primary-foreground max-w-md ml-auto w-fit px-2.5 rounded-xl py-1.5"
          )}
        >
          <MemoizedMarkdown content={message.content} id={message.id} />
        </div>
      ))}
    </div>
  );
}
