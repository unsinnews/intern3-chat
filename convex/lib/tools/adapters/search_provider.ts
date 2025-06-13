import type { SearchAdapter, SearchResult, SearchOptions } from "./search_adapter"
import { FirecrawlSearchAdapter, type FirecrawlSearchConfig } from "./firecrawl_search_adapter"
import { BraveSearchAdapter, type BraveSearchConfig } from "./brave_search_adapter"

export type SearchProviderType = "firecrawl" | "brave"

export interface SearchProviderConfig {
    provider: SearchProviderType
    config?: Partial<FirecrawlSearchConfig | BraveSearchConfig>
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
            default:
                throw new Error(`Unsupported search provider: ${provider}`)
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        return await this.adapter.search(query, options)
    }
}
