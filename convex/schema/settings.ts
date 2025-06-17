import { type Infer, v } from "convex/values"
import { CoreProviders } from "../lib/models"

const CoreProvidersSchema = v.union(
    ...CoreProviders.map((p) => v.literal(p)),
    v.literal("openrouter")
)

export const CoreAIProvider = v.object({
    enabled: v.boolean(),
    encryptedKey: v.string()
})

export const CustomAIProvider = v.object({
    name: v.string(),
    enabled: v.boolean(),
    endpoint: v.string(),
    encryptedKey: v.string()
})

const ModelAbilitySchema = v.union(
    v.literal("reasoning"),
    v.literal("vision"),
    v.literal("function_calling")
)
export type ModelAbility = Infer<typeof ModelAbilitySchema>

export const CustomModel = v.object({
    enabled: v.boolean(),
    name: v.optional(v.string()),
    modelId: v.string(),
    providerId: v.union(CoreProvidersSchema, v.string()),
    contextLength: v.number(),
    maxTokens: v.number(),
    abilities: v.array(ModelAbilitySchema)
})

export const NonSensitiveUserSettings = v.object({
    userId: v.string(),
    searchProvider: v.union(v.literal("firecrawl"), v.literal("brave")),
    searchIncludeSourcesByDefault: v.boolean(),
    customModels: v.record(v.string(), CustomModel),
    titleGenerationModel: v.string(),
    customThemes: v.optional(v.array(v.string()))
})

export const UserSettings = v.object({
    userId: v.string(),
    searchProvider: v.union(v.literal("firecrawl"), v.literal("brave")),
    searchIncludeSourcesByDefault: v.boolean(),
    coreAIProviders: v.record(v.string(), CoreAIProvider),
    customAIProviders: v.record(v.string(), CustomAIProvider),
    customModels: v.record(v.string(), CustomModel),
    titleGenerationModel: v.string(),
    customThemes: v.optional(v.array(v.string()))
})
