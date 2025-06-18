import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { api } from "@/convex/_generated/api"
import { DEFAULT_PROJECT_ICON, PROJECT_COLORS, PROJECT_ICONS } from "@/lib/project-constants"
import { cn } from "@/lib/utils"
import { useMutation } from "convex/react"
import { FolderPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function NewFolderButton() {
    const [showDialog, setShowDialog] = useState(false)
    const [folderName, setFolderName] = useState("")
    const [folderDescription, setFolderDescription] = useState("")
    const [folderColor, setFolderColor] = useState<string>("blue")
    const [folderIcon, setFolderIcon] = useState("")
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
                description: folderDescription.trim() || undefined,
                icon: folderIcon || DEFAULT_PROJECT_ICON,
                color: folderColor
            })

            if (result && !("error" in result)) {
                toast.success("Folder created successfully")
                setFolderName("")
                setFolderDescription("")
                setFolderColor("blue")
                setFolderIcon("")
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
                <DialogContent className="max-w-md">
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

                        <div className="space-y-2">
                            <Label htmlFor="folder-description">Description (optional)</Label>
                            <Input
                                id="folder-description"
                                value={folderDescription}
                                onChange={(e) => setFolderDescription(e.target.value)}
                                placeholder="Enter folder description"
                                disabled={isCreating}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {PROJECT_COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => setFolderColor(color.id)}
                                        disabled={isCreating}
                                        className={cn(
                                            "flex h-8 w-full items-center justify-center rounded-md border-2 transition-all",
                                            color.class.split(" ").slice(1).join(" "),
                                            folderColor === color.id
                                                ? "scale-110 border-foreground"
                                                : "border-transparent hover:scale-105"
                                        )}
                                    >
                                        {/* Remove the letter display */}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="folder-icon">Icon (emoji)</Label>
                            <div className="space-y-3">
                                <Input
                                    id="folder-icon"
                                    value={folderIcon}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        // Limit to 3 characters to accommodate multi-character emojis
                                        if (value.length <= 3) {
                                            setFolderIcon(value)
                                        }
                                    }}
                                    placeholder="Enter an emoji or leave empty for default"
                                    disabled={isCreating}
                                    maxLength={3}
                                />
                                <div className="grid grid-cols-8 gap-1">
                                    {PROJECT_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFolderIcon(icon)}
                                            disabled={isCreating}
                                            className="flex h-8 w-8 items-center justify-center rounded border hover:bg-accent"
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDialog(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={isCreating || !folderName.trim()}>
                            {isCreating ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
