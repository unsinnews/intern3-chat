import { v } from "convex/values"

export const UsageEvent = v.object({
    userId: v.string(),
    modelId: v.string(), // "openai:gpt-4o"
    promptTokens: v.number(),
    completionTokens: v.number(),
    reasoningTokens: v.number(),
    daysSinceEpoch: v.number() // Math.floor(Date.now() / (24*60*60*1000))
})
