import { CommandK } from "@/components/commandk"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarRail
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { authClient } from "@/lib/auth-client"
import { useDiskCachedPaginatedQuery, useDiskCachedQuery } from "@/lib/convex-cached-query"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useNavigate } from "@tanstack/react-router"
import { isAfter, isToday, isYesterday, subDays } from "date-fns"
import { ArrowBigUp, Loader2, Pin, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { LogoSymbol } from "./logo"
import { FolderItem } from "./threads/folder-item"
import { NewFolderButton } from "./threads/new-folder-button"
import { ThreadItem } from "./threads/thread-item"
import type { Thread } from "./threads/types"

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

    // Get all threads (not filtered by project anymore)
    const {
        results: allThreads,
        status,
        loadMore
    } = useDiskCachedPaginatedQuery(
        api.threads.getUserThreadsPaginated,
        {
            key: "threads",
            maxItems: 50
        },
        session?.user?.id
            ? {
                  includeInFolder: false
              }
            : "skip",
        {
            initialNumItems: 50
        }
    )

    // Get projects
    const projects = useDiskCachedQuery(
        api.folders.getUserProjects,
        {
            key: "projects",
            default: []
        },
        session?.user?.id ? {} : "skip"
    )

    const isLoading = false

    const sentinelRef = useInfiniteScroll({
        hasMore: status === "CanLoadMore",
        isLoading: false,
        onLoadMore: () => loadMore(25),
        rootMargin: "200px",
        threshold: 0.1
    })

    const isAuthenticated = Boolean(session?.user?.id)
    const hasError = false

    const groupedNonProjectThreads = useMemo(() => {
        return groupThreadsByTime(allThreads)
    }, [allThreads])

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

        handleScroll()
        container.addEventListener("scroll", handleScroll)

        const resizeObserver = new ResizeObserver(handleScroll)
        resizeObserver.observe(container)

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

        if (hasError || "error" in projects) {
            return <></>
        }

        const hasProjects = projects.length > 0
        const hasNonProjectThreads = allThreads.length > 0

        if (!hasProjects && !hasNonProjectThreads) {
            return <EmptyState message="No threads found" />
        }

        return (
            <>
                {/* Folders Section */}
                <SidebarGroup>
                    <SidebarGroupLabel className="pr-0">
                        Folders
                        <div className="flex-grow" />
                        <NewFolderButton />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects.map((project) => {
                                return (
                                    <FolderItem
                                        key={project._id}
                                        project={project}
                                        numThreads={project.threadCount}
                                    />
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Non-Project Threads */}
                {hasNonProjectThreads && (
                    <>
                        <ThreadsGroup
                            title="Pinned"
                            threads={groupedNonProjectThreads.pinned}
                            icon={<Pin className="h-4 w-4" />}
                        />
                        <ThreadsGroup title="Today" threads={groupedNonProjectThreads.today} />
                        <ThreadsGroup
                            title="Yesterday"
                            threads={groupedNonProjectThreads.yesterday}
                        />
                        <ThreadsGroup
                            title="Last 7 Days"
                            threads={groupedNonProjectThreads.lastSevenDays}
                        />
                        <ThreadsGroup
                            title="Last 30 Days"
                            threads={groupedNonProjectThreads.lastThirtyDays}
                        />
                    </>
                )}

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
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <LogoSymbol className="-translate-y-0.5 size-6 rounded-full" />
                    <div className="cursor-default select-none font-semibold text-sidebar-foreground text-xl">
                        <span>intern3.chat</span>
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
                {/* <Link
                    to="/library"
                    className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
                >
                    <FolderOpen className="h-4 w-4" />
                    Library
                </Link> */}
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
            <SidebarRail />
        </Sidebar>
    )
}
