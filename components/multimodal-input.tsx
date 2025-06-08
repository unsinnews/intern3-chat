import { cn } from "@/lib/utils";
import type { useChat } from "@ai-sdk/react";
import { Send, RotateCcw } from "lucide-react";
import { nanoid } from "nanoid";

export function MultimodalInput({
  append,
}: {
  append: ReturnType<typeof useChat>["append"];
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get("message") as string;
    if (message.trim()) {
      append({
        id: nanoid(),
        role: "user",
        content: message,
        parts: [{ type: "text", text: message }],
        createdAt: new Date(),
      });
      e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <textarea
        name="message"
        placeholder="Type your message..."
        className={cn(
          "flex-1 min-h-[44px] max-h-32 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.form;
            if (form) {
              form.requestSubmit();
            }
          }
        }}
      />
      <button
        type="submit"
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
