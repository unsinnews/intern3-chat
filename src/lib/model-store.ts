import type { AbilityId } from "@/convex/lib/toolkit"
import { type AIConfig, loadAIConfig, saveAIConfig } from "@/lib/persistence"
import { create } from "zustand"

export type ModelStore = {
    selectedModel: string | null
    setSelectedModel: (model: string | null) => void

    enabledTools: AbilityId[]
    setEnabledTools: (tools: AbilityId[]) => void
}

const initialConfig = loadAIConfig()

const persistConfig = (selectedModel: string | null, enabledTools: AbilityId[]) => {
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
