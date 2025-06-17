import type { ImageSize } from "@/convex/lib/models"
import type { AbilityId } from "@/convex/lib/toolkit"
import { type AIConfig, loadAIConfig, saveAIConfig } from "@/lib/persistence"
import { create } from "zustand"

export type ModelStore = {
    selectedModel: string | null
    setSelectedModel: (model: string | null) => void

    enabledTools: AbilityId[]
    setEnabledTools: (tools: AbilityId[]) => void

    selectedImageSize: ImageSize
    setSelectedImageSize: (imageSize: ImageSize) => void
}

const initialConfig = loadAIConfig()

const persistConfig = (
    selectedModel: string | null,
    enabledTools: AbilityId[],
    selectedImageSize: ImageSize
) => {
    const config: AIConfig = { selectedModel, enabledTools, selectedImageSize }
    saveAIConfig(config)
}

export const useModelStore = create<ModelStore>((set, get) => ({
    selectedModel: initialConfig.selectedModel,
    enabledTools: initialConfig.enabledTools,
    selectedImageSize: initialConfig.selectedImageSize as ImageSize,

    setSelectedModel: (model) => {
        const currentState = get()
        if (currentState.selectedModel !== model) {
            set({ selectedModel: model })
            persistConfig(model, currentState.enabledTools, currentState.selectedImageSize)
        }
    },

    setEnabledTools: (tools) => {
        const currentState = get()
        const hasChanged =
            tools.length !== currentState.enabledTools.length ||
            tools.some((tool, index) => tool !== currentState.enabledTools[index])

        if (hasChanged) {
            set({ enabledTools: tools })
            persistConfig(currentState.selectedModel, tools, currentState.selectedImageSize)
        }
    },

    setSelectedImageSize: (imageSize) => {
        const currentState = get()
        if (currentState.selectedImageSize !== imageSize) {
            set({ selectedImageSize: imageSize })
            persistConfig(currentState.selectedModel, currentState.enabledTools, imageSize)
        }
    }
}))
