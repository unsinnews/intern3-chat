import { create } from "zustand"
import { loadAIConfig, saveAIConfig, type AIConfig } from "@/lib/persistence"

export type ModelStore = {
    selectedModel: string | null
    enabledTools: string[]
    setSelectedModel: (model: string | null) => void
    setEnabledTools: (tools: string[]) => void
}

// Load initial state from localStorage
const initialConfig = loadAIConfig()

// Helper function to persist config efficiently
const persistConfig = (selectedModel: string | null, enabledTools: string[]) => {
    const config: AIConfig = { selectedModel, enabledTools }
    saveAIConfig(config)
}

export const useModelStore = create<ModelStore>((set, get) => ({
    selectedModel: initialConfig.selectedModel,
    enabledTools: initialConfig.enabledTools,
    
    setSelectedModel: (model) => {
        const currentState = get()
        // Only update and persist if the value actually changed
        if (currentState.selectedModel !== model) {
            set({ selectedModel: model })
            persistConfig(model, currentState.enabledTools)
        }
    },
    
    setEnabledTools: (tools) => {
        const currentState = get()
        // Only update and persist if the tools array actually changed
        const hasChanged = tools.length !== currentState.enabledTools.length ||
            tools.some((tool, index) => tool !== currentState.enabledTools[index])
        
        if (hasChanged) {
            set({ enabledTools: tools })
            persistConfig(currentState.selectedModel, tools)
        }
    }
}))
