import { tool } from "ai"
import { z } from "zod"
import type { ConditionalToolParams } from "../toolkit"
import { SearchProvider } from "./adapters"

export const WebSearchTool = {
    id: "web_search" as const,
    build(params: ConditionalToolParams) {
        if (!params.enabledTools.includes("web_search")) return

        const { userSettings } = params

        return tool({
            description:
                "Search the web for information. Optionally scrape content from results for detailed information.",
            parameters: z.object({
                query: z.string().describe("The search query"),
                scrapeContent: z
                    .boolean()
                    .default(userSettings.searchIncludeSourcesByDefault)
                    .describe("Whether to scrape and include content from search results")
            }),
            execute: async ({ query, scrapeContent }) => {
                try {
                    const searchProvider = new SearchProvider({
                        provider: userSettings.searchProvider
                    })

                    const results = await searchProvider.search(query, {
                        limit: 5,
                        scrapeContent,
                        formats: scrapeContent ? ["markdown", "links"] : []
                    })

                    return {
                        success: true,
                        query,
                        results: results.map((result) => ({
                            title: result.title,
                            url: result.url,
                            description: result.description,
                            ...(result.content && { content: result.content }),
                            ...(result.markdown && { markdown: result.markdown })
                        })),
                        count: results.length
                    }
                } catch (error) {
                    console.error("Web search error:", error)
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Unknown error occurred",
                        query,
                        results: []
                    }
                }
            }
        })
    }
}
