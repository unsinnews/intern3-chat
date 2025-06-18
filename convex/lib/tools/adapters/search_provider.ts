import { BraveSearchAdapter, type BraveSearchConfig } from "./brave_search_adapter"
import { FirecrawlSearchAdapter, type FirecrawlSearchConfig } from "./firecrawl_search_adapter"
import type { SearchAdapter, SearchOptions, SearchResult } from "./search_adapter"
import { SerperSearchAdapter, type SerperSearchConfig } from "./serper_search_adapter"
import { TavilySearchAdapter, type TavilySearchConfig } from "./tavily_search_adapter"

export type SearchProviderType = "firecrawl" | "brave" | "tavily" | "serper"

export interface SearchProviderConfig {
    provider: SearchProviderType
    config?: Partial<
        FirecrawlSearchConfig | BraveSearchConfig | TavilySearchConfig | SerperSearchConfig
    >
}

export class SearchProvider {
    private adapter: SearchAdapter

    constructor({ provider, config = {} }: SearchProviderConfig) {
        switch (provider) {
            case "firecrawl":
                if (!process.env.FIRECRAWL_API_KEY) {
                    throw new Error("FIRECRAWL_API_KEY environment variable is not set")
                }
                this.adapter = new FirecrawlSearchAdapter({
                    apiKey: process.env.FIRECRAWL_API_KEY!,
                    ...config
                } as FirecrawlSearchConfig)
                break
            case "brave":
                if (!process.env.BRAVE_API_KEY) {
                    throw new Error("BRAVE_API_KEY environment variable is not set")
                }
                this.adapter = new BraveSearchAdapter({
                    apiKey: process.env.BRAVE_API_KEY!,
                    ...config
                } as BraveSearchConfig)
                break
            case "tavily":
                if (!process.env.TAVILY_API_KEY) {
                    throw new Error("TAVILY_API_KEY environment variable is not set")
                }
                this.adapter = new TavilySearchAdapter({
                    apiKey: process.env.TAVILY_API_KEY!,
                    ...config
                } as TavilySearchConfig)
                break
            case "serper":
                if (!process.env.SERPER_API_KEY) {
                    throw new Error("SERPER_API_KEY environment variable is not set")
                }
                this.adapter = new SerperSearchAdapter({
                    apiKey: process.env.SERPER_API_KEY!,
                    ...config
                } as SerperSearchConfig)
                break
            default:
                throw new Error(`Unsupported search provider: ${provider}`)
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        return await this.adapter.search(query, options)
    }
}
