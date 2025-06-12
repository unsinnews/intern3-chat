import type { useChat } from "@ai-sdk/react";
import { nanoid } from "nanoid";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { useRef, useState } from "react";
import { ModelSelector, type Model } from "@/components/model-selector";
import OpenAI from "@/assets/openai.svg";
import Gemini from "@/assets/gemini.svg";
import Claude from "@/assets/claude.svg";

const MODELS: Model[] = [
  {
    id: "gpt-4o",
    icon: <OpenAI />,
    name: "GPT 4o",
    description: "Most capable model, best for complex tasks",
    provider: "OpenAI",
  },
  {
    id: "gemini-2.0-flash",
    icon: <Gemini />,
    name: "Gemini 2.0 Flash",
    description: "Fast and efficient for most tasks",
    provider: "Google",
  },
  {
    id: "gemini-2.5-pro",
    icon: <Gemini />,
    name: "Gemini 2.5 Pro",
    description: "Best for complex tasks",
    provider: "Google",
  },
  {
    id: "claude-3-5-sonnet",
    icon: <Claude />,
    name: "Claude 3.5 Sonnet",
    description: "Best for complex tasks",
    provider: "Anthropic",
  },
  {
    id: "claude-3-7-sonnet",
    icon: <Claude />,
    name: "Claude 3.7 Sonnet",
    description: "Best for complex tasks",
    provider: "Anthropic",
  },
  {
    id: "gpt-4o-mini",
    icon: <OpenAI />,
    name: "GPT 4o mini",
    description: "Best for complex tasks",
    provider: "OpenAI",
  },
  {
    id: "o3-mini",
    icon: <OpenAI />,
    name: "o3 mini",
    description: "Best for complex tasks",
    provider: "OpenAI",
  },
  {
    id: "o4-mini",
    icon: <OpenAI />,
    name: "o4 mini",
    description: "Best for complex tasks",
    provider: "OpenAI",
  },
];

export function MultimodalInput({
  append,
}: {
  append: ReturnType<typeof useChat>["append"];
}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (input.trim() || files.length > 0) {
      setIsLoading(true);
      await append({
        id: nanoid(),
        role: "user",
        content: input,
        parts: [{ type: "text", text: input }],
        createdAt: new Date(),
      });
      setIsLoading(false);
      setInput("");
      setFiles([]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            >
              <Paperclip className="size-4" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-secondary/50 rounded-full p-1"
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
          <ModelSelector
            models={MODELS}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <PromptInputAction tooltip="Attach files">
            <label
              htmlFor="file-upload"
              className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Paperclip className="text-primary size-5" />
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
            onClick={handleSubmit}
          >
            {isLoading ? (
              <Square className="size-5 fill-current" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
