import { ABILITIES } from "@/convex/lib/toolkit"
import { z } from "zod"

const AIConfigSchema = z.object({
    selectedModel: z.string().nullable(),
    enabledTools: z.array(z.enum(ABILITIES as [string, ...string[]])).default(["web_search"])
})

export type AIConfig = z.infer<typeof AIConfigSchema>

const AI_CONFIG_KEY = "ai-config"
const USER_INPUT_KEY = "user-input"

const safeRemoveItem = (key: string): void => {
    if (typeof window === "undefined") return
    try {
        localStorage.removeItem(key)
    } catch {}
}

export const loadAIConfig = (): AIConfig => {
    if (typeof window === "undefined") return { selectedModel: null, enabledTools: ["web_search"] }
    const stored = localStorage.getItem(AI_CONFIG_KEY)
    if (!stored) {
        return { selectedModel: null, enabledTools: ["web_search"] }
    }

    try {
        const parsed = JSON.parse(stored)

        // Validate enabled tools but let the UI handle invalid model IDs gracefully
        if (parsed.enabledTools.some((tool) => !ABILITIES.includes(tool))) {
            parsed.enabledTools = ["web_search"]
        }

        return AIConfigSchema.parse(parsed)
    } catch {
        safeRemoveItem(AI_CONFIG_KEY)
        return { selectedModel: null, enabledTools: ["web_search"] }
    }
}

export const loadUserInput = (): string => {
    if (typeof window === "undefined") return ""
    const stored = localStorage.getItem(USER_INPUT_KEY)
    return stored?.trim() ?? ""
}

export const saveAIConfig = (config: AIConfig): void => {
    if (typeof window === "undefined") return
    const validated = AIConfigSchema.parse(config)
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(validated))
}

export const saveUserInput = (input: string): void => {
    if (typeof window === "undefined") return
    if (input.trim()) localStorage.setItem(USER_INPUT_KEY, input)
    else localStorage.removeItem(USER_INPUT_KEY)
}
