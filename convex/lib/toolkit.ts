import type { Tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import type { Infer } from "convex/values"
import type { DataModel } from "../_generated/dataModel"
import type { UserSettings } from "../schema/settings"
import { WebSearchTool } from "./tools/web_search"

export const TOOL_ADAPTERS = [WebSearchTool]
export const ABILITIES = ["web_search"]
export type AbilityId = (typeof ABILITIES)[number]

export type ConditionalToolParams = {
    ctx: GenericActionCtx<DataModel>
    enabledTools: AbilityId[]
    userSettings: Infer<typeof UserSettings>
}

export const getToolkit = (
    ctx: GenericActionCtx<DataModel>,
    enabledTools: AbilityId[],
    userSettings: Infer<typeof UserSettings>
) => {
    const tools = TOOL_ADAPTERS.map((adapter) => [
        adapter.id,
        adapter.build({ ctx, enabledTools, userSettings })
    ]).filter(([_, tool]) => tool !== undefined)
    return Object.fromEntries(tools) as Record<string, Tool>
}
