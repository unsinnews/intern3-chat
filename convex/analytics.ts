import { v } from "convex/values"
import { query } from "./_generated/server"
import { getUserIdentity } from "./lib/identity"
import { MODELS_SHARED } from "./lib/models"

const getDaysSinceEpoch = (daysAgo: number) =>
    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) - daysAgo

export const getMyUsageStats = query({
    args: {
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"))
    },
    handler: async (ctx, { timeframe }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) throw new Error("Unauthorized")

        const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30
        const startDay = getDaysSinceEpoch(days)

        // Get user's events in time range - super efficient with the index
        const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", user.id).gte("daysSinceEpoch", startDay))
            .collect()

        // Post-filter by model and aggregate
        const modelStats = MODELS_SHARED.map((model) => {
            const modelEvents = events.filter((e) => e.modelId === model.id)
            return {
                modelId: model.id,
                modelName: model.name,
                requests: modelEvents.length,
                promptTokens: modelEvents.reduce((sum, e) => sum + e.promptTokens, 0),
                completionTokens: modelEvents.reduce((sum, e) => sum + e.completionTokens, 0),
                reasoningTokens: modelEvents.reduce((sum, e) => sum + e.reasoningTokens, 0),
                totalTokens: modelEvents.reduce(
                    (sum, e) => sum + e.promptTokens + e.completionTokens + e.reasoningTokens,
                    0
                )
            }
        }).filter((stat) => stat.requests > 0)

        const totalRequests = events.length
        const totalTokens = events.reduce(
            (sum, e) => sum + e.promptTokens + e.completionTokens + e.reasoningTokens,
            0
        )

        return {
            modelStats,
            timeframe,
            totalRequests,
            totalTokens
        }
    }
})

export const getMyUsageChartData = query({
    args: {
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"))
    },
    handler: async (ctx, { timeframe }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) throw new Error("Unauthorized")

        const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30
        const startDay = getDaysSinceEpoch(days)

        // Get user's events in time range
        const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", user.id).gte("daysSinceEpoch", startDay))
            .collect()

        // Group by day
        const chartData = []
        for (let i = days - 1; i >= 0; i--) {
            const daysSince = getDaysSinceEpoch(i)
            const dayEvents = events.filter((e) => e.daysSinceEpoch === daysSince)

            const dayData = {
                daysSinceEpoch: daysSince,
                date: new Date(daysSince * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                totalRequests: dayEvents.length,
                totalTokens: dayEvents.reduce(
                    (sum, e) => sum + e.promptTokens + e.completionTokens + e.reasoningTokens,
                    0
                ),
                models: {}
            }

            // Post-filter by model for this day
            MODELS_SHARED.forEach((model) => {
                const modelEvents = dayEvents.filter((e) => e.modelId === model.id)
                if (modelEvents.length > 0) {
                    dayData.models[model.id] = {
                        requests: modelEvents.length,
                        tokens: modelEvents.reduce(
                            (sum, e) =>
                                sum + e.promptTokens + e.completionTokens + e.reasoningTokens,
                            0
                        ),
                        promptTokens: modelEvents.reduce((sum, e) => sum + e.promptTokens, 0),
                        completionTokens: modelEvents.reduce(
                            (sum, e) => sum + e.completionTokens,
                            0
                        ),
                        reasoningTokens: modelEvents.reduce((sum, e) => sum + e.reasoningTokens, 0)
                    }
                }
            })

            chartData.push(dayData)
        }

        return chartData
    }
})

export const getMyModelUsage = query({
    args: {
        modelId: v.string(),
        timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"))
    },
    handler: async (ctx, { modelId, timeframe }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) throw new Error("Unauthorized")

        const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30
        const startDay = getDaysSinceEpoch(days)

        // Get user's events, then filter by model
        const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", user.id).gte("daysSinceEpoch", startDay))
            .filter((q) => q.eq(q.field("modelId"), modelId))
            .collect()

        return {
            modelId,
            requests: events.length,
            promptTokens: events.reduce((sum, e) => sum + e.promptTokens, 0),
            completionTokens: events.reduce((sum, e) => sum + e.completionTokens, 0),
            reasoningTokens: events.reduce((sum, e) => sum + e.reasoningTokens, 0),
            totalTokens: events.reduce(
                (sum, e) => sum + e.promptTokens + e.completionTokens + e.reasoningTokens,
                0
            ),
            timeframe
        }
    }
})
