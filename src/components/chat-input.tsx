import { MultimodalInput } from "@/components/multimodal-input";
import { api } from "@/convex/_generated/api";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useQuery as useConvexQuery } from "convex/react";

export function ChatInput({
  onSubmit,
  status,
}: {
  onSubmit: (input?: string, files?: File[]) => void;
  status: UseChatHelpers["status"];
}) {
  return (
    <div className="absolute right-0 bottom-2 left-0">
      <MultimodalInput onSubmit={onSubmit} status={status} />
    </div>
  );
}
