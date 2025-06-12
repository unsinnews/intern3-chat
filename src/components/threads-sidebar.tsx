import { Link } from "@tanstack/react-router"
import { useQuery as useConvexQuery } from "convex/react"
import { isAfter, isToday, isYesterday, subDays } from "date-fns"
import { Pin, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/hooks/auth-hooks"
import { useState } from "react"

interface Thread {
    _id: string
    title: string
    createdAt: number
    authorId: string
}

function ThreadItem({ thread }: { thread: Thread }) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild>
                <Link to="/thread/$threadId" params={{ threadId: thread._id }}>
                    <span className="truncate">{thread.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

function ThreadsGroup({
    title,
    threads,
    icon
}: {
    title: string
    threads: Thread[]
    icon?: React.ReactNode
}) {
    if (threads.length === 0) return null

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
                {icon}
                {title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {threads.map((thread) => (
                        <ThreadItem key={thread._id} thread={thread} />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

function groupThreadsByTime(threads: Thread[]) {
    const now = new Date()
    const yesterday = subDays(now, 1)
    const lastWeek = subDays(now, 7)
    const lastMonth = subDays(now, 30)

    const pinned: Thread[] = []
    const today: Thread[] = []
    const yesterdayThreads: Thread[] = []
    const lastSevenDays: Thread[] = []
    const lastThirtyDays: Thread[] = []

    threads.forEach((thread) => {
        const threadDate = new Date(thread.createdAt)

        if (isToday(threadDate)) {
            today.push(thread)
        } else if (isYesterday(threadDate)) {
            yesterdayThreads.push(thread)
        } else if (isAfter(threadDate, lastWeek)) {
            lastSevenDays.push(thread)
        } else if (isAfter(threadDate, lastMonth)) {
            lastThirtyDays.push(thread)
        }
    })

    return {
        pinned,
        today,
        yesterday: yesterdayThreads,
        lastSevenDays,
        lastThirtyDays
    }
}

export function ThreadsSidebar() {
    const [searchQuery, setSearchQuery] = useState("")
    const session = useSession()

    const threads = useConvexQuery(api.threads.getAllUserThreads, session.user?.id ? {} : "skip")
    const isLoading = threads === undefined

    if (!session.user?.id) {
        return (
            <Sidebar variant="inset">
                <SidebarHeader className="gap-3">
                    <div className="flex items-center justify-between">
                        <div className="font-medium text-base text-sidebar-foreground">T3.chat</div>
                    </div>
                    <Button asChild className="w-full justify-start">
                        <Link to="/">
                            <Plus />
                            New Chat
                        </Link>
                    </Button>
                </SidebarHeader>
                <SidebarContent>
                    <div className="p-4 text-center text-muted-foreground">
                        Sign in to view your threads
                    </div>
                </SidebarContent>
            </Sidebar>
        )
    }

    if (isLoading) {
        return (
            <Sidebar variant="inset">
                <SidebarHeader className="gap-3">
                    <div className="flex items-center justify-between">
                        <div className="font-medium text-base text-sidebar-foreground">T3.chat</div>
                    </div>
                    <Button className="w-full justify-start">
                        <Plus />
                        New Chat
                    </Button>
                    <div className="relative">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search your threads..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div className="space-y-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        )
    }

    if (!threads || "error" in threads) {
        return (
            <Sidebar variant="inset">
                <SidebarHeader>
                    <div className="font-medium text-base text-sidebar-foreground">T3.chat</div>
                </SidebarHeader>
                <SidebarContent>
                    <div className="p-4 text-center text-muted-foreground">
                        Failed to load threads
                    </div>
                </SidebarContent>
            </Sidebar>
        )
    }

    const filteredThreads = searchQuery
        ? threads.filter((thread: Thread) =>
              thread.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : threads

    const groupedThreads = groupThreadsByTime(filteredThreads)

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="gap-3">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-base text-sidebar-foreground">T3.chat</div>
                </div>
                <Button asChild className="w-full justify-start">
                    <Link to="/">
                        <Plus />
                        New Chat
                    </Link>
                </Button>
                <div className="relative">
                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search your threads..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <ThreadsGroup
                    title="Pinned"
                    threads={groupedThreads.pinned}
                    icon={<Pin className="h-4 w-4" />}
                />
                <ThreadsGroup title="Today" threads={groupedThreads.today} />
                <ThreadsGroup title="Yesterday" threads={groupedThreads.yesterday} />
                <ThreadsGroup title="Last 7 Days" threads={groupedThreads.lastSevenDays} />
                <ThreadsGroup title="Last 30 Days" threads={groupedThreads.lastThirtyDays} />
            </SidebarContent>
        </Sidebar>
    )
}
