import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

export function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex flex-col gap-2",
            message.role === "user" &&
              "bg-primary text-primary-foreground max-w-md ml-auto w-fit px-2.5 rounded-xl py-1.5"
          )}
        >
          {message.content}
        </div>
      ))}
    </div>
  );
}
