import { create } from "zustand"

type ThemeMode = "dark" | "light"

type ThemeState = {
    currentMode: ThemeMode
    cssVars: {
        theme: Record<string, string>
        light: Record<string, string>
        dark: Record<string, string>
    }
}

type EditorStore = {
    themeState: ThemeState
    setThemeState: (themeState: ThemeState) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
    themeState: {
        currentMode: "light",
        cssVars: {
            theme: {},
            light: {},
            dark: {}
        }
    },
    setThemeState: (themeState) => set({ themeState })
}))
