import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { type FileUploadResult, useFileUpload } from "@/hooks/use-file-upload"
import { cn } from "@/lib/utils"
import { File, FileText, Image, Music, Upload, Video, X } from "lucide-react"
import type React from "react"
import { useCallback, useRef, useState } from "react"

interface FileAttachmentProps {
    onFilesUploaded?: (files: FileUploadResult[]) => void
    maxFiles?: number
    maxFileSize?: number // in bytes
    acceptedFileTypes?: string[]
    className?: string
    multiple?: boolean
}

interface AttachedFile extends FileUploadResult {
    file: File
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image
    if (fileType.startsWith("video/")) return Video
    if (fileType.startsWith("audio/")) return Music
    if (fileType.includes("text") || fileType.includes("document")) return FileText
    return File
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function FileAttachment({
    onFilesUploaded,
    maxFiles = 5,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    acceptedFileTypes = [],
    className,
    multiple = true
}: FileAttachmentProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
    const { uploadFile, uploading, progress, error, resetError } = useFileUpload()

    const validateFile = useCallback(
        (file: File): string | null => {
            if (maxFileSize && file.size > maxFileSize) {
                return `File size exceeds ${formatFileSize(maxFileSize)}`
            }

            if (
                acceptedFileTypes.length > 0 &&
                !acceptedFileTypes.some(
                    (type) =>
                        file.type.match(type) ||
                        file.name.toLowerCase().endsWith(type.replace("*", ""))
                )
            ) {
                return `File type not supported. Accepted types: ${acceptedFileTypes.join(", ")}`
            }

            return null
        },
        [maxFileSize, acceptedFileTypes]
    )

    const handleFiles = useCallback(
        async (files: FileList) => {
            const fileArray = Array.from(files)

            if (!multiple && fileArray.length > 1) {
                alert("Only one file can be uploaded at a time")
                return
            }

            if (attachedFiles.length + fileArray.length > maxFiles) {
                alert(`Maximum ${maxFiles} files allowed`)
                return
            }

            const validFiles: File[] = []

            for (const file of fileArray) {
                const validationError = validateFile(file)
                if (validationError) {
                    alert(`${file.name}: ${validationError}`)
                    continue
                }
                validFiles.push(file)
            }

            if (validFiles.length === 0) return

            try {
                const uploadPromises = validFiles.map(async (file) => {
                    const result = await uploadFile(file)
                    return { ...result, file }
                })

                const uploadedFiles = await Promise.all(uploadPromises)

                setAttachedFiles((prev) => [...prev, ...uploadedFiles])
                onFilesUploaded?.(uploadedFiles)
            } catch (error) {
                console.error("Upload failed:", error)
            }
        },
        [uploadFile, attachedFiles.length, maxFiles, multiple, validateFile, onFilesUploaded]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files)
            }
        },
        [handleFiles]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
    }, [])

    const handleFileSelect = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleFileSelect()
            }
        },
        [handleFileSelect]
    )

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files)
            }
            // Reset input value to allow uploading the same file again
            e.target.value = ""
        },
        [handleFiles]
    )

    const removeFile = useCallback((index: number) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
    }, [])

    return (
        <div className={cn("space-y-4", className)}>
            {/* Drop Zone */}
            <button
                type="button"
                className={cn(
                    "w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                    dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50",
                    uploading && "pointer-events-none opacity-50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleFileSelect}
                onKeyDown={handleKeyDown}
                disabled={uploading}
                aria-label="Upload files"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={acceptedFileTypes.join(",")}
                    onChange={handleInputChange}
                    className="hidden"
                />

                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 font-medium text-lg">
                    {dragActive ? "Drop files here" : "Upload files"}
                </p>
                <p className="text-muted-foreground text-sm">
                    Drag and drop files here or click to browse
                </p>
                {maxFileSize && (
                    <p className="mt-1 text-muted-foreground text-xs">
                        Max file size: {formatFileSize(maxFileSize)}
                    </p>
                )}
            </button>

            {/* Upload Progress */}
            {uploading && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                    <p className="text-destructive text-sm">{error}</p>
                    <Button variant="outline" size="sm" onClick={resetError} className="mt-2">
                        Dismiss
                    </Button>
                </div>
            )}

            {/* Attached Files */}
            {attachedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Attached Files</h4>
                    <div className="space-y-2">
                        {attachedFiles.map((attachedFile, index) => {
                            const IconComponent = getFileIcon(attachedFile.fileType)
                            return (
                                <div
                                    key={`${attachedFile.key}-${index}`}
                                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                                >
                                    <div className="flex items-center space-x-3">
                                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-sm">
                                                {attachedFile.fileName}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {formatFileSize(attachedFile.file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
