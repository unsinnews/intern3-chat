import { Messages } from "@/components/messages";
import { MODELS_SHARED } from "@/convex/lib/models";
import { useChatActions } from "@/hooks/use-chat-actions";
import { useChatDataProcessor } from "@/hooks/use-chat-data-processor";
import { useChatIntegration } from "@/hooks/use-chat-integration";
import { useThreadSync } from "@/hooks/use-thread-sync";
import { useModelStore } from "@/lib/model-store";
import { useMemo } from "react";
import { MultimodalInput } from "./multimodal-input";
import type { UIMessage } from "ai";
import { useChatStore } from "@/lib/chat-store";

interface ChatProps {
  threadId: string | undefined;
}

export const Chat = ({ threadId: routeThreadId }: ChatProps) => {
  const { selectedModel, setSelectedModel } = useModelStore();
  const { threadId } = useThreadSync({ routeThreadId });
  const { setTargetFromMessageId } = useChatStore();

  // Memoize model selection to avoid unnecessary re-renders
  useMemo(() => {
    if (!selectedModel && MODELS_SHARED.length > 0) {
      setSelectedModel(MODELS_SHARED[0].id);
    }
  }, [selectedModel, setSelectedModel]);

  const { status, data, messages } = useChatIntegration({
    threadId,
  });

  const { handleInputSubmit, handleRetry, handleEditAndRetry } = useChatActions(
    {
      threadId,
    }
  );

  useChatDataProcessor({ data, messages });

  return (
    <div className="relative mb-80 flex h-[calc(100vh-64px)] flex-col">
      <Messages
        messages={messages}
        onRetry={handleRetry}
        onEditAndRetry={handleEditAndRetry}
      />
      <div className="absolute right-0 bottom-2 left-0">
        <MultimodalInput onSubmit={handleInputSubmit} status={status} />
      </div>
    </div>
  );
};
