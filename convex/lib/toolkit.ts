import type { Tool } from "ai"
import type { GenericActionCtx } from "convex/server"
import { WebSearchTool } from "./tools/web_search"
import type { DataModel } from "../_generated/dataModel"

export const TOOL_ADAPTERS = [WebSearchTool]
export const ABILITIES = ["web_search"]
export type AbilityId = (typeof ABILITIES)[number]

export type ConditionalToolParams = {
    ctx: GenericActionCtx<DataModel>
    enabledTools: AbilityId[]
}

export const getToolkit = (ctx: GenericActionCtx<DataModel>, enabledTools: AbilityId[]) => {
    const tools = TOOL_ADAPTERS.map((adapter) => [
        adapter.id,
        adapter.build({ ctx, enabledTools })
    ]).filter(([_, tool]) => tool !== undefined)
    return Object.fromEntries(tools) as Record<string, Tool>
}
