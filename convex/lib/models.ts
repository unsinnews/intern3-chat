import { z } from "zod";
import type { Provider } from "../schema/apikey";
import { openai } from "@ai-sdk/openai";
import { LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { ChatError } from "@/lib/errors";

export const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(["openai", "anthropic", "google"]),
});

export type Model = {
  id: string;
  name: string;
  provider: Provider;
};

export const getAllModels = (): Model[] => {
  return [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT 4o mini",
      provider: "openai",
    },
    {
      id: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      provider: "google",
    },
    {
      id: "gemini-2.5-flash-preview-05-20",
      name: "Gemini 2.5 Flash",
      provider: "google",
    },
  ] as const;
};

export function getProviderFromModelId(modelId: string): Provider | null {
  const providerMap: Record<string, Provider> = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "claude-3-5-sonnet": "anthropic",
    "gemini-2.0-flash-lite": "google",
    "gemini-2.5-flash-preview-05-20": "google",
  };

  if (modelId in providerMap) {
    return providerMap[modelId as keyof typeof providerMap] as Provider;
  }

  return null;
}

export function createLanguageModel(
  modelId: string,
  provider: Provider,
  apiKey?: string | null
): LanguageModelV1 | ChatError {
  // validate modelId
  const model = getAllModels().find((model) => model.id === modelId);
  if (!model) {
    return new ChatError("bad_request:api", "Unsupported model");
  }

  switch (provider) {
    case "openai":
      if (apiKey) {
        const openaiInstance = createOpenAI({ apiKey });
        return openaiInstance(model.id);
      }
      return openai(model.id);

    case "anthropic":
      if (apiKey) {
        const anthropicInstance = createAnthropic({ apiKey });
        return anthropicInstance(model.id);
      }
      return anthropic(model.id);

    case "google":
      if (apiKey) {
        const googleInstance = createGoogleGenerativeAI({ apiKey });
        return googleInstance(model.id);
      }
      return google(model.id);

    default:
      return new ChatError("bad_request:api", "Unsupported provider");
  }
}
