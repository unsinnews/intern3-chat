import { ChatError } from "@/lib/errors"
import { anthropic, createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI, google } from "@ai-sdk/google"
import { openai, createOpenAI } from "@ai-sdk/openai"
import { customProvider, createProviderRegistry } from "ai"
import type { LanguageModelV1 } from "ai"

type Registry = ReturnType<typeof createModelRegistry>
type RegistryKey = Parameters<Registry["languageModel"]>[0]

export type SharedModel = {
    name: string
    id: RegistryKey
}

export const MODELS_SHARED = [
    {
        name: "GPT-4o",
        id: "openai:gpt-4o"
    },
    {
        name: "GPT 4o mini",
        id: "openai:gpt-4o-mini"
    },
    {
        name: "o3 mini",
        id: "openai:o3-mini"
    },
    {
        name: "Claude 3.5 Sonnet",
        id: "anthropic:claude-3-5-sonnet"
    },
    {
        name: "Gemini 2.0 Flash Lite",
        id: "google:gemini-2.0-flash-lite"
    },
    {
        name: "Gemini 2.5 Flash",
        id: "google:gemini-2.5-flash"
    }
] as const

const createOpenAIProvider = (apiKey?: string | null) => {
    const openaiInstance = apiKey ? createOpenAI({ apiKey }) : openai

    return customProvider({
        languageModels: {
            "gpt-4o": openaiInstance("gpt-4o"),
            "gpt-4o-mini": openaiInstance("gpt-4o-mini"),
            "o3-mini": openaiInstance("o3-mini")
        },
        fallbackProvider: openaiInstance
    })
}

const createAnthropicProvider = (apiKey?: string | null) => {
    const anthropicInstance = apiKey ? createAnthropic({ apiKey }) : anthropic

    return customProvider({
        languageModels: {
            "claude-3-5-sonnet": anthropicInstance("claude-3-5-sonnet")
        },
        fallbackProvider: anthropicInstance
    })
}

const createGoogleProvider = (apiKey?: string | null) => {
    const googleInstance = apiKey ? createGoogleGenerativeAI({ apiKey }) : google

    return customProvider({
        languageModels: {
            "gemini-2.0-flash-lite": googleInstance("gemini-2.0-flash-lite"),
            "gemini-2.5-flash": googleInstance("gemini-2.5-flash-preview-05-20")
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
