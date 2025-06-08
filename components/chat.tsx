import { useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Message, useChat } from "@ai-sdk/react";
import { Messages } from "@/components/messages";
import { MultimodalInput } from "@/components/multimodal-input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { browserEnv } from "@/convex/lib/env";
import { useToken } from "@/hooks/auth-hooks";
import { nanoid } from "nanoid";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useQueryClient } from "@tanstack/react-query";
import type { Id } from "@/convex/_generated/dataModel";
import { backendToUiMessages } from "@/convex/lib/backend_to_ui_messages";

export function Chat({
  threadId: routeThreadId,
}: {
  threadId: string | undefined;
}) {
  const [threadId, setThreadId] = useState<string | undefined>(routeThreadId);
  const tokenData = useToken();
  const seedNextId = useRef<string | null>(null);
  const lastProcessedDataIndex = useRef<number>(-1);
  const shouldUpdateQueryRef = useRef<boolean>(false);
  const queryClient = useQueryClient();
  const [rerenderTrigger, setRerenderTrigger] = useState(nanoid());
  const skipNextDataCheck = useRef<boolean>(true);
  const generateIdSeeded = useCallback(() => {
    if (seedNextId.current) {
      const copy = seedNextId.current;
      seedNextId.current = null;
      return copy;
    }

    const id = nanoid();
    return id;
  }, []);

  const threadMessages = useConvexQuery(
    api.threads.getThreadMessages,
    threadId
      ? {
          threadId: threadId as Id<"threads">,
        }
      : "skip"
  );

  const initialMessages = useMemo(() => {
    if (!threadMessages || "error" in threadMessages) return [];
    return backendToUiMessages(threadMessages);
  }, [threadMessages, threadId]);

  const { messages, append, experimental_resume, data, setMessages, setData } =
    useChat({
      id: threadId === undefined ? `new_chat_${rerenderTrigger}` : threadId,
      headers: {
        authorization: `Bearer ${tokenData.token}`,
      },
      experimental_prepareRequestBody(body) {
        const proposedNewAssistantId = generateIdSeeded();
        seedNextId.current = proposedNewAssistantId;

        const message = (body.messages as Message[]).pop();
        return {
          id: threadId,
          proposedNewAssistantId,
          message: {
            parts: message?.parts,
            role: message?.role,
            messageId: message?.id,
          },
        };
      },
      initialMessages,
      onFinish: () => {
        if (shouldUpdateQueryRef.current) {
          shouldUpdateQueryRef.current = false;
          setRerenderTrigger(nanoid());
        }
      },
      api: `${browserEnv("VITE_CONVEX_API_URL")}/chat`,
      generateId: generateIdSeeded,
    });

  useAutoResume({
    autoResume: true,
    initialMessages: [],
    experimental_resume,
    data,
    setMessages,
  });

  const resetAll = () => {
    console.log("resetAll");
    setThreadId(undefined);
    setData([]);
    setMessages([]);
    setRerenderTrigger(nanoid());
    lastProcessedDataIndex.current = -1;
    shouldUpdateQueryRef.current = false;
    skipNextDataCheck.current = true;
  };

  useEffect(() => {
    if (routeThreadId === undefined) {
      resetAll();
    } else {
      setThreadId(routeThreadId);
      setRerenderTrigger(nanoid());
    }
  }, [routeThreadId]);

  useEffect(() => {
    if (skipNextDataCheck.current) {
      skipNextDataCheck.current = false;
      return;
    }
    if (!data || data.length === 0 || messages.length < 0) return;

    for (const _item of data?.slice(lastProcessedDataIndex.current + 1) ?? []) {
      if (!_item) continue;
      const item = _item as { type: string; content: string };
      if (item.type === "thread_id") {
        setThreadId(item.content);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", `/thread/${item.content}`);
        }
        shouldUpdateQueryRef.current = true;
      }
    }

    lastProcessedDataIndex.current = (data?.length ?? 0) - 1;
  }, [data]);

  console.log("messages", messages, threadMessages, threadId);
  return (
    <div className="flex h-full grow flex-col">
      <Messages messages={messages} />
      <MultimodalInput append={append} />
    </div>
  );
}
