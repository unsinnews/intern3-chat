import { ChatInput } from "@/components/chat-input";
import { Messages } from "@/components/messages";
import { api } from "@/convex/_generated/api";
import { MODELS_SHARED } from "@/convex/lib/models";
import { useChatActions } from "@/hooks/use-chat-actions";
import { useChatDataProcessor } from "@/hooks/use-chat-data-processor";
import { useChatIntegration } from "@/hooks/use-chat-integration";
import { useThreadSync } from "@/hooks/use-thread-sync";
import { useModelStore } from "@/lib/model-store";
import { useQuery as useConvexQuery } from "convex/react";
import { useMemo } from "react";

interface ChatProps {
  threadId: string | undefined;
}

export const Chat = ({ threadId: routeThreadId }: ChatProps) => {
  const { selectedModel, setSelectedModel } = useModelStore();
  const { threadId } = useThreadSync({ routeThreadId });

  // Memoize model selection to avoid unnecessary re-renders
  useMemo(() => {
    if (!selectedModel && MODELS_SHARED.length > 0) {
      setSelectedModel(MODELS_SHARED[0].id);
    }
  }, [selectedModel, setSelectedModel]);

  const { status, append, stop, data, messages } = useChatIntegration({
    threadId,
  });

  const { handleInputSubmit } = useChatActions({
    append,
    stop,
    status,
  });

  useChatDataProcessor({ data, messages });

  return (
    <div className="relative mb-80 flex h-[calc(100vh-64px)] flex-col">
      <Messages messages={messages} />
      <ChatInput onSubmit={handleInputSubmit} status={status} />
    </div>
  );
};
