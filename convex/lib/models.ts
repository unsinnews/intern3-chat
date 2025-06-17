import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { ProviderV1 } from "@ai-sdk/provider"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

import type { ModelAbility } from "../schema/settings"

export const CoreProviders = ["openai", "anthropic", "google"] as const
export type CoreProvider = (typeof CoreProviders)[number]
export type ModelDefinitionProviders =
    | CoreProvider // user BYOK key
    | `i3-${CoreProvider}` // internal API key
    | "openrouter"

export type RegistryKey = `${ModelDefinitionProviders | string}:${string}`
export type Provider = RegistryKey extends `${infer P}:${string}` ? P : never

export type SharedModel<Abilities extends ModelAbility[] = ModelAbility[]> = {
    id: string
    name: string
    adapters: RegistryKey[]
    abilities: Abilities
    mode?: "text" | "image"
    contextLength?: number
    maxTokens?: number
}

export const MODELS_SHARED: SharedModel[] = [
    {
        id: "gpt-4o",
        name: "GPT 4o",
        adapters: ["i3-openai:gpt-4o", "openai:gpt-4o", "openrouter:openai/gpt-4o"],
        abilities: ["vision", "function_calling"]
    },
    {
        id: "gpt-4o-mini",
        name: "GPT 4o mini",
        adapters: ["i3-openai:gpt-4o-mini", "openai:gpt-4o-mini", "openrouter:openai/gpt-4o-mini"],
        abilities: ["vision", "function_calling"]
    },
    {
        id: "o3-mini",
        name: "o3 mini",
        adapters: ["i3-openai:o3-mini", "openai:o3-mini", "openrouter:openai/o3-mini"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "o4-mini",
        name: "o4 mini",
        adapters: ["i3-openai:o4-mini", "openai:o4-mini", "openrouter:openai/o4-mini"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "o3",
        name: "o3",
        adapters: ["openai:o3", "openrouter:openai/o3"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "o3-pro",
        name: "o3 pro",
        adapters: ["openai:o3-pro", "openrouter:openai/o3-pro"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "gpt-4.1",
        name: "GPT 4.1",
        adapters: ["i3-openai:gpt-4.1", "openai:gpt-4.1", "openrouter:openai/gpt-4.1"],
        abilities: ["vision", "function_calling"]
    },
    {
        id: "gpt-4.1-mini",
        name: "GPT 4.1 mini",
        adapters: [
            "i3-openai:gpt-4.1-mini",
            "openai:gpt-4.1-mini",
            "openrouter:openai/gpt-4.1-mini"
        ],
        abilities: ["vision", "function_calling"]
    },
    {
        id: "gpt-4.1-nano",
        name: "GPT 4.1 nano",
        adapters: [
            "i3-openai:gpt-4.1-nano",
            "openai:gpt-4.1-nano",
            "openrouter:openai/gpt-4.1-nano"
        ],
        abilities: ["vision", "function_calling"]
    },
    {
        id: "claude-opus-4",
        name: "Claude Opus 4",
        adapters: ["anthropic:claude-opus-4-0", "openrouter:anthropic/claude-opus-4"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "claude-sonnet-4",
        name: "Claude Sonnet 4",
        adapters: ["anthropic:claude-sonnet-4-0", "openrouter:anthropic/claude-sonnet-4"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "claude-3-7-sonnet",
        name: "Claude Sonnet 3.7",
        adapters: ["anthropic:claude-3-7-sonnet", "openrouter:anthropic/claude-3.7-sonnet"],
        abilities: ["reasoning", "vision", "function_calling"]
    },
    {
        id: "claude-3-5-sonnet",
        name: "Claude Sonnet 3.5",
        adapters: ["anthropic:claude-3-5-sonnet", "openrouter:anthropic/claude-3.5-sonnet"],
        abilities: ["vision", "function_calling"]
    },
    {
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash Lite",
        adapters: [
            "i3-google:gemini-2.0-flash-lite",
            "google:gemini-2.0-flash-lite",
            "openrouter:google/gemini-2.0-flash-lite-001"
        ],
        abilities: ["function_calling"]
    },
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        adapters: [
            "i3-google:gemini-2.5-flash",
            "google:gemini-2.5-flash",
            "openrouter:google/gemini-2.5-flash-preview"
        ],
        abilities: ["function_calling", "reasoning"]
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        adapters: [
            "i3-google:gemini-2.0-flash",
            "google:gemini-2.0-flash",
            "openrouter:google/gemini-2.0-flash-001"
        ],
        abilities: ["function_calling", "vision"]
    },
    {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        adapters: [
            "google:gemini-2.5-pro-preview-06-05",
            "openrouter:google/gemini-2.5-pro-preview"
        ],
        abilities: ["reasoning", "vision", "function_calling"]
    }
] as const

export const createProvider = (
    providerId: CoreProvider | "openrouter",
    apiKey: string | "internal"
): Omit<ProviderV1, "textEmbeddingModel"> => {
    if (apiKey !== "internal" && (!apiKey || apiKey.trim() === "")) {
        throw new Error("API key is required for non-internal providers")
    }

    switch (providerId) {
        case "openai":
            return createOpenAI({
                apiKey: apiKey === "internal" ? process.env.OPENAI_API_KEY : apiKey,
                compatibility: "strict"
            })
        case "anthropic":
            return createAnthropic({
                apiKey: apiKey === "internal" ? process.env.ANTHROPIC_API_KEY : apiKey
            })
        case "google":
            return createGoogleGenerativeAI({
                apiKey: apiKey === "internal" ? process.env.GOOGLE_API_KEY : apiKey
            })
        case "openrouter":
            return createOpenRouter({
                apiKey
            })
        default: {
            const exhaustiveCheck: never = providerId
            throw new Error(`Unknown provider: ${exhaustiveCheck}`)
        }
    }
}
