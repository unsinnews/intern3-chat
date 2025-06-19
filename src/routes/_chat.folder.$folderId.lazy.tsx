import { FolderHero } from "@/components/folder-hero"
import { MultimodalInput } from "@/components/multimodal-input"
import { SignupMessagePrompt } from "@/components/signup-message-prompt"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { MODELS_SHARED } from "@/convex/lib/models"
import { useSession } from "@/hooks/auth-hooks"
import { useChatActions } from "@/hooks/use-chat-actions"
import { useChatDataProcessor } from "@/hooks/use-chat-data-processor"
import { useChatIntegration } from "@/hooks/use-chat-integration"
import { useDynamicTitle } from "@/hooks/use-dynamic-title"
import { useThreadSync } from "@/hooks/use-thread-sync"
import type { UploadedFile } from "@/lib/chat-store"
import { getChatWidthClass, useChatWidthStore } from "@/lib/chat-width-store"
import { useDiskCachedQuery } from "@/lib/convex-cached-query"
import { useModelStore } from "@/lib/model-store"
import { useThemeStore } from "@/lib/theme-store"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useLocation } from "@tanstack/react-router"
import { createLazyFileRoute } from "@tanstack/react-router"
import { usePaginatedQuery } from "convex/react"
import { format } from "date-fns"
import { Clock, Pin } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useRef } from "react"
import { useStickToBottom } from "use-stick-to-bottom"

interface FolderChatProps {
    folderId: Id<"projects">
}

const FolderChat = ({ folderId }: FolderChatProps) => {
    const { selectedModel, setSelectedModel } = useModelStore()
    const { threadId } = useThreadSync({ routeThreadId: undefined })
    const { scrollToBottom, isAtBottom, contentRef, scrollRef } = useStickToBottom({
        initial: "instant",
        resize: "instant"
    })
    const { themeState } = useThemeStore()
    const mode = themeState.currentMode
    const { data: session, isPending } = useSession()
    const location = useLocation()

    useDynamicTitle({ threadId })

    useMemo(() => {
        if (!selectedModel && MODELS_SHARED.length > 0) {
            setSelectedModel(MODELS_SHARED[0].id)
        }
    }, [selectedModel, setSelectedModel])

    const projects = useDiskCachedQuery(
        api.folders.getUserProjects,
        {
            key: "projects",
            default: []
        },
        session?.user?.id ? {} : "skip"
    )
    const project =
        "error" in projects ? null : projects?.find((project) => project._id === folderId)

    const { status, data, messages } = useChatIntegration({
        threadId,
        folderId
    })

    const { handleInputSubmit } = useChatActions({
        threadId,
        folderId
    })

    useChatDataProcessor({ data, messages })

    const handleInputSubmitWithScroll = (inputValue?: string, fileValues?: UploadedFile[]) => {
        handleInputSubmit(inputValue, fileValues)
        scrollToBottom({ animation: "smooth" })
    }

    if (!session?.user && !isPending) {
        return (
            <div className="relative flex h-[calc(100vh-64px)] items-center justify-center">
                <SignupMessagePrompt />
            </div>
        )
    }

    // Recent threads component for FolderHero
    const RecentThreads = () => {
        const isRootPath = location.pathname === "/"

        // Fetch recent threads in this folder
        const recentThreads = usePaginatedQuery(
            api.threads.getThreadsByProject,
            { projectId: folderId },
            {
                initialNumItems: 25
            }
        )
        const scrollRef = useRef<HTMLDivElement>(null)

        useEffect(() => {
            const target = scrollRef.current
            if (!target) return

            const observer = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries
                    if (entry.isIntersecting && recentThreads.status === "CanLoadMore") {
                        recentThreads.loadMore(25)
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: "100px"
                }
            )

            observer.observe(target)

            return () => {
                observer.disconnect()
            }
        }, [recentThreads.status])

        const threads = recentThreads?.results || []

        const containerAnimProps = isRootPath
            ? {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.3, delay: 0.1 }
              }
            : {}

        if (threads.length === 0)
            return (
                <motion.div {...containerAnimProps} className="mt-8 w-full">
                    <div className="mb-4 flex items-center gap-2 font-medium text-muted-foreground text-sm">
                        <Clock className="size-4" />
                        Recent conversations
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 lg:grid-cols-3">
                        <div className="col-span-full">
                            <div className="flex items-center justify-center rounded-lg border bg-background/50 px-4 py-3">
                                <p className="text-muted-foreground text-sm">
                                    No recent conversations
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )

        return (
            <motion.div {...containerAnimProps} className="mt-8 w-full">
                <div className="mb-4 flex items-center gap-2 font-medium text-muted-foreground text-sm">
                    <Clock className="size-4" />
                    Recent conversations
                </div>
                <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 lg:grid-cols-3">
                    {threads.map((thread, index) => {
                        const threadAnimProps = isRootPath
                            ? {
                                  initial: { opacity: 0, x: -10 },
                                  animate: { opacity: 1, x: 0 },
                                  transition: { duration: 0.2, delay: 0.05 * index }
                              }
                            : {}

                        return (
                            <motion.div key={thread._id} {...threadAnimProps}>
                                <Link
                                    to="/thread/$threadId"
                                    params={{ threadId: thread._id }}
                                    className="flex items-center gap-3 rounded-lg border bg-background/50 px-4 py-3 transition-colors hover:bg-accent/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium text-sm">
                                            {thread.title}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            {format(thread.createdAt, "MMM d, yyyy")}
                                        </div>
                                    </div>
                                    {thread.pinned && (
                                        <div className="text-muted-foreground">
                                            <Pin className="h-4 w-4" />
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        )
                    })}
                    <div ref={scrollRef} className="col-span-full" />
                </div>
            </motion.div>
        )
    }

    const chatWidth = useChatWidthStore((state) => state.chatWidthState.chatWidth)

    return (
        <div
            className={cn(
                "relative mx-auto flex h-[calc(100vh-64px)] w-full flex-col",
                getChatWidthClass(chatWidth)
            )}
        >
            <AnimatePresence mode="sync">
                <div className="mt-32" />
                <FolderHero project={project} />
                <RecentThreads />
                <motion.div
                    key="bottom-input"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="-bottom-[3.875rem] md:-bottom-10 absolute inset-x-0 z-[10] flex flex-col items-center justify-center gap-2"
                >
                    <MultimodalInput onSubmit={handleInputSubmitWithScroll} status={status} />
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export const Route = createLazyFileRoute("/_chat/folder/$folderId")({
    component: () => {
        const { folderId } = Route.useParams()
        return <FolderChat folderId={folderId as Id<"projects">} />
    }
})
