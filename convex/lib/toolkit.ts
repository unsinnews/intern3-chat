import { Schema, Tool, tool } from "ai";
import { GenericActionCtx } from "convex/server"
import { z } from "zod";
import { WebSearchTool } from "./tools/web_search";

export const TOOL_ADAPTERS = [WebSearchTool]
export type ToolId = (typeof TOOL_ADAPTERS)[number]["id"]

export type ConditionalToolParams = {
    ctx: GenericActionCtx<any>
}

export const getToolkit = (ctx: GenericActionCtx<any>, enabledTools: ToolId[]) => {
    const tools = TOOL_ADAPTERS
        .filter(adapter => enabledTools.includes(adapter.id))
        .map(adapter => [adapter.id, adapter.build({ ctx })])
        .filter(([_, tool]) => tool !== undefined);
    return Object.fromEntries(tools) as Record<ToolId, Tool>
}