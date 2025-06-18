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

const DEFAULT_THEME = {
    themeState: {
        currentMode: "light",
        cssVars: {
            theme: {
                "font-sans": "Geist, sans-serif",
                "font-mono": "Geist Mono, monospace",
                "font-serif": "Georgia, serif",
                radius: "0.5rem",
                "tracking-tighter": "calc(var(--tracking-normal) - 0.05em)",
                "tracking-tight": "calc(var(--tracking-normal) - 0.025em)",
                "tracking-wide": "calc(var(--tracking-normal) + 0.025em)",
                "tracking-wider": "calc(var(--tracking-normal) + 0.05em)",
                "tracking-widest": "calc(var(--tracking-normal) + 0.1em)"
            },
            light: {
                background: "oklch(1.0000 0 0)",
                foreground: "oklch(0 0 0)",
                card: "oklch(1.0000 0 0)",
                "card-foreground": "oklch(0 0 0)",
                popover: "oklch(1.0000 0 0)",
                "popover-foreground": "oklch(0 0 0)",
                primary: "oklch(0.7845 0.1325 181.9120)",
                "primary-foreground": "oklch(0 0 0)",
                secondary: "oklch(0.9551 0 0)",
                "secondary-foreground": "oklch(0 0 0)",
                muted: "oklch(0.9702 0 0)",
                "muted-foreground": "oklch(0.5452 0 0)",
                accent: "oklch(0.9699 0.0425 187.4613)",
                "accent-foreground": "oklch(0 0 0)",
                destructive: "oklch(0.5925 0.2346 28.4694)",
                "destructive-foreground": "oklch(1.0000 0 0)",
                border: "oklch(0.9249 0 0)",
                input: "oklch(0.9551 0 0)",
                ring: "oklch(0.7845 0.1325 181.9120)",
                "chart-1": "oklch(0.7803 0.0811 195.6171)",
                "chart-2": "oklch(0.6744 0.0793 195.4355)",
                "chart-3": "oklch(0.6021 0.0583 195.7146)",
                "chart-4": "oklch(0.8005 0.0578 196.0574)",
                "chart-5": "oklch(0.7735 0.1040 195.2183)",
                radius: "0.5rem",
                sidebar: "oklch(1.0000 0 0)",
                "sidebar-foreground": "oklch(0 0 0)",
                "sidebar-primary": "oklch(0.7845 0.1325 181.9120)",
                "sidebar-primary-foreground": "oklch(0 0 0)",
                "sidebar-accent": "oklch(0.9551 0 0)",
                "sidebar-accent-foreground": "oklch(0 0 0)",
                "sidebar-border": "oklch(0.9249 0 0)",
                "sidebar-ring": "oklch(0.9049 0.0895 164.1501)",
                "font-sans": "Geist, sans-serif",
                "font-serif": "Georgia, serif",
                "font-mono": "Geist Mono, monospace",
                "shadow-color": "hsl(0 0% 0%)",
                "shadow-opacity": "0.18",
                "shadow-blur": "2px",
                "shadow-spread": "0px",
                "shadow-offset-x": "0px",
                "shadow-offset-y": "1px",
                "letter-spacing": "0em",
                spacing: "0.25rem",
                "shadow-2xs": "0px 1px 2px 0px hsl(0 0% 0% / 0.09)",
                "shadow-xs": "0px 1px 2px 0px hsl(0 0% 0% / 0.09)",
                "shadow-sm":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18)",
                shadow: "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18)",
                "shadow-md":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 2px 4px -1px hsl(0 0% 0% / 0.18)",
                "shadow-lg":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 4px 6px -1px hsl(0 0% 0% / 0.18)",
                "shadow-xl":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 8px 10px -1px hsl(0 0% 0% / 0.18)",
                "shadow-2xl": "0px 1px 2px 0px hsl(0 0% 0% / 0.45)",
                "tracking-normal": "0em"
            },
            dark: {
                background: "oklch(0 0 0)",
                foreground: "oklch(1.0000 0 0)",
                card: "oklch(0.1822 0 0)",
                "card-foreground": "oklch(1.0000 0 0)",
                popover: "oklch(0.2178 0 0)",
                "popover-foreground": "oklch(1.0000 0 0)",
                primary: "oklch(0.7845 0.1325 181.9120)",
                "primary-foreground": "oklch(0 0 0)",
                secondary: "oklch(0.2686 0 0)",
                "secondary-foreground": "oklch(1.0000 0 0)",
                muted: "oklch(0.3485 0 0)",
                "muted-foreground": "oklch(0.7826 0 0)",
                accent: "oklch(0.4409 0.0626 184.6359)",
                "accent-foreground": "oklch(1.0000 0 0)",
                destructive: "oklch(0.6324 0.2144 25.8414)",
                "destructive-foreground": "oklch(0 0 0)",
                border: "oklch(0.2686 0 0)",
                input: "oklch(0.3171 0 0)",
                ring: "oklch(0.9049 0.0895 164.1501)",
                "chart-1": "oklch(0.7803 0.0811 195.6171)",
                "chart-2": "oklch(0.6744 0.0793 195.4355)",
                "chart-3": "oklch(0.6021 0.0583 195.7146)",
                "chart-4": "oklch(0.5076 0.0469 195.7756)",
                "chart-5": "oklch(0.8005 0.0578 196.0574)",
                radius: "0.5rem",
                sidebar: "oklch(0.2178 0 0)",
                "sidebar-foreground": "oklch(1.0000 0 0)",
                "sidebar-primary": "oklch(0.7845 0.1325 181.9120)",
                "sidebar-primary-foreground": "oklch(0 0 0)",
                "sidebar-accent": "oklch(0.3171 0 0)",
                "sidebar-accent-foreground": "oklch(1.0000 0 0)",
                "sidebar-border": "oklch(0.3171 0 0)",
                "sidebar-ring": "oklch(0.9049 0.0895 164.1501)",
                "font-sans": "Geist, sans-serif",
                "font-serif": "Georgia, serif",
                "font-mono": "Geist Mono, monospace",
                "shadow-color": "hsl(0 0% 0%)",
                "shadow-opacity": "0.18",
                "shadow-blur": "2px",
                "shadow-spread": "0px",
                "shadow-offset-x": "0px",
                "shadow-offset-y": "1px",
                "letter-spacing": "0em",
                spacing: "0.25rem",
                "shadow-2xs": "0px 1px 2px 0px hsl(0 0% 0% / 0.09)",
                "shadow-xs": "0px 1px 2px 0px hsl(0 0% 0% / 0.09)",
                "shadow-sm":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18)",
                shadow: "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18)",
                "shadow-md":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 2px 4px -1px hsl(0 0% 0% / 0.18)",
                "shadow-lg":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 4px 6px -1px hsl(0 0% 0% / 0.18)",
                "shadow-xl":
                    "0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 8px 10px -1px hsl(0 0% 0% / 0.18)",
                "shadow-2xl": "0px 1px 2px 0px hsl(0 0% 0% / 0.45)"
            }
        }
    }
} as const

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            themeState: DEFAULT_THEME.themeState,
            setThemeState: (themeState) => set({ themeState })
        }),
        {
            name: THEME_STORE_KEY,
            partialize: (state) => ({ themeState: state.themeState })
        }
    )
)
