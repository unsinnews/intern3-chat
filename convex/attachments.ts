// convex/attachments.ts
import { R2 } from "@convex-dev/r2"
import { v } from "convex/values"
import { components } from "./_generated/api"
import { httpAction, mutation, query } from "./_generated/server"
import { getUserIdentity } from "./lib/identity"

export const r2 = new R2(components.r2)
// Direct file upload HTTP action for files under 5MB
export const uploadFile = httpAction(async (ctx, request) => {
    try {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            })
        }
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return new Response(
                JSON.stringify({
                    error: `File size exceeds 5MB limit. Current size: ${file.size} bytes`
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        // Generate unique key for the file
        const key = `attachments/${user.id}/${Date.now()}-${crypto.randomUUID()}-${file.name}`

        // Convert file to ArrayBuffer then to Uint8Array
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Store file directly in R2
        const storedKey = await r2.store(ctx, uint8Array, {
            key,
            type: file.type
        })

        return new Response(
            JSON.stringify({
                key: storedKey,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                uploadedAt: Date.now(),
                success: true
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        )
    } catch (error) {
        console.error("Error uploading file:", error)
        return new Response(
            JSON.stringify({
                error: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        )
    }
})

// Query to get file URL for serving
export const getFileUrl = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            const url = await r2.getUrl(args.key)
            return { url, key: args.key }
        } catch (error) {
            console.error("Error getting file URL:", error)
            return null
        }
    }
})

// Get file metadata
export const getFileMetadata = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        try {
            const metadata = await r2.getMetadata(ctx, args.key)
            return metadata
        } catch (error) {
            console.error("Error getting file metadata:", error)
            return null
        }
    }
})

// Mutation to delete file
export const deleteFile = mutation({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        // TODO: Implement file deletion once R2 delete method is confirmed
        console.log("Delete file requested for key:", args.key)
        return { success: false, error: "Delete functionality not yet implemented" }
    }
})

// List all files with pagination
export const listFiles = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        try {
            return await r2.listMetadata(ctx, args.limit || 50)
        } catch (error) {
            console.error("Error listing files:", error)
            return []
        }
    }
})

export const getFile = httpAction(async (ctx, req) => {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")
    if (!key) return new Response(null, { status: 400 })
    const file = await r2.getUrl(key)
    return Response.redirect(file)
})
