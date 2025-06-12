import { useEditorStore } from "./editor-store"

export const toggleThemeMode = () => {
    const themeState = useEditorStore.getState().themeState
    const newMode = themeState.currentMode === "light" ? "dark" : "light"

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    console.log("prefersReducedMotion", prefersReducedMotion)

    if (!document.startViewTransition || prefersReducedMotion) {
        useEditorStore.getState().setThemeState({
            ...themeState,
            currentMode: newMode
        })
        return
    }

    document.startViewTransition(() => {
        useEditorStore.getState().setThemeState({
            ...themeState,
            currentMode: newMode
        })
    })
}
