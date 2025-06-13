import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { backendToUiMessages } from "@/convex/lib/backend_to_ui_messages";
import { useToken } from "@/hooks/auth-hooks";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { browserEnv } from "@/lib/browser-env";
import { useChatStore } from "@/lib/chat-store";
import { useModelStore } from "@/lib/model-store";
import { type Message, useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { nanoid } from "nanoid";
import { useMemo, useRef, useEffect, useCallback } from "react";

interface UseChatIntegrationProps {
  threadId: string | undefined;
}

export function useChatIntegration({ threadId }: UseChatIntegrationProps) {
  const tokenData = useToken();
  const queryClient = useQueryClient();
  const { selectedModel, enabledTools } = useModelStore();
  const {
    rerenderTrigger,
    shouldUpdateQuery,
    setShouldUpdateQuery,
    triggerRerender,
  } = useChatStore();
  const seededNextId = useRef<string | null>(null);

  const threadMessages = useConvexQuery(
    api.threads.getThreadMessages,
    threadId ? { threadId: threadId as Id<"threads"> } : "skip"
  );

  const thread = useConvexQuery(
    api.threads.getThread,
    threadId ? { threadId: threadId as Id<"threads"> } : "skip"
  );

  const initialMessages = useMemo(() => {
    if (!threadMessages || "error" in threadMessages) return [];
    return backendToUiMessages(threadMessages);
  }, [threadMessages]);

  const chatHelpers = useChat({
    id: threadId === undefined ? `new_chat_${rerenderTrigger}` : threadId,
    headers: {
      authorization: `Bearer ${tokenData.token}`,
    },
    experimental_throttle: 50,
    experimental_prepareRequestBody(body) {
      if (threadId) {
        useChatStore.getState().setPendingStream(threadId, true);
      }
      const proposedNewAssistantId = nanoid();
      seededNextId.current = proposedNewAssistantId;

      const messages = body.messages as Message[];
      const message = messages[messages.length - 1];
      return {
        ...body.requestBody,
        id: threadId,
        proposedNewAssistantId,
        model: selectedModel,
        message: {
          parts: message?.parts,
          role: message?.role,
          messageId: message?.id,
        },
        enabledTools,
      };
    },
    initialMessages,
    onFinish: () => {
      if (shouldUpdateQuery) {
        setShouldUpdateQuery(false);
        triggerRerender();
      }
    },
    api: `${browserEnv("VITE_CONVEX_API_URL")}/chat`,
    generateId: () => {
      if (seededNextId.current) {
        const id = seededNextId.current;
        seededNextId.current = null;
        return id;
      }
      return nanoid();
    },
  });

  const customResume = useCallback(() => {
    console.log("[UCI:custom_resume]", {
      threadId: threadId?.slice(0, 8),
      backendMsgs:
        threadMessages && !("error" in threadMessages)
          ? threadMessages.length
          : 0,
      currentUIMsgs: chatHelpers.messages.length,
      initialMsgs: initialMessages.length,
    });

    if (initialMessages.length > 0) {
      chatHelpers.setMessages(initialMessages);
      console.log("[UCI:messages_restored]", { count: initialMessages.length });
    }

    chatHelpers.experimental_resume();
  }, [
    chatHelpers.setMessages,
    chatHelpers.experimental_resume,
    initialMessages,
    threadMessages,
    threadId,
    chatHelpers.messages.length,
  ]);

  useAutoResume({
    autoResume: true,
    thread: thread || undefined,
    threadId,
    experimental_resume: customResume,
    status: chatHelpers.status,
    threadMessages,
  });

  return { ...chatHelpers, seededNextId };
}
