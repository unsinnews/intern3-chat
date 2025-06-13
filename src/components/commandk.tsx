"use client";

import { useEffect, useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { useRouter } from "@tanstack/react-router";
import { Calendar, MessageSquare, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { search } from "@zanreal/search";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/hooks/auth-hooks";

interface Thread {
  _id: string;
  title: string;
  createdAt: number;
  authorId: string;
}

export function CommandK() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const session = useSession();
  const router = useRouter();

  const threads = useConvexQuery(
    api.threads.getAllUserThreads,
    session.user?.id ? {} : "skip"
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const searchResults =
    query && threads && !("error" in threads)
      ? search(threads, query, {
          fields: ["title"],
          fuzzyThreshold: 0.3,
          limit: 20,
        }).map((result) => result.item)
      : threads && !("error" in threads)
        ? threads.slice(0, 10)
        : [];

  const handleSelect = (threadId: string) => {
    setOpen(false);
    setQuery("");
    router.navigate({ to: "/thread/$threadId", params: { threadId } });
  };

  const formatRelativeTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  if (!session.user?.id) {
    return null;
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search chats..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No chats found.</CommandEmpty>
        {searchResults.length > 0 && (
          <CommandGroup heading="Chats">
            {searchResults.map((thread: Thread) => (
              <CommandItem
                key={thread._id}
                value={thread._id}
                onSelect={() => handleSelect(thread._id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{thread.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(thread.createdAt)}
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
