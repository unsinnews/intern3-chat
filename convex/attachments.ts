// convex/attachments.ts
import { R2 } from "@convex-dev/r2"
import { v } from "convex/values"
import { components } from "./_generated/api"
import { action, httpAction, mutation, query } from "./_generated/server"

export const r2 = new R2(components.r2)

// HTTP action to generate upload URL
export const generateUploadUrl = httpAction(async (ctx, request) => {
    try {
        const { searchParams } = new URL(request.url)
        const fileName = searchParams.get("fileName")
        const fileType = searchParams.get("fileType")

        if (!fileName || !fileType) {
            return new Response(JSON.stringify({ error: "fileName and fileType are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Generate a unique key for the file
        const key = `attachments/${Date.now()}-${crypto.randomUUID()}-${fileName}`

        // For now, return a placeholder structure that matches what the frontend expects
        // You'll need to implement the actual R2 signed URL generation based on your R2 setup
        return new Response(
            JSON.stringify({
                uploadUrl: `https://your-r2-bucket.your-account.r2.cloudflarestorage.com/${key}`,
                key,
                fileName,
                fileType
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        )
    } catch (error) {
        console.error("Error generating upload URL:", error)
        return new Response(JSON.stringify({ error: "Failed to generate upload URL" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
})

// HTTP action to handle file upload completion
export const uploadComplete = httpAction(async (ctx, request) => {
    try {
        const body = await request.json()
        const { key, fileName, fileType, fileSize } = body

        if (!key || !fileName || !fileType) {
            return new Response(
                JSON.stringify({ error: "key, fileName, and fileType are required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        // Store file metadata in your database
        // You can add this to your existing schema or create a new table for attachments
        return new Response(
            JSON.stringify({
                success: true,
                attachment: {
                    key,
                    fileName,
                    fileType,
                    fileSize: fileSize || 0,
                    uploadedAt: Date.now()
                }
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        )
    } catch (error) {
        console.error("Error handling upload completion:", error)
        return new Response(JSON.stringify({ error: "Failed to process upload completion" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
})

// Action to store file from server side (for programmatic uploads)
export const storeFile = action({
    args: {
        fileUrl: v.string(),
        fileName: v.string(),
        fileType: v.string()
    },
    handler: async (ctx, args) => {
        try {
            // Download the file
            const response = await fetch(args.fileUrl)
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`)
            }

            const blob = await response.blob()
            const key = `attachments/${Date.now()}-${crypto.randomUUID()}-${args.fileName}`

            // Store in R2 - this is a placeholder for the actual R2 store implementation
            // await r2.store(ctx, blob, { key, type: args.fileType })

            return {
                key,
                fileName: args.fileName,
                fileType: args.fileType,
                size: blob.size
            }
        } catch (error) {
            console.error("Error storing file:", error)
            throw new Error("Failed to store file")
        }
    }
})

// Query to get file URL for serving
export const getFileUrl = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            // For now, construct URL directly - replace with actual R2 URL generation
            const url = `https://your-r2-bucket.your-account.r2.cloudflarestorage.com/${args.key}`
            return { url, key: args.key }
        } catch (error) {
            console.error("Error getting file URL:", error)
            return null
        }
    }
})

// Mutation to delete file
export const deleteFile = mutation({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            // Delete from R2 - placeholder implementation
            // await r2.delete(args.key)

            // Also delete from your database if you're storing metadata there

            return { success: true }
        } catch (error) {
            console.error("Error deleting file:", error)
            throw new Error("Failed to delete file")
        }
    }
})
