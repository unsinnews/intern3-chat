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
import { Button } from "@/components/ui/button"
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
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { DEFAULT_PROJECT_ICON, getProjectColorClasses } from "@/lib/project-constants"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Edit3, FolderOpen, Loader2, MoreHorizontal, Pin, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Thread } from "./types"

interface ThreadItemProps {
    thread: Thread
    isInFolder?: boolean
}

export function ThreadItem({ thread, isInFolder = false }: ThreadItemProps) {
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
    const moveThreadMutation = useMutation(api.folders.moveThreadToProject)
    const projects = useQuery(api.folders.getUserProjects) || []
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
