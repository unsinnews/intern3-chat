import { tool } from "ai";
import { z } from "zod";
import { GenericActionCtx } from "convex/server";
import { ConditionalToolParams } from "../toolkit";

export const WebSearchTool = {
    id: "web_search" as const,
    build(params: ConditionalToolParams) {
        return tool({
            description: "Search the web for information",
            parameters: z.object({
                query: z.string(),
            }),
            execute: async ({ query }) => {
                return {
                    results: ["test"]
                }
            }
        })
    }
}

