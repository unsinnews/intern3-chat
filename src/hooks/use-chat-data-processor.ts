import { useChatStore } from "@/lib/chat-store";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";

interface UseChatDataProcessorProps {
  data: UseChatHelpers["data"];
  messages: UseChatHelpers["messages"];
}

export function useChatDataProcessor({
  data,
  messages,
}: UseChatDataProcessorProps) {
  const {
    skipNextDataCheck,
    lastProcessedDataIndex,
    setThreadId,
    setShouldUpdateQuery,
    setLastProcessedDataIndex,
    setSkipNextDataCheck,
  } = useChatStore();

  useEffect(() => {
    if (skipNextDataCheck) {
      setSkipNextDataCheck(false);
      return;
    }

    if (!data || data.length === 0 || messages.length < 0) return;

    for (const _item of data?.slice(lastProcessedDataIndex + 1) ?? []) {
      if (!_item) continue;
      const item = _item as { type: string; content: string };

      if (item.type === "thread_id") {
        setThreadId(item.content);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", `/thread/${item.content}`);
        }
        setShouldUpdateQuery(true);
      }
    }

    setLastProcessedDataIndex((data?.length ?? 0) - 1);
  }, [
    data,
    messages.length,
    skipNextDataCheck,
    lastProcessedDataIndex,
    setThreadId,
    setShouldUpdateQuery,
    setLastProcessedDataIndex,
    setSkipNextDataCheck,
  ]);
}
