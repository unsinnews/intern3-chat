import { v } from "convex/values"
import { internalQuery, mutation, query } from "./_generated/server"
import { decryptKey, encryptKey } from "./lib/encryption"
import { getUserIdentity } from "./lib/identity"
import { providerSchema } from "./schema/apikey"

export const storeApiKey = mutation({
    args: {
        provider: providerSchema,
        apiKey: v.string()
    },
    handler: async (ctx, args) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) {
            throw new Error("Unauthorized")
        }

        // Deactivate any existing keys for this provider
        const existingKeys = await ctx.db
            .query("apiKeys")
            .withIndex("byUserProvider", (q) =>
                q.eq("userId", user.id).eq("provider", args.provider)
            )
            .collect()

        for (const key of existingKeys) {
            await ctx.db.patch(key._id, { updatedAt: Date.now() })
        }

        // Encrypt the API key
        const encryptedKey = await encryptKey(args.apiKey)

        // Store the new key
        return await ctx.db.insert("apiKeys", {
            userId: user.id,
            provider: args.provider,
            encryptedKey,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })
    }
})

export const deleteApiKey = mutation({
    args: {
        keyId: v.id("apiKeys")
    },
    handler: async (ctx, args) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) {
            throw new Error("Unauthorized")
        }

        const apiKey = await ctx.db.get(args.keyId)
        if (!apiKey || apiKey.userId !== user.id) {
            throw new Error("API key not found or unauthorized")
        }

        await ctx.db.delete(args.keyId)
    }
})

export const getDecryptedApiKey = internalQuery({
    args: {
        userId: v.string(),
        provider: providerSchema
    },
    handler: async (ctx, args) => {
        const apiKey = await ctx.db
            .query("apiKeys")
            .withIndex("byUserProvider", (q) =>
                q.eq("userId", args.userId).eq("provider", args.provider)
            )
            .first()

        if (!apiKey) {
            return null
        }

        try {
            const decryptedKey = await decryptKey(apiKey.encryptedKey)
            return decryptedKey
        } catch (error) {
            console.error("Failed to decrypt API key:", error)
            return null
        }
    }
})

export const listApiKeys = query({
    handler: async (ctx) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) {
            return { error: user.error }
        }

        const apiKeys = await ctx.db
            .query("apiKeys")
            .withIndex("byUserProvider", (q) => q.eq("userId", user.id))

        if (!apiKeys) {
            return []
        }

        const keys = await apiKeys.collect()

        return keys.map((key) => {
            return {
                id: key._id,
                provider: key.provider,
                createdAt: key.createdAt
            }
        })
    }
})
