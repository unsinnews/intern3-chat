import { ChatError } from "@/lib/errors"
import { anthropic, createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI, google } from "@ai-sdk/google"
import { createOpenAI, openai } from "@ai-sdk/openai"
import { createProviderRegistry, customProvider } from "ai"
import type { LanguageModelV1 } from "ai"

type Registry = ReturnType<typeof createModelRegistry>
export type RegistryKey = Parameters<Registry["languageModel"]>[0]
export type Provider = RegistryKey extends `${infer P}:${string}` ? P : never
type Ability = "reasoning" | "vision" | "web_search"

export type SharedModel = {
    name: string
    id: RegistryKey
    abilities: Ability[]
}

export const MODELS_SHARED: SharedModel[] = [
    {
        name: "GPT 4o",
        id: "openai:gpt-4o",
        abilities: ["vision", "web_search"]
    },
    {
        name: "GPT 4o mini",
        id: "openai:gpt-4o-mini",
        abilities: ["vision", "web_search"]
    },
    {
        name: "o3 mini",
        id: "openai:o3-mini",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "o4 mini",
        id: "openai:o4-mini",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "o3",
        id: "openai:o3",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "o3 pro",
        id: "openai:o3-pro",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "GPT 4.1",
        id: "openai:gpt-4.1",
        abilities: ["vision", "web_search"]
    },
    {
        name: "GPT 4.1 mini",
        id: "openai:gpt-4.1-mini",
        abilities: ["vision", "web_search"]
    },
    {
        name: "GPT 4.1 nano",
        id: "openai:gpt-4.1-nano",
        abilities: ["vision", "web_search"]
    },
    {
        name: "Claude Opus 4",
        id: "anthropic:claude-opus-4-0",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "Claude Sonnet 4",
        id: "anthropic:claude-sonnet-4-0",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "Claude Sonnet 3.7",
        id: "anthropic:claude-3-7-sonnet",
        abilities: ["reasoning", "vision", "web_search"]
    },
    {
        name: "Claude Sonnet 3.5",
        id: "anthropic:claude-3-5-sonnet",
        abilities: ["vision", "web_search"]
    },
    {
        name: "Gemini 2.0 Flash Lite",
        id: "google:gemini-2.0-flash-lite",
        abilities: ["web_search"]
    },
    {
        name: "Gemini 2.5 Flash",
        id: "google:gemini-2.5-flash",
        abilities: ["web_search", "reasoning"]
    },
    {
        name: "Gemini 2.0 Flash",
        id: "google:gemini-2.0-flash",
        abilities: ["web_search", "vision"]
    },
    {
        name: "Gemini 2.5 Pro",
        id: "google:gemini-2.5-pro",
        abilities: ["reasoning", "vision", "web_search"]
    }
] as const

const createOpenAIProvider = (apiKey?: string | null) => {
    const openaiInstance = apiKey ? createOpenAI({ apiKey }) : openai

    return customProvider({
        languageModels: {
            "gpt-4o": openaiInstance("gpt-4o"),
            "gpt-4o-mini": openaiInstance("gpt-4o-mini"),
            "o3-mini": openaiInstance("o3-mini"),
            o3: openaiInstance("o3"),
            "o3-pro": openaiInstance("o3-pro"),
            "o4-mini": openaiInstance("o4-mini"),
            "gpt-4.1": openaiInstance("gpt-4.1"),
            "gpt-4.1-mini": openaiInstance("gpt-4.1-mini"),
            "gpt-4.1-nano": openaiInstance("gpt-4.1-nano")
        },
        fallbackProvider: openaiInstance
    })
}

const createAnthropicProvider = (apiKey?: string | null) => {
    const anthropicInstance = apiKey ? createAnthropic({ apiKey }) : anthropic

    return customProvider({
        languageModels: {
            "claude-3-5-sonnet": anthropicInstance("claude-3-5-sonnet-latest"),
            "claude-opus-4-0": anthropicInstance("claude-opus-4-0"),
            "claude-sonnet-4-0": anthropicInstance("claude-sonnet-4-0"),
            "claude-3-7-sonnet": anthropicInstance("claude-3-7-sonnet-latest")
        },
        fallbackProvider: anthropicInstance
    })
}

const createGoogleProvider = (apiKey?: string | null) => {
    const googleInstance = apiKey ? createGoogleGenerativeAI({ apiKey }) : google

    return customProvider({
        languageModels: {
            "gemini-2.0-flash-lite": googleInstance("gemini-2.0-flash-lite"),
            "gemini-2.5-flash": googleInstance("gemini-2.5-flash-preview-05-20"),
            "gemini-2.0-flash": googleInstance("gemini-2.0-flash"),
            "gemini-2.5-pro": googleInstance("gemini-2.5-pro-preview-06-05")
        },
        fallbackProvider: googleInstance
    })
}

function createModelRegistry(apiKeys: APIKeyConfig = {}) {
    return createProviderRegistry({
        openai: createOpenAIProvider(apiKeys.openai),
        anthropic: createAnthropicProvider(apiKeys.anthropic),
        google: createGoogleProvider(apiKeys.google)
    })
}

export interface APIKeyConfig {
    openai?: string | null
    anthropic?: string | null
    google?: string | null
}

export function getLanguageModel(
    registryKey: RegistryKey,
    apiKeys: APIKeyConfig = {}
): LanguageModelV1 | ChatError {
    const model = MODELS_SHARED.find((model) => model.id === registryKey)
    if (!model) {
        return new ChatError("bad_request:api", "Unsupported model")
    }

    const registry = createModelRegistry(apiKeys)

    try {
        return registry.languageModel(registryKey)
    } catch (error) {
        return new ChatError("bad_request:api", "Failed to create language model")
    }
}
