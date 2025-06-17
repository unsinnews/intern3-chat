import { ChatError } from "@/lib/errors"
import { type Infer, v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { type QueryCtx, internalQuery, mutation, query } from "./_generated/server"
import { decryptKey, encryptKey } from "./lib/encryption"
import { getUserIdentity } from "./lib/identity"
import { MODELS_SHARED, type RegistryKey, type SharedModel } from "./lib/models"
import type { UserSettings } from "./schema"
import { NonSensitiveUserSettings } from "./schema/settings"

const DefaultSettings = (userId: string) =>
    ({
        userId,
        searchProvider: "firecrawl",
        searchIncludeSourcesByDefault: false,
        coreAIProviders: {},
        customAIProviders: {},
        customModels: {},
        titleGenerationModel: "gemini-2.0-flash-lite",
        customThemes: []
    }) satisfies Infer<typeof UserSettings>

const getSettings = async (
    ctx: QueryCtx,
    userId: string
): Promise<Infer<typeof UserSettings> & { _id?: Id<"settings"> }> => {
    const settings = await ctx.db
        .query("settings")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .first()

    if (!settings) {
        return DefaultSettings(userId)
    }
    return settings
}
export const getUserSettingsInternal = internalQuery({
    args: {
        userId: v.string()
    },
    handler: async (ctx, args): Promise<Infer<typeof UserSettings>> => {
        return await getSettings(ctx, args.userId)
    }
})

export const getUserSettings = query({
    args: {},
    handler: async (ctx): Promise<Infer<typeof UserSettings>> => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) return DefaultSettings("id" in user ? (user.id ?? "") : "")
        return await getSettings(ctx, user.id)
    }
})

export const getUserRegistryInternal = internalQuery({
    args: {
        userId: v.string()
    },
    handler: async (ctx, args) => {
        const settings = await getSettings(ctx, args.userId)

        const providers: Record<string, { key: string; endpoint?: string; name?: string }> = {}
        for (const [providerId, provider] of Object.entries(settings.coreAIProviders)) {
            if (!provider.enabled) continue
            providers[providerId] = {
                key: await decryptKey(provider.encryptedKey),
                name: providerId
            }
        }

        for (const [providerId, provider] of Object.entries(settings.customAIProviders)) {
            if (!provider.enabled) continue
            providers[providerId] = {
                key: await decryptKey(provider.encryptedKey),
                endpoint: provider.endpoint,
                name: provider.name
            }
        }

        const models: Record<string, SharedModel & { customProviderId?: string }> = {}
        for (const model of MODELS_SHARED) {
            const available_adapters: RegistryKey[] = []
            for (const adapter of model.adapters) {
                const provider = adapter.split(":")[0]
                if (provider in providers || provider.startsWith("i3-")) {
                    available_adapters.push(adapter)
                }
            }
            models[model.id] = {
                id: model.id,
                name: model.name,
                adapters: available_adapters,
                abilities: model.abilities
            }
        }

        for (const [modelId, model] of Object.entries(settings.customModels)) {
            if (!model.enabled) continue
            models[modelId] = {
                id: model.modelId,
                name: model.name ?? model.modelId,
                adapters: [`${model.providerId}:${model.modelId}`],
                abilities: model.abilities,
                contextLength: model.contextLength,
                maxTokens: model.maxTokens,
                customProviderId: model.providerId
            }
        }

        return { providers, models, settings }
    }
})

export const updateUserSettings = mutation({
    args: {
        userId: v.string(),
        baseSettings: NonSensitiveUserSettings,
        coreProviders: v.record(
            v.string(),
            v.object({
                enabled: v.boolean(),
                newKey: v.optional(v.string())
            })
        ),
        customProviders: v.record(
            v.string(),
            v.object({
                name: v.string(),
                enabled: v.boolean(),
                endpoint: v.string(),
                newKey: v.optional(v.string())
            })
        )
    },
    handler: async (ctx, args) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) throw new ChatError("unauthorized:chat")

        const settings = await getSettings(ctx, user.id)

        const newSettings: Infer<typeof UserSettings> = {
            ...settings,
            ...args.baseSettings,
            coreAIProviders: {},
            customAIProviders: {}
        }

        for (const [providerId, provider] of Object.entries(args.coreProviders)) {
            if (!["openai", "anthropic", "google", "openrouter"].includes(providerId)) {
                console.error("Invalid core provider ID", providerId)
                throw new ChatError("bad_request:api", "Invalid core provider ID")
            }
            newSettings.coreAIProviders[providerId] = {
                enabled: provider.enabled,
                encryptedKey: provider.newKey
                    ? await encryptKey(provider.newKey)
                    : settings.coreAIProviders[providerId].encryptedKey
            }
        }

        for (const [providerId, provider] of Object.entries(args.customProviders)) {
            newSettings.customAIProviders[providerId] = {
                enabled: provider.enabled,
                endpoint: provider.endpoint,
                name: provider.name,
                encryptedKey: provider.newKey
                    ? await encryptKey(provider.newKey)
                    : settings.customAIProviders[providerId].encryptedKey
            }
        }

        if (settings._id) {
            await ctx.db.patch(settings._id, newSettings)
        } else {
            await ctx.db.insert("settings", newSettings)
        }
    }
})

export const addUserTheme = mutation({
    args: {
        url: v.string()
    },
    handler: async (ctx, args) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) throw new Error("Unauthorized")
        const settings = await getSettings(ctx, user.id)
        const existingThemes = settings.customThemes ?? []

        if (existingThemes.includes(args.url)) return
        if (existingThemes.length >= 5) throw new Error("Maximum number of themes reached")

        const newSettings: Infer<typeof UserSettings> = {
            ...settings,
            customThemes: [...existingThemes, args.url]
        }

        if (settings._id) {
            await ctx.db.patch(settings._id, newSettings)
        } else {
            await ctx.db.insert("settings", newSettings)
        }
    }
})

export const deleteUserTheme = mutation({
    args: {
        url: v.string()
    },
    handler: async (ctx, args) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) throw new Error("Unauthorized")
        const settings = await getSettings(ctx, user.id)

        const existingThemes = settings.customThemes ?? []
        const updatedThemes = existingThemes.filter((t) => t !== args.url)

        const newSettings: Infer<typeof UserSettings> = {
            ...settings,
            customThemes: updatedThemes
        }

        if (settings._id) {
            await ctx.db.patch(settings._id, newSettings)
        } else {
            await ctx.db.insert("settings", newSettings)
        }
    }
})
