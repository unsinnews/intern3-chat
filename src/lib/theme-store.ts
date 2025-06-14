import { create } from "zustand"
import { persist } from "zustand/middleware"

export const THEME_STORE_KEY = "theme-store"

type ThemeMode = "dark" | "light"

type ThemeState = {
    currentMode: ThemeMode
    cssVars: {
        theme: Record<string, string>
        light: Record<string, string>
        dark: Record<string, string>
    }
}

type ThemeStore = {
    themeState: ThemeState
    setThemeState: (themeState: ThemeState) => void
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            themeState: {
                currentMode: "light",
                cssVars: {
                    theme: {},
                    light: {},
                    dark: {}
                }
            },
            setThemeState: (themeState) => set({ themeState })
        }),
        {
            name: THEME_STORE_KEY,
            partialize: (state) => ({ themeState: state.themeState })
        }
    )
)
