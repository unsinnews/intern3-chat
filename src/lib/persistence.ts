import { z } from "zod"

// Zod schemas for validation
const AIConfigSchema = z.object({
  selectedModel: z.string().nullable(),
  enabledTools: z.array(z.string()).default(["web_search"])
})

const UserInputSchema = z.string().default("")

export type AIConfig = z.infer<typeof AIConfigSchema>
export type UserInput = z.infer<typeof UserInputSchema>

// Storage keys
const AI_CONFIG_KEY = "ai-config"
const USER_INPUT_KEY = "user-input"

// Safe localStorage operations with error handling
const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSetItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Silently fail - could be storage quota exceeded or incognito mode
  }
}

const safeRemoveItem = (key: string): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}

// AI Config persistence
export const loadAIConfig = (): AIConfig => {
  const stored = safeGetItem(AI_CONFIG_KEY)
  if (!stored) {
    return { selectedModel: null, enabledTools: ["web_search"] }
  }

  try {
    const parsed = JSON.parse(stored)
    return AIConfigSchema.parse(parsed)
  } catch {
    // Invalid data - remove and return defaults
    safeRemoveItem(AI_CONFIG_KEY)
    return { selectedModel: null, enabledTools: ["web_search"] }
  }
}

export const saveAIConfig = (config: AIConfig): void => {
  try {
    const validated = AIConfigSchema.parse(config)
    safeSetItem(AI_CONFIG_KEY, JSON.stringify(validated))
  } catch {
    // Invalid config - don't save
  }
}

// User Input persistence
export const loadUserInput = (): string => {
  const stored = safeGetItem(USER_INPUT_KEY)
  if (!stored) return ""

  try {
    return UserInputSchema.parse(stored)
  } catch {
    // Invalid data - remove and return default
    safeRemoveItem(USER_INPUT_KEY)
    return ""
  }
}

export const saveUserInput = (input: string): void => {
  try {
    const validated = UserInputSchema.parse(input)
    if (validated.trim()) {
      safeSetItem(USER_INPUT_KEY, validated)
    } else {
      // Clear empty input from storage
      safeRemoveItem(USER_INPUT_KEY)
    }
  } catch {
    // Invalid input - don't save
  }
}

export const clearUserInput = (): void => {
  safeRemoveItem(USER_INPUT_KEY)
}