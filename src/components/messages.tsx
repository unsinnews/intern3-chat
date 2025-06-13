import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";
import { ScrollArea } from "./ui/scroll-area";
import { memo, useState } from "react";
import { WebSearchToolRenderer } from "./renderers/web-search-ui";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { ChatActions } from "./chat-actions";
import { useChatStore } from "@/lib/chat-store";

const PartsRenderer = memo(
  ({
    part,
    markdown,
    id,
  }: {
    part: UIMessage["parts"][number];
    markdown: boolean;
    id: string;
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
        );
      case "reasoning":
        return markdown ? (
          <div className="border rounded-lg p-4 bg-muted/50">
            <MemoizedMarkdown content={part.reasoning} id={id} />
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-muted/50">
            {part.reasoning.split("\n").map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        );
      case "tool-invocation":
        if (part.toolInvocation.toolName === "web_search")
          return <WebSearchToolRenderer toolInvocation={part.toolInvocation} />;
        return null;
    }
  }
);
PartsRenderer.displayName = "PartsRenderer";

const EditableMessage = memo(
  ({
    message,
    onSave,
    onCancel,
  }: {
    message: UIMessage;
    onSave: (newContent: string) => void;
    onCancel: () => void;
  }) => {
    const textContent = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");

    const [editedContent, setEditedContent] = useState(textContent);

    const handleSave = () => {
      onSave(editedContent);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        onCancel();
      }
    };

    return (
      <div className="space-y-2">
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 px-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="h-7 px-2"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }
);
EditableMessage.displayName = "EditableMessage";

export function Messages({
  messages,
  onRetry,
  onEditAndRetry,
}: {
  messages: UIMessage[];
  onRetry?: (message: UIMessage) => void;
  onEditAndRetry?: (messageId: string, newContent: string) => void;
}) {
  const {
    setTargetFromMessageId,
    targetFromMessageId,
    setTargetMode,
    targetMode,
  } = useChatStore();

  const handleEdit = (message: UIMessage) => {
    setTargetFromMessageId(message.id);
    setTargetMode("edit");
  };

  const handleSaveEdit = (newContent: string) => {
    if (targetFromMessageId && onEditAndRetry) {
      onEditAndRetry(targetFromMessageId, newContent);
    }
    setTargetFromMessageId(undefined);
    setTargetMode("normal");
  };

  const handleCancelEdit = () => {
    setTargetFromMessageId(undefined);
    setTargetMode("normal");
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="mx-auto max-w-2xl space-y-3 pb-40">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "prose relative prose-ol:my-2 prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 max-w-none prose-pre:bg-transparent prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground leading-[1.65rem] [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8 [&_.ignore-pre-bg>div]:bg-transparent [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background",
              "group prose-code:before:hidden prose-code:after:hidden",
              "mb-8",
              message.role === "user" &&
                "ml-auto w-fit max-w-md rounded-xl bg-primary px-2.5 py-1.5 text-primary-foreground"
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
      </div>
    </ScrollArea>
  );
}
