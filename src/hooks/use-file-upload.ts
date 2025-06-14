import { useCallback, useState } from "react"

export interface FileUploadResult {
    key: string
    fileName: string
    fileType: string
    url?: string
}

export interface UseFileUploadReturn {
    uploadFile: (file: File) => Promise<FileUploadResult>
    uploading: boolean
    progress: number
    error: string | null
    resetError: () => void
}

export function useFileUpload(): UseFileUploadReturn {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const resetError = useCallback(() => {
        setError(null)
    }, [])

    const uploadFile = useCallback(async (file: File): Promise<FileUploadResult> => {
        setUploading(true)
        setError(null)
        setProgress(0)

        try {
            // Get upload URL from our backend
            const uploadUrlResponse = await fetch(
                `/api/attachments/upload-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`
            )

            if (!uploadUrlResponse.ok) {
                throw new Error("Failed to get upload URL")
            }

            const uploadData = await uploadUrlResponse.json()

            if (uploadData.error) {
                throw new Error(uploadData.error)
            }

            const { uploadUrl, key, fileName, fileType } = uploadData

            // Create FormData for file upload
            const formData = new FormData()
            formData.append("file", file)

            // Upload file to R2 (this is a placeholder - you'll need to implement actual R2 upload)
            // For now, we'll simulate the upload
            setProgress(50)

            // Simulate upload progress
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setProgress(100)

            // Notify backend that upload is complete
            const completeResponse = await fetch("/api/attachments/upload-complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    key,
                    fileName,
                    fileType,
                    fileSize: file.size
                })
            })

            if (!completeResponse.ok) {
                throw new Error("Failed to complete upload")
            }

            const completeData = await completeResponse.json()

            if (completeData.error) {
                throw new Error(completeData.error)
            }

            return {
                key,
                fileName,
                fileType,
                url: uploadUrl // In a real implementation, this would be the accessible URL
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Upload failed"
            setError(errorMessage)
            throw new Error(errorMessage)
        } finally {
            setUploading(false)
            setProgress(0)
        }
    }, [])

    return {
        uploadFile,
        uploading,
        progress,
        error,
        resetError
    }
}

// Helper hook for multiple file uploads
export function useMultiFileUpload() {
    const [uploads, setUploads] = useState<Map<string, { progress: number; error?: string }>>(
        new Map()
    )

    const uploadFiles = useCallback(async (files: File[]): Promise<FileUploadResult[]> => {
        const results: FileUploadResult[] = []

        for (const file of files) {
            const fileId = `${file.name}-${file.size}-${file.lastModified}`

            try {
                setUploads((prev) => new Map(prev.set(fileId, { progress: 0 })))

                // Use the single file upload logic here
                const { uploadFile } = useFileUpload()
                const result = await uploadFile(file)

                results.push(result)
                setUploads((prev) => new Map(prev.set(fileId, { progress: 100 })))
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Upload failed"
                setUploads(
                    (prev) => new Map(prev.set(fileId, { progress: 0, error: errorMessage }))
                )
                throw error
            }
        }

        return results
    }, [])

    return {
        uploadFiles,
        uploads,
        clearUploads: () => setUploads(new Map())
    }
}
