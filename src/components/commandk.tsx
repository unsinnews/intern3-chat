"use client"

import { useRouter } from "@tanstack/react-router"
import { search } from "@zanreal/search"
import { useQuery as useConvexQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { Calendar, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"

interface Thread {
    _id: string
    title: string
    createdAt: number
    authorId: string
}

export function CommandK() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const { data: session } = authClient.useSession()
    const router = useRouter()

    const threads = useConvexQuery(
        api.threads.getAllUserThreadsForSearch,
        session?.user?.id ? {} : "skip"
    )

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const searchResults =
        query && threads && !("error" in threads)
            ? search(threads, query, {
                  fields: ["title"],
                  fuzzyThreshold: 0.3,
                  limit: 20
              }).map((result) => result.item)
            : threads && !("error" in threads)
              ? threads.slice(0, 10)
              : []

    const handleSelect = (threadId: string) => {
        setOpen(false)
        setQuery("")
        router.navigate({ to: "/thread/$threadId", params: { threadId } })
    }

    const formatRelativeTime = (timestamp: number) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
        } catch {
            return "Unknown time"
        }
    }

    if (!session?.user?.id) {
        return null
    }

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search chats..." value={query} onValueChange={setQuery} />
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
                                <div className="flex w-full items-center gap-3">
                                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">{thread.title}</div>
                                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
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
    )
}
