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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { authClient } from "@/lib/auth-client"
import { useDiskCachedPaginatedQuery } from "@/lib/convex-cached-query"
import { DEFAULT_PROJECT_ICON, getProjectColorClasses } from "@/lib/project-constants"
import { useProjectStore } from "@/lib/project-store"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { isAfter, isToday, isYesterday, subDays } from "date-fns"
import {
    ArrowBigUp,
    ChevronDown,
    ChevronRight,
    Edit3,
    FolderOpen,
    FolderPlus,
    Loader2,
    MoreHorizontal,
    Pin,
    Search,
    Trash2
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

interface Thread {
    _id: Id<"threads">
    title: string
    createdAt: number
    authorId: string
    pinned?: boolean
    projectId?: Id<"projects">
}

interface Project {
    _id: Id<"projects">
    name: string
    description?: string
    color?: string
    icon?: string
}

function ThreadItem({ thread, isInFolder = false }: { thread: Thread; isInFolder?: boolean }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [showMoveDialog, setShowMoveDialog] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [renameValue, setRenameValue] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)
    const [isMoving, setIsMoving] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>(
        thread.projectId || "no-folder"
    )

    const deleteThreadMutation = useMutation(api.threads.deleteThread)
    const renameThreadMutation = useMutation(api.threads.renameThread)
    const togglePinMutation = useMutation(api.threads.togglePinThread)
    const moveThreadMutation = useMutation(api.projects.moveThreadToProject)
    const projects = useQuery(api.projects.getUserProjects) || []
    const params = useParams({ strict: false }) as { threadId?: string }
    const isActive = params.threadId === thread._id
    const navigate = useNavigate()

    const handleDelete = async () => {
        try {
            if (isActive) {
                navigate({ to: "/", replace: true })
            }
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

    const handleRename = async () => {
        const trimmedValue = renameValue.trim()
        if (!trimmedValue) {
            toast.error("Thread name cannot be empty")
            return
        }

        if (trimmedValue === thread.title) {
            setShowRenameDialog(false)
            setRenameValue("")
            return
        }

        setIsRenaming(true)
        try {
            const result = await renameThreadMutation({
                threadId: thread._id,
                title: trimmedValue
            })

            if (result && "error" in result) {
                toast.error(
                    typeof result.error === "string" ? result.error : "Failed to rename thread"
                )
            } else {
                toast.success("Thread renamed successfully")
                setShowRenameDialog(false)
                setRenameValue("")
            }
        } catch (error) {
            console.error("Failed to rename thread:", error)
            toast.error("Failed to rename thread")
        } finally {
            setIsRenaming(false)
        }
    }

    const handleMove = async () => {
        const newProjectId =
            selectedProjectId === "no-folder" ? undefined : (selectedProjectId as Id<"projects">)

        // Don't move if it's already in the same location
        if ((thread.projectId || "no-folder") === selectedProjectId) {
            setShowMoveDialog(false)
            return
        }

        setIsMoving(true)
        try {
            const result = await moveThreadMutation({
                threadId: thread._id,
                projectId: newProjectId
            })

            if (result && "error" in result) {
                toast.error(
                    typeof result.error === "string" ? result.error : "Failed to move thread"
                )
            } else {
                const targetName = newProjectId
                    ? projects.find((p) => p._id === newProjectId)?.name || "folder"
                    : "General"
                toast.success(`Thread moved to ${targetName}`)
                setShowMoveDialog(false)
            }
        } catch (error) {
            console.error("Failed to move thread:", error)
            toast.error("Failed to move thread")
        } finally {
            setIsMoving(false)
        }
    }

    const openRenameDialog = () => {
        setRenameValue(thread.title)
        setShowRenameDialog(true)
    }

    const openMoveDialog = () => {
        setSelectedProjectId(thread.projectId || "no-folder")
        setShowMoveDialog(true)
    }

    return (
        <>
            <SidebarMenuItem className={isInFolder ? "pl-6" : ""}>
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
                                <MoreHorizontal className="mr-1 h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={openRenameDialog}>
                                <Edit3 className="h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleTogglePin}>
                                <Pin className="h-4 w-4" />
                                {thread.pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={openMoveDialog}>
                                <FolderOpen className="h-4 w-4" />
                                Move to folder
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

            {/* Rename Dialog */}
            <Dialog
                open={showRenameDialog}
                onOpenChange={(open) => {
                    if (!isRenaming) {
                        setShowRenameDialog(open)
                        if (!open) {
                            setRenameValue("")
                        }
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Thread</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter thread name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isRenaming) {
                                    handleRename()
                                } else if (e.key === "Escape" && !isRenaming) {
                                    setShowRenameDialog(false)
                                }
                            }}
                            disabled={isRenaming}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRenameDialog(false)}
                            disabled={isRenaming}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRename} disabled={isRenaming || !renameValue.trim()}>
                            {isRenaming ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Renaming...
                                </>
                            ) : (
                                "Rename"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move to Folder Dialog */}
            <Dialog
                open={showMoveDialog}
                onOpenChange={(open) => {
                    if (!isMoving) {
                        setShowMoveDialog(open)
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move to Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <RadioGroup
                            value={selectedProjectId}
                            onValueChange={setSelectedProjectId}
                            disabled={isMoving}
                        >
                            {/* No folder option */}
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no-folder" id="no-folder" />
                                <Label
                                    htmlFor="no-folder"
                                    className="flex cursor-pointer items-center gap-2"
                                >
                                    <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-gray-100 text-gray-600 text-xs">
                                        📁
                                    </div>
                                    <span>General (No folder)</span>
                                </Label>
                            </div>

                            {/* Folder options */}
                            {projects.map((project) => {
                                const colorClasses = getProjectColorClasses(project.color as any)
                                return (
                                    <div key={project._id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={project._id} id={project._id} />
                                        <Label
                                            htmlFor={project._id}
                                            className="flex cursor-pointer items-center gap-2"
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-5 w-5 items-center justify-center rounded-sm text-xs",
                                                    colorClasses.split(" ").slice(1).join(" ")
                                                )}
                                            >
                                                {project.icon || DEFAULT_PROJECT_ICON}
                                            </div>
                                            <span>{project.name}</span>
                                        </Label>
                                    </div>
                                )
                            })}
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowMoveDialog(false)}
                            disabled={isMoving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMove}
                            disabled={
                                isMoving || selectedProjectId === (thread.projectId || "no-folder")
                            }
                        >
                            {isMoving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Moving...
                                </>
                            ) : (
                                "Move"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
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

function FolderItem({ project, threads }: { project: Project; threads: Thread[] }) {
    const { expandedFolderId, setExpandedFolder } = useProjectStore()
    const isExpanded = expandedFolderId === project._id
    const colorClasses = getProjectColorClasses(project.color as any)

    const handleToggleExpansion = () => {
        if (isExpanded) {
            // If this folder is expanded, collapse it
            setExpandedFolder(null)
        } else {
            // If this folder is not expanded, expand it and collapse any other
            setExpandedFolder(project._id)
        }
    }

    const sortedThreads = useMemo(() => {
        return threads.sort((a, b) => {
            // Pinned threads first
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            // Then by creation time (newest first)
            return b.createdAt - a.createdAt
        })
    }, [threads])

    return (
        <SidebarMenuItem>
            <Collapsible open={isExpanded} onOpenChange={handleToggleExpansion}>
                <div className="flex w-full items-center">
                    <CollapsibleTrigger className="group flex flex-1 items-center gap-2 rounded-sm p-2 hover:bg-accent/50">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            ) : (
                                <ChevronRight className="h-4 w-4 opacity-50" />
                            )}
                            <div
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-sm text-xs",
                                    colorClasses.split(" ").slice(1).join(" ")
                                )}
                            >
                                {project.icon || DEFAULT_PROJECT_ICON}
                            </div>
                            <Link
                                to="/folder/$folderId"
                                params={{ folderId: project._id }}
                                className="min-w-0 flex-1 text-left hover:underline"
                                onClick={(e) => {
                                    e.stopPropagation() // Prevent collapsible from toggling
                                    setExpandedFolder(project._id) // Expand when navigating to folder
                                }}
                            >
                                <span className="truncate font-medium">{project.name}</span>
                                <span className="ml-2 text-muted-foreground text-xs">
                                    ({threads.length})
                                </span>
                            </Link>
                        </div>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <div className="mt-1">
                        {sortedThreads.map((thread) => (
                            <ThreadItem key={thread._id} thread={thread} isInFolder={true} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    )
}

function NewFolderButton() {
    const [showDialog, setShowDialog] = useState(false)
    const [folderName, setFolderName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const createProjectMutation = useMutation(api.projects.createProject)

    const handleCreate = async () => {
        const trimmedName = folderName.trim()
        if (!trimmedName) {
            toast.error("Folder name cannot be empty")
            return
        }

        setIsCreating(true)
        try {
            const result = await createProjectMutation({
                name: trimmedName,
                icon: DEFAULT_PROJECT_ICON,
                color: "blue"
            })

            if (result && !("error" in result)) {
                toast.success("Folder created successfully")
                setFolderName("")
                setShowDialog(false)
            } else {
                toast.error("Failed to create folder")
            }
        } catch (error) {
            console.error("Failed to create folder:", error)
            toast.error("Failed to create folder")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <>
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => setShowDialog(true)}
                    className="text-muted-foreground"
                >
                    <FolderPlus className="h-4 w-4" />
                    <span>New folder</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                                id="folder-name"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="Enter folder name"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isCreating) {
                                        handleCreate()
                                    }
                                }}
                                disabled={isCreating}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowDialog(false)}
                                disabled={isCreating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating || !folderName.trim()}
                            >
                                {isCreating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
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
            key: "threads-sidebar-all",
            maxItems: 50
        },
        session?.user?.id ? {} : "skip",
        {
            initialNumItems: 50
        }
    )

    // Get projects
    const projects = useQuery(api.projects.getUserProjects) || []

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
    const threadsData = Array.isArray(allThreads) ? allThreads : []

    // Group threads by project and non-project
    const { projectThreads, nonProjectThreads } = useMemo(() => {
        const projectThreadsMap = new Map<Id<"projects">, Thread[]>()
        const nonProjectThreadsList: Thread[] = []

        threadsData.forEach((thread) => {
            if (thread.projectId) {
                if (!projectThreadsMap.has(thread.projectId)) {
                    projectThreadsMap.set(thread.projectId, [])
                }
                projectThreadsMap.get(thread.projectId)!.push(thread)
            } else {
                nonProjectThreadsList.push(thread)
            }
        })

        return {
            projectThreads: projectThreadsMap,
            nonProjectThreads: nonProjectThreadsList
        }
    }, [threadsData])

    const groupedNonProjectThreads = useMemo(() => {
        return groupThreadsByTime(nonProjectThreads)
    }, [nonProjectThreads])

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

        if (hasError) {
            return <></>
        }

        const hasProjects = projects.length > 0
        const hasNonProjectThreads = nonProjectThreads.length > 0

        if (!hasProjects && !hasNonProjectThreads) {
            return <EmptyState message="No threads found" />
        }

        return (
            <>
                {/* Folders Section */}
                {hasProjects && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Folders</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {projects.map((project) => {
                                    const threadsInProject = projectThreads.get(project._id) || []
                                    return (
                                        <FolderItem
                                            key={project._id}
                                            project={project}
                                            threads={threadsInProject}
                                        />
                                    )
                                })}
                                <NewFolderButton />
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

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
            <SidebarHeader className="mt-1 gap-3">
                <div className="flex items-center justify-between">
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
