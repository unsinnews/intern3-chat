import { MultimodalInput } from "@/components/multimodal-input";
import { api } from "@/convex/_generated/api";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useQuery as useConvexQuery } from "convex/react";

interface ChatInputProps {
  onSubmit: (input?: string, files?: File[]) => void;
  status: UseChatHelpers["status"];
  input: string;
  files: File[];
  setInput: (input: string) => void;
  setFiles: (files: File[]) => void;
}

export function ChatInput({
  onSubmit,
  status,
  input,
  files,
  setInput,
  setFiles,
}: ChatInputProps) {
  const models = useConvexQuery(api.models.getModels, {}) ?? [];

  return (
    <div className="absolute right-0 bottom-2 left-0">
      <MultimodalInput
        models={models}
        onSubmit={onSubmit}
        status={status}
        input={input}
        files={files}
        setInput={setInput}
        setFiles={setFiles}
      />
    </div>
  );
}
