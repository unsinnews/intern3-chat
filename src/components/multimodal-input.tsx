import { ModelSelector } from "@/components/model-selector";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
  type PromptInputRef,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import type { modelSchema } from "@/convex/lib/models";
import { useModelStore } from "@/lib/model-store";
import type { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Paperclip, Square, X } from "lucide-react";
import { useRef } from "react";
import type { z } from "zod";

interface MultimodalInputProps {
  models: z.infer<typeof modelSchema>[];
  onSubmit: (input?: string, files?: File[]) => void;
  status: ReturnType<typeof useChat>["status"];
  files: File[];
  setFiles: (files: File[]) => void;
}

export function MultimodalInput({
  models,
  onSubmit,
  status,
  files,
  setFiles,
}: MultimodalInputProps) {
  const { selectedModel, setSelectedModel } = useModelStore();
  const isLoading = status === "streaming";
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<PromptInputRef>(null);

  const handleSubmit = async () => {
    const inputValue = promptInputRef.current?.getValue() || "";

    // Check if input is empty or just whitespace
    if (!inputValue.trim()) {
      // Focus the textarea if input is empty
      promptInputRef.current?.focus();
      return;
    }

    onSubmit(inputValue, files);
    promptInputRef.current?.clear();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <PromptInput
      ref={promptInputRef}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
            >
              <Paperclip className="size-4" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="rounded-full p-1 hover:bg-secondary/50"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptInputTextarea placeholder="Ask me anything..." />

      <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          {selectedModel && (
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          )}
          <PromptInputAction tooltip="Attach files">
            <label
              htmlFor="file-upload"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl hover:bg-secondary-foreground/10"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={uploadInputRef}
              />
              <Paperclip className="size-5 text-primary" />
            </label>
          </PromptInputAction>
        </div>

        <PromptInputAction
          tooltip={isLoading ? "Stop generation" : "Send message"}
        >
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={status === "submitted"}
            onClick={handleSubmit}
            type="submit"
          >
            {isLoading ? (
              <Square className="size-5 fill-current" />
            ) : status === "submitted" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
