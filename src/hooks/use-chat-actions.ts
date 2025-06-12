import { useChatStore } from "@/lib/chat-store";
import type { UseChatHelpers } from "@ai-sdk/react";
import { nanoid } from "nanoid";

interface UseChatActionsProps {
  append: UseChatHelpers["append"];
  stop: UseChatHelpers["stop"];
  status: UseChatHelpers["status"];
}

export function useChatActions({ append, stop, status }: UseChatActionsProps) {
  const { input, files, setInput, setFiles } = useChatStore();

  const handleInputSubmit = (inputValue?: string, fileValues?: File[]) => {
    if (status === "streaming") {
      stop();
      return;
    }

    if (status === "submitted") {
      return;
    }

    const finalInput = inputValue ?? input;
    const finalFiles = fileValues ?? files;

    if (finalInput?.trim() || (finalFiles && finalFiles.length > 0)) {
      setInput("");
      setFiles([]);
    }

    append({
      id: nanoid(),
      role: "user",
      content: finalInput,
      parts: [{ type: "text", text: finalInput }],
      createdAt: new Date(),
    });

    setInput("");
    setFiles([]);
  };

  return {
    handleInputSubmit,
    input,
    files,
    setInput,
    setFiles,
  };
}
