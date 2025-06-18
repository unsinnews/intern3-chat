import { MultimodalInput } from "@/components/multimodal-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useChatActions } from "@/hooks/use-chat-actions"
import { useChatIntegration } from "@/hooks/use-chat-integration"
import type { UploadedFile } from "@/lib/chat-store"
import { DEFAULT_PROJECT_ICON, getProjectColorClasses } from "@/lib/project-constants"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { format } from "date-fns"
import { Edit, FileText, MessageSquare } from "lucide-react"
import { memo, useCallback, useEffect } from "react"

interface FolderViewProps {
    folderId: Id<"projects">
}

function FolderViewBase({ folderId }: FolderViewProps) {
    const navigate = useNavigate()
    const project = useQuery(api.projects.getProject, { projectId: folderId })
    const threadCounts = useQuery(api.projects.getProjectThreadCounts) || {}

    // Get recent threads in this folder
    const recentThreads = useQuery(api.threads.getThreadsByProject, {
        projectId: folderId,
        paginationOpts: { numItems: 5, cursor: null }
    })

    // Use chat integration to track new thread creation
    const { thread } = useChatIntegration({
        threadId: undefined,
        folderId
    })

    const { handleInputSubmit } = useChatActions({
        threadId: undefined, // Start new conversation
        folderId // Pass the folderId so new threads get associated with this folder
    })

    const handleFolderInputSubmit = useCallback(
        async (inputValue?: string, fileValues?: UploadedFile[]) => {
            // Submit the message to create a new thread in this folder
            handleInputSubmit(inputValue, fileValues)
            // Don't navigate here - let the useEffect handle it when thread is created
        },
        [handleInputSubmit]
    )

    // Navigate to the new thread when it's created
    useEffect(() => {
        console.log("[FolderView] Thread changed:", {
            hasThread: !!thread,
            hasId: thread && "_id" in thread && !!thread._id,
            threadId: thread && "_id" in thread ? thread._id : null
        })

        if (thread && "_id" in thread && thread._id) {
            console.log("[FolderView] Navigating to thread:", thread._id)
            navigate({ to: "/thread/$threadId", params: { threadId: thread._id as string } })
        }
    }, [thread, navigate])

    if (!project) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <h2 className="mb-2 font-semibold text-xl">Folder not found</h2>
                    <p>This folder may have been deleted or you don't have access to it.</p>
                </div>
            </div>
        )
    }

    const colorClasses = getProjectColorClasses(project.color as any)
    const threadCount = threadCounts[folderId] || 0
    const threads = recentThreads?.page || []

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-6 overflow-auto p-6">
                {/* Folder Header */}
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            "flex h-16 w-16 items-center justify-center rounded-lg text-2xl",
                            colorClasses.split(" ").slice(1).join(" ")
                        )}
                    >
                        {project.icon || DEFAULT_PROJECT_ICON}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                            <h1 className="truncate font-bold text-3xl">{project.name}</h1>
                            <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                        {project.description && (
                            <p className="text-lg text-muted-foreground">{project.description}</p>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 font-medium text-sm">
                                <MessageSquare className="h-4 w-4" />
                                Conversations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-bold text-2xl">{threadCount}</div>
                            <p className="text-muted-foreground text-xs">
                                Total threads in this folder
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 font-medium text-sm">
                                <FileText className="h-4 w-4" />
                                Created
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-bold text-2xl">
                                {format(new Date(project.createdAt), "MMM d")}
                            </div>
                            <p className="text-muted-foreground text-xs">
                                {format(new Date(project.createdAt), "yyyy")}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Threads */}
                {threads.length > 0 && (
                    <div>
                        <h2 className="mb-4 font-semibold text-xl">Recent Conversations</h2>
                        <div className="space-y-2">
                            {threads.map((thread) => (
                                <Link
                                    key={thread._id}
                                    to="/thread/$threadId"
                                    params={{ threadId: thread._id }}
                                    className="block rounded-lg border p-3 transition-colors hover:bg-accent/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-medium">{thread.title}</h3>
                                            <p className="text-muted-foreground text-sm">
                                                {format(
                                                    new Date(thread.createdAt),
                                                    "MMM d, yyyy 'at' h:mm a"
                                                )}
                                            </p>
                                        </div>
                                        {thread.pinned && (
                                            <div className="ml-2 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {threadCount > threads.length && (
                            <div className="mt-4 text-center">
                                <p className="text-muted-foreground text-sm">
                                    And {threadCount - threads.length} more conversations...
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {threadCount === 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>No conversations yet</CardTitle>
                            <CardDescription>
                                Start a new conversation in this folder using the input below.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>

            {/* Input at bottom */}
            <div className="border-t bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto max-w-4xl">
                    <MultimodalInput onSubmit={handleFolderInputSubmit} status="ready" />
                </div>
            </div>
        </div>
    )
}

export const FolderView = memo(FolderViewBase)
