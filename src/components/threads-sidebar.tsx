import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { authClient } from "@/lib/auth-client"
import { useDiskCachedPaginatedQuery } from "@/lib/convex-cached-query"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { isAfter, isToday, isYesterday, subDays } from "date-fns"
import { Loader2, MoreHorizontal, Pin, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

interface Thread {
    _id: Id<"threads">
    title: string
    createdAt: number
    authorId: string
    pinned?: boolean
}

function ThreadItem({ thread }: { thread: Thread }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const deleteThreadMutation = useMutation(api.threads.deleteThread)
    const togglePinMutation = useMutation(api.threads.togglePinThread)

    const handleDelete = async () => {
        try {
            await deleteThreadMutation({ threadId: thread._id })
            setShowDeleteDialog(false)
        } catch (error) {
            console.error("Failed to delete thread:", error)
            toast.error("Failed to delete thread")
        }
    }

    const handleTogglePin = async () => {
        const pinned = thread.pinned
        try {
            await togglePinMutation({ threadId: thread._id })
        } catch (error) {
            console.error("Failed to toggle pin:", error)
            toast.error(`Failed to ${pinned ? "unpin" : "pin"} thread`)
        }
    }

    return (
        <>
            <SidebarMenuItem>
                <div
                    className={cn(
                        "group/item flex w-full items-center rounded-sm hover:bg-accent/50",
                        isMenuOpen && "bg-accent/50"
                    )}
                >
                    <SidebarMenuButton asChild className="flex-1 hover:bg-transparent">
                        <Link to="/thread/$threadId" params={{ threadId: thread._id }}>
                            <span className="truncate">{thread.title}</span>
                        </Link>
                    </SidebarMenuButton>

                    <DropdownMenu onOpenChange={setIsMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "rounded p-1 transition-opacity",
                                    isMenuOpen || "opacity-0 group-hover/item:opacity-100"
                                )}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleTogglePin}>
                                <Pin className="h-4 w-4" />
                                {thread.pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                variant="destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </SidebarMenuItem>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-bold">{thread.title?.trim()}</span>? <br /> This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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
    const lastWeek = subDays(now, 7)
    const lastMonth = subDays(now, 30)

    const pinned: Thread[] = []
    const today: Thread[] = []
    const yesterdayThreads: Thread[] = []
    const lastSevenDays: Thread[] = []
    const lastThirtyDays: Thread[] = []

    threads.forEach((thread) => {
        const threadDate = new Date(thread.createdAt)
        if (thread.pinned) {
            pinned.push(thread)
            return
        }

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

function LoadingSkeleton() {
    return <></>
}

function EmptyState({ message }: { message: string }) {
    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <div className="p-4 text-center text-muted-foreground">{message}</div>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

export function ThreadsSidebar() {
    const [searchQuery, setSearchQuery] = useState("")
    const { data: session } = authClient.useSession()

    const {
        results: threads,
        status,
        loadMore
    } = useDiskCachedPaginatedQuery(
        api.threads.getUserThreadsPaginated,
        { key: "threads-sidebar", maxItems: 25 },
        session?.user?.id ? {} : "skip",
        {
            initialNumItems: 25
        }
    )

    const isLoading = false

    const sentinelRef = useInfiniteScroll({
        hasMore: status === "CanLoadMore",
        isLoading: false,
        onLoadMore: () => loadMore(25),
        rootMargin: "200px", // Start loading when sentinel is 200px away from viewport
        threshold: 0.1
    })

    const isAuthenticated = Boolean(session?.user?.id)
    const hasError = false // Remove error handling since we return empty results instead
    const threadsData = Array.isArray(threads) ? threads : []

    const filteredThreads = useMemo(() => {
        if (!searchQuery) return threadsData
        return threadsData.filter((thread: Thread) =>
            thread.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [threadsData, searchQuery])

    const groupedThreads = useMemo(() => {
        return groupThreadsByTime(filteredThreads)
    }, [filteredThreads])

    const renderContent = () => {
        if (!isAuthenticated) {
            return <></>
        }

        if (isLoading) {
            return <LoadingSkeleton />
        }

        if (hasError) {
            return <></>
        }

        if (filteredThreads.length === 0 && searchQuery) {
            return <EmptyState message="No threads match your search" />
        }

        return (
            <>
                <ThreadsGroup
                    title="Pinned"
                    threads={groupedThreads.pinned}
                    icon={<Pin className="h-4 w-4" />}
                />
                <ThreadsGroup title="Today" threads={groupedThreads.today} />
                <ThreadsGroup title="Yesterday" threads={groupedThreads.yesterday} />
                <ThreadsGroup title="Last 7 Days" threads={groupedThreads.lastSevenDays} />
                <ThreadsGroup title="Last 30 Days" threads={groupedThreads.lastThirtyDays} />

                {/* Infinite Scroll Sentinel */}
                {status === "CanLoadMore" && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div
                                ref={sentinelRef}
                                className="flex w-full items-center justify-center gap-2 p-3 text-muted-foreground text-sm"
                            >
                                {isLoading && (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading more threads...
                                    </>
                                )}
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </>
        )
    }

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="gap-3">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-base text-sidebar-foreground tracking-tight">
                        Intern3.chat
                    </div>
                </div>
                <Link
                    to="/"
                    className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
                >
                    <Plus />
                    New Chat
                </Link>
                <div className="relative">
                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search your threads..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </SidebarHeader>
            <SidebarContent>{renderContent()}</SidebarContent>
        </Sidebar>
    )
}
