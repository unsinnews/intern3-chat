import { create } from "zustand"
import { loadAIConfig, saveAIConfig, type AIConfig } from "@/lib/persistence"
import type { Model, MODELS_SHARED } from "@/convex/lib/models"
import type { AbilityId } from "@/convex/lib/toolkit"

export type ModelStore = {
    selectedModel: Model["id"] | null
    setSelectedModel: (model: Model["id"] | null) => void

    enabledTools: AbilityId[]
    setEnabledTools: (tools: AbilityId[]) => void
}

const initialConfig = loadAIConfig()

const persistConfig = (selectedModel: Model["id"] | null, enabledTools: AbilityId[]) => {
    const config: AIConfig = { selectedModel, enabledTools }
    saveAIConfig(config)
}

export const useModelStore = create<ModelStore>((set, get) => ({
    selectedModel: initialConfig.selectedModel,
    enabledTools: initialConfig.enabledTools,

    setSelectedModel: (model) => {
        const currentState = get()
        if (currentState.selectedModel !== model) {
            set({ selectedModel: model })
            persistConfig(model, currentState.enabledTools)
        }
    },

    setEnabledTools: (tools) => {
        const currentState = get()
        const hasChanged =
            tools.length !== currentState.enabledTools.length ||
            tools.some((tool, index) => tool !== currentState.enabledTools[index])

        if (hasChanged) {
            set({ enabledTools: tools })
            persistConfig(currentState.selectedModel, tools)
        }
    }
}))
