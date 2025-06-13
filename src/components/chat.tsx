import { ChatInput } from "@/components/chat-input";
import { Messages } from "@/components/messages";
import { api } from "@/convex/_generated/api";
import { useChatActions } from "@/hooks/use-chat-actions";
import { useChatDataProcessor } from "@/hooks/use-chat-data-processor";
import { useChatIntegration } from "@/hooks/use-chat-integration";
import { useThreadSync } from "@/hooks/use-thread-sync";
import { useModelStore } from "@/lib/model-store";
import { useQuery as useConvexQuery } from "convex/react";

interface ChatProps {
  threadId: string | undefined;
}

export function Chat({ threadId: routeThreadId }: ChatProps) {
  const { selectedModel, setSelectedModel } = useModelStore();
  const { threadId } = useThreadSync({ routeThreadId });

  const models = useConvexQuery(api.models.getModels, {}) ?? [];
  if (!selectedModel && models.length > 0) {
    setSelectedModel(models[0].id);
  }

  const { status, append, stop, data, messages } = useChatIntegration({
    threadId,
  });

  const { handleInputSubmit } =
    useChatActions({
      append,
      stop,
      status,
    });

  useChatDataProcessor({ data, messages });

  return (
    <div className="relative mb-80 flex h-[calc(100vh-64px)] flex-col">
      <Messages messages={messages} />
      <ChatInput
        onSubmit={handleInputSubmit}
        status={status}
      />
    </div>
  );
}
