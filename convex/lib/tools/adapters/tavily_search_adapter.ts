import { tavily } from "@tavily/core"
import type {
    SearchAdapter,
    SearchAdapterConfig,
    SearchOptions,
    SearchResult
} from "./search_adapter"

export interface TavilySearchConfig extends SearchAdapterConfig {
    apiKey: string
}

export class TavilySearchAdapter implements SearchAdapter {
    readonly name = "tavily"
    private client: ReturnType<typeof tavily>

    constructor(config: TavilySearchConfig) {
        this.client = tavily({ apiKey: config.apiKey })
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const { limit = 5, scrapeContent = false } = options

        try {
            // Use advanced search with chunks when scraping content, otherwise basic
            const searchDepth = scrapeContent ? "advanced" : "basic"
            const chunksPerSource = scrapeContent ? 8 : 3 // 5-10 chunks per source as requested

            const response = await this.client.search(query, {
                searchDepth,
                maxResults: Math.min(limit, 20), // Tavily max is 20
                chunksPerSource,
                includeRawContent: scrapeContent ? "markdown" : false,
                includeAnswer: false, // We don't need AI-generated answers
                topic: "general"
            })

            if (!response.results || response.results.length === 0) {
                return []
            }

            return response.results.map((result) => ({
                url: result.url,
                title: result.title,
                description: result.content || "",
                ...(result.rawContent && {
                    content: result.rawContent,
                    markdown: result.rawContent
                })
            }))
        } catch (error) {
            console.error("Tavily search error:", error)
            throw new Error(
                `Failed to search with Tavily: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }
}
