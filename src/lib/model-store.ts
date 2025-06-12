import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModelStore = {
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
};

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      selectedModel: null,
      setSelectedModel: (model) => set({ selectedModel: model }),
    }),
    {
      name: "model-store",
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);
