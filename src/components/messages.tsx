import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";
import { ScrollArea } from "./ui/scroll-area";

export function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <ScrollArea className="h-full p-4">
      <div className="max-w-2xl mx-auto space-y-3 pb-40">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "prose max-w-none font-claude-message relative leading-[1.65rem] prose-headings:font-semibold prose-p:mb-4 prose-p:my-0 prose-strong:font-medium  prose-pre:bg-transparent prose-pre:my-2 prose-pre:text-foreground prose-pre:p-0 prose-ol:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 [&_pre>div]:bg-background [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_.ignore-pre-bg>div]:bg-transparent [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8",
              "prose-code:before:hidden prose-code:after:hidden",
              "mb-8",
              message.role === "user" &&
                "bg-primary text-primary-foreground max-w-md ml-auto w-fit px-2.5 rounded-xl py-1.5"
            )}
          >
            {message.role === "assistant" ? (
              <MemoizedMarkdown content={message.content} id={message.id} />
            ) : (
              message.content
                ?.split("\n")
                .map((line, index) => <div key={index}>{line}</div>)
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
