import { CommandK } from "@/components/commandk"
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
import { Button, buttonVariants } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { authClient } from "@/lib/auth-client"
import { useDiskCachedPaginatedQuery } from "@/lib/convex-cached-query"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { isAfter, isToday, isYesterday, subDays } from "date-fns"
import { ArrowBigUp, Loader2, MoreHorizontal, Pin, Search, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
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
    const params = useParams({ strict: false }) as { threadId?: string }
    const isActive = params.threadId === thread._id

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
                        isMenuOpen && "bg-accent/50",
                        isActive && "bg-accent/60"
                    )}
                >
                    <SidebarMenuButton
                        asChild
                        className={cn("flex-1 hover:bg-transparent", isActive && "text-foreground")}
                    >
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
    const [showGradient, setShowGradient] = useState(false)
    const [commandKOpen, setCommandKOpen] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const { data: session } = authClient.useSession()
    const navigate = useNavigate()

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

    const groupedThreads = useMemo(() => {
        return groupThreadsByTime(threadsData)
    }, [threadsData])

    // Keyboard shortcut for new chat (Cmd+Shift+O)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey && event.shiftKey && event.key.toLowerCase() === "o") {
                event.preventDefault()
                navigate({ to: "/" })
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [navigate])

    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            const hasScrollableContent = scrollHeight > clientHeight
            const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 5
            setShowGradient(hasScrollableContent && !isScrolledToBottom)
        }

        handleScroll() // Initial check
        container.addEventListener("scroll", handleScroll)

        // Watch for container size changes
        const resizeObserver = new ResizeObserver(handleScroll)
        resizeObserver.observe(container)

        // Watch for DOM content changes (threads added/removed)
        const mutationObserver = new MutationObserver(handleScroll)
        mutationObserver.observe(container, {
            childList: true,
            subtree: true
        })

        return () => {
            container.removeEventListener("scroll", handleScroll)
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [])

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

        if (threadsData.length === 0) {
            return <EmptyState message="No threads found" />
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
            <SidebarHeader className="mt-1 gap-3">
                <div className="flex items-center justify-between">
                    <div className="cursor-default select-none font-medium text-sidebar-foreground text-xl">
                        intern3.chat
                    </div>
                </div>
                <div className="h-px w-full bg-border" />
                <Tooltip>
                    <TooltipTrigger>
                        <Link
                            to="/"
                            className={cn(
                                buttonVariants({ variant: "default" }),
                                "w-full justify-center"
                            )}
                        >
                            New Chat
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <div className="flex items-center gap-1">
                            <span className="w-3.5 text-sm">
                                <ArrowBigUp className="size-4" />
                            </span>
                            <span className="text-sm">⌘</span>
                            <span className="text-sm">O</span>
                        </div>
                    </TooltipContent>
                </Tooltip>
                <Button onClick={() => setCommandKOpen(true)} variant="outline">
                    <Search className="h-4 w-4" />
                    Search chats
                    <div className="ml-auto flex items-center gap-1 text-xs">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-muted-foreground">
                            <span className="text-sm">⌘</span>
                            <span className="text-xs">K</span>
                        </kbd>
                    </div>
                </Button>
            </SidebarHeader>
            <SidebarContent ref={scrollContainerRef} className="scrollbar-hide">
                {renderContent()}
            </SidebarContent>
            {showGradient && (
                <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-20 bg-gradient-to-t from-sidebar via-sidebar/60 to-transparent" />
            )}
            <CommandK open={commandKOpen} onOpenChange={setCommandKOpen} />
        </Sidebar>
    )
}
