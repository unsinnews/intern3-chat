import { Messages } from "@/components/messages"
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
import { useModelStore } from "@/lib/model-store"
import { DEFAULT_PROJECT_ICON, getProjectColorClasses } from "@/lib/project-constants"
import { useThemeStore } from "@/lib/theme-store"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useLocation } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Pin } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo } from "react"
import { useStickToBottom } from "use-stick-to-bottom"
import { Logo } from "./logo"
import { MultimodalInput } from "./multimodal-input"
import { SignupMessagePrompt } from "./signup-message-prompt"
import { StickToBottomButton } from "./stick-to-bottom-button"

interface ChatProps {
    threadId: string | undefined
    folderId?: Id<"projects">
}

const ChatContent = ({ threadId: routeThreadId, folderId }: ChatProps) => {
    const { selectedModel, setSelectedModel } = useModelStore()
    const { threadId } = useThreadSync({ routeThreadId })
    const { scrollToBottom, isAtBottom, contentRef, scrollRef } = useStickToBottom({
        initial: "instant",
        resize: "instant"
    })
    const { themeState } = useThemeStore()
    const mode = themeState.currentMode
    // const { setTargetFromMessageId } = useChatStore()
    const { data: session } = useSession()
    const location = useLocation()

    useDynamicTitle({ threadId })

    useMemo(() => {
        if (!selectedModel && MODELS_SHARED.length > 0) {
            setSelectedModel(MODELS_SHARED[0].id)
        }
    }, [selectedModel, setSelectedModel])

    // Fetch project info if folderId is provided
    const project = useQuery(api.folders.getProject, folderId ? { projectId: folderId } : "skip")

    const { status, data, messages } = useChatIntegration({
        threadId,
        folderId
    })

    const { handleInputSubmit, handleRetry, handleEditAndRetry } = useChatActions({
        threadId,
        folderId
    })

    useChatDataProcessor({ data, messages })

    const handleInputSubmitWithScroll = (inputValue?: string, fileValues?: UploadedFile[]) => {
        handleInputSubmit(inputValue, fileValues)
        scrollToBottom({ animation: "smooth" })
    }

    const isEmpty = !threadId && messages.length === 0
    const userName = session?.user?.name

    if (!session?.user) {
        return (
            <div className="relative flex h-[calc(100vh-64px)] items-center justify-center">
                <SignupMessagePrompt />
            </div>
        )
    }

    // Create folder indicator component
    const FolderIndicator = () => {
        if (!folderId || !project) return null

        const colorClasses = getProjectColorClasses(project.color as any)

        return (
            <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <div
                    className={cn(
                        "flex h-5 w-5 items-center justify-center rounded text-xs",
                        colorClasses.split(" ").slice(1).join(" ")
                    )}
                >
                    {project.icon || DEFAULT_PROJECT_ICON}
                </div>
                <span className="font-medium text-sm">{project.name}</span>
            </div>
        )
    }

    // Create folder hero section for empty state
    const FolderHero = () => {
        if (!folderId || !project) return null

        const colorClasses = getProjectColorClasses(project.color as any)
        const isRootPath = location.pathname === "/"

        // Fetch recent threads in this folder
        const recentThreads = useQuery(api.threads.getThreadsByProject, {
            projectId: folderId,
            paginationOpts: { numItems: 5, cursor: null }
        })

        const threads = recentThreads?.page || []

        const animProps = isRootPath
            ? {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.3 }
              }
            : {}

        return (
            <motion.div {...animProps} className="mb-8 w-full max-w-4xl px-8 text-left">
                {/* Large folder icon */}
                <div
                    className={cn(
                        "mb-6 flex h-16 w-16 items-center justify-center rounded-xl text-4xl",
                        colorClasses.split(" ").slice(1).join(" ")
                    )}
                >
                    {project.icon || DEFAULT_PROJECT_ICON}
                </div>

                {/* Folder name and description */}
                <h1 className="mb-2 font-bold text-3xl text-foreground">{project.name}</h1>
                {project.description && (
                    <p className="mb-6 max-w-md text-lg text-muted-foreground">
                        {project.description}
                    </p>
                )}
            </motion.div>
        )
    }

    // Recent threads component for FolderHero
    const RecentThreads = () => {
        if (!folderId) return null

        const isRootPath = location.pathname === "/"

        // Fetch recent threads in this folder
        const recentThreads = useQuery(api.threads.getThreadsByProject, {
            projectId: folderId,
            paginationOpts: { numItems: 5, cursor: null }
        })

        const threads = recentThreads?.page || []

        if (threads.length === 0) return null

        const containerAnimProps = isRootPath
            ? {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.3, delay: 0.1 }
              }
            : {}

        return (
            <motion.div {...containerAnimProps} className="w-full max-w-4xl px-8">
                <div className="mb-4 font-medium text-muted-foreground text-sm">
                    Recent conversations
                </div>
                <div className="space-y-2">
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
                                            {new Date(thread.createdAt).toLocaleDateString()}
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
                </div>
            </motion.div>
        )
    }

    return (
        <div className="relative mb-80 flex h-[calc(100vh-64px)] flex-col">
            <Messages
                messages={messages}
                onRetry={handleRetry}
                onEditAndRetry={handleEditAndRetry}
                status={status}
                contentRef={contentRef}
                scrollRef={scrollRef}
            />

            <AnimatePresence mode="sync">
                {isEmpty ? (
                    <motion.div
                        key="centered-input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className={cn("absolute inset-0 flex flex-col items-center justify-center")}
                    >
                        {/* Show folder hero if in folder, otherwise show regular logo and greeting */}
                        {folderId ? (
                            <FolderHero />
                        ) : (
                            <>
                                <div className="mb-6 size-16 rounded-full border-2 opacity-80">
                                    <Logo />
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mb-8 text-center"
                                >
                                    <h1 className="px-4 font-medium text-3xl text-foreground">
                                        {userName
                                            ? `What do you want to explore, ${userName?.split(" ")[0]}?`
                                            : "What do you want to explore?"}
                                    </h1>
                                </motion.div>
                            </>
                        )}

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-4xl px-4"
                        >
                            <MultimodalInput
                                onSubmit={handleInputSubmitWithScroll}
                                status={status}
                            />
                        </motion.div>

                        {/* Recent threads for folder */}
                        {folderId && (
                            <div className="mt-8">
                                <RecentThreads />
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="bottom-input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="-bottom-[3.875rem] md:-bottom-10 absolute inset-x-0 z-[10] flex flex-col items-center justify-center gap-2"
                    >
                        <StickToBottomButton
                            isAtBottom={isAtBottom}
                            scrollToBottom={scrollToBottom}
                        />
                        {/* Folder indicator above the input when there are messages */}
                        {folderId && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <FolderIndicator />
                            </motion.div>
                        )}
                        <MultimodalInput onSubmit={handleInputSubmitWithScroll} status={status} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export const Chat = ({ threadId, folderId }: ChatProps) => {
    return <ChatContent threadId={threadId} folderId={folderId} />
}
