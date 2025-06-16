import { useThemeStore } from "@/lib/theme-store"
import { toggleThemeMode } from "@/lib/toggle-theme-mode"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
    CheckCircle,
    ExternalLinkIcon,
    LoaderIcon,
    MoonIcon,
    PaintBucketIcon,
    PlusIcon,
    Search,
    ShuffleIcon,
    SunIcon
} from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
    ResponsivePopover,
    ResponsivePopoverContent,
    ResponsivePopoverTrigger
} from "../ui/responsive-popover"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { ImportThemeDialog } from "./import-theme-dialog"

const THEME_URLS = [
    "https://tweakcn.com/editor/theme?theme=mono",
    "https://tweakcn.com/editor/theme?theme=t3-chat",
    "https://tweakcn.com/editor/theme?theme=perpetuity",
    "https://tweakcn.com/r/themes/vintage-paper.json",
    "https://tweakcn.com/r/themes/amethyst-haze.json",
    "https://tweakcn.com/r/themes/cmbpg28hj000404l7ferxfwgs",
    "https://tweakcn.com/editor/theme?theme=doom-64",
    "https://tweakcn.com/editor/theme?theme=notebook",
    "https://tweakcn.com/editor/theme?theme=pastel-dreams",
    "https://tweakcn.com/editor/theme?theme=quantum-rose",
    "https://tweakcn.com/editor/theme?theme=claymorphism",
    "https://tweakcn.com/editor/theme?theme=supabase",
    "https://tweakcn.com/editor/theme?theme=vercel"
]

type ThemePreset = {
    cssVars: {
        theme: Record<string, string>
        light: Record<string, string>
        dark: Record<string, string>
    }
}

type FetchedTheme = {
    name: string
    preset: ThemePreset
    url: string
    error?: string
}

function convertToThemePreset(externalTheme: any): ThemePreset {
    if (externalTheme.cssVars) {
        return {
            cssVars: {
                theme: externalTheme.cssVars.theme || {},
                light: externalTheme.cssVars.light || {},
                dark: externalTheme.cssVars.dark || {}
            }
        }
    }

    throw new Error("Unsupported theme format")
}

function getThemeName(themeData: any, url: string): string {
    if (themeData.name) {
        return themeData.name.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }

    return "Custom Theme"
}

async function fetchThemeFromUrl(url: string): Promise<FetchedTheme> {
    const baseUrl = "https://tweakcn.com/r/themes/"
    const isBuiltInUrl = url.includes("editor/theme?theme=")

    const transformedUrl =
        url
            .replace("https://tweakcn.com/editor/theme?theme=", baseUrl)
            .replace("https://tweakcn.com/themes/", baseUrl) + (isBuiltInUrl ? ".json" : "")

    try {
        const response = await fetch(transformedUrl)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const themeData = await response.json()
        const themePreset = convertToThemePreset(themeData)
        const themeName = getThemeName(themeData, url)

        return {
            name: themeName,
            preset: themePreset,
            url
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch theme"
        return {
            name: getThemeName({}, url),
            preset: { cssVars: { theme: {}, light: {}, dark: {} } },
            url,
            error: errorMessage
        }
    }
}

// Fetch all predefined themes
async function fetchAllThemes(): Promise<FetchedTheme[]> {
    if (THEME_URLS.length === 0) return []

    const fetchPromises = THEME_URLS.map(fetchThemeFromUrl)
    return Promise.all(fetchPromises)
}

// Helper function to extract key colors from theme
function extractThemeColors(preset: ThemePreset, mode: "light" | "dark"): string[] {
    const colors: string[] = []
    const { light, dark, theme } = preset.cssVars
    const modeVars = mode === "light" ? light : dark

    // Priority order for color extraction
    const colorKeys = [
        "foreground",
        "primary",
        "secondary",
        "accent",
        "background",
        "muted",
        "destructive",
        "border",
        "card",
        "popover"
    ]

    // Extract from current mode first, then fallback to theme
    const currentVars = { ...theme, ...modeVars }

    colorKeys.forEach((key) => {
        const colorValue = currentVars[key]
        if (colorValue && colors.length < 5) {
            // Convert HSL to hex if needed, or use as-is
            if (colorValue.includes("hsl")) {
                colors.push(`hsl(${colorValue})`)
            } else {
                colors.push(colorValue)
            }
        }
    })

    return colors.slice(0, 5)
}

export function ThemeSwitcher() {
    const { themeState, setThemeState } = useThemeStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedThemeUrl, setSelectedThemeUrl] = useState<string | null>(null)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

    const { data: fetchedThemes = [], isLoading: isLoadingThemes } = useQuery({
        queryKey: ["themes", "predefined"],
        queryFn: fetchAllThemes,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000 // 10 minutes
    })

    const applyThemePreset = (preset: ThemePreset) => {
        setThemeState({
            currentMode: themeState.currentMode,
            cssVars: preset.cssVars
        })
    }

    const handleThemeImported = (preset: ThemePreset, url: string) => {
        applyThemePreset(preset)
        setSelectedThemeUrl(url)
    }

    const handleThemeSelect = (theme: FetchedTheme) => {
        if ("error" in theme && theme.error) {
            return
        }

        if ("preset" in theme) {
            applyThemePreset(theme.preset)
            setSelectedThemeUrl(theme.url)
        }
    }

    const toggleMode = () => {
        toggleThemeMode()
    }

    const randomizeTheme = () => {
        const availableThemes = fetchedThemes.filter((theme) => !("error" in theme && theme.error))
        if (availableThemes.length > 0) {
            const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)]
            handleThemeSelect(randomTheme)
        }
    }

    const themes = fetchedThemes

    const filteredThemes = themes.filter((theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            <ImportThemeDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onThemeImported={handleThemeImported}
            />
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-md"
                    onClick={toggleMode}
                >
                    <SunIcon className="dark:-rotate-90 h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:scale-0" />
                    <MoonIcon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle mode</span>
                </Button>

                <ResponsivePopover modal={false}>
                    <ResponsivePopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="flex size-8 items-center rounded-md"
                        >
                            <PaintBucketIcon className="h-3.5 w-3.5" />
                        </Button>
                    </ResponsivePopoverTrigger>

                    <ResponsivePopoverContent
                        align="end"
                        className="w-full p-0 md:w-80"
                        title="Theme Selector"
                        description="Choose a theme for your interface"
                    >
                        {/* Note: Title and description are already in ResponsivePopoverContent */}
                        <Separator className="hidden md:block" />

                        {/* Search Input */}
                        <div className="hidden p-2 md:block">
                            <div className="relative">
                                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                                <Input
                                    placeholder="Search themes..."
                                    className="h-9 border-none pl-10 shadow-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <Separator />

                        {/* Theme Count and Controls */}
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="text-muted-foreground text-sm">
                                {isLoadingThemes
                                    ? "Loading..."
                                    : `${filteredThemes.length} themes available`}
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Randomizer */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={randomizeTheme}
                                    disabled={isLoadingThemes || filteredThemes.length === 0}
                                    title="Random theme"
                                >
                                    <ShuffleIcon className="h-3.5 w-3.5" />
                                    <span className="sr-only">Random theme</span>
                                </Button>

                                {/* Import Button */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setIsImportDialogOpen(true)
                                    }}
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Import
                                </Button>
                            </div>
                        </div>
                        <Separator />

                        {/* Themes List */}
                        <ScrollArea className="h-80">
                            <div className="p-2">
                                {isLoadingThemes ? (
                                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                                        <LoaderIcon className="size-4 animate-spin" />
                                        Loading themes...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 ">
                                        {filteredThemes.map((theme) => {
                                            const isSelected = selectedThemeUrl === theme.url
                                            const colors =
                                                "error" in theme && theme.error
                                                    ? []
                                                    : "preset" in theme
                                                      ? extractThemeColors(
                                                            theme.preset,
                                                            themeState.currentMode
                                                        )
                                                      : []

                                            return (
                                                <button
                                                    type="button"
                                                    key={theme.url}
                                                    onClick={() => handleThemeSelect(theme)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault()
                                                            handleThemeSelect(theme)
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md sm:hover:scale-[1.02] ",
                                                        isSelected
                                                            ? "border-primary shadow-sm ring-2 ring-primary/20"
                                                            : "border-border hover:border-primary/50",
                                                        "error" in theme &&
                                                            theme.error &&
                                                            "cursor-not-allowed opacity-50 hover:scale-100"
                                                    )}
                                                    disabled={"error" in theme && !!theme.error}
                                                >
                                                    <div className="flex items-center justify-between p-3">
                                                        <div className="text-left">
                                                            <div className="font-medium text-sm">
                                                                {theme.name}
                                                            </div>
                                                            {isSelected && (
                                                                <div className="text-muted-foreground text-xs">
                                                                    Currently active
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                                                                <CheckCircle className="size-4 text-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {colors.length > 0 && (
                                                        <div className="flex h-2">
                                                            {colors.map((color, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex-1"
                                                                    style={{
                                                                        backgroundColor: color
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {"error" in theme && theme.error && (
                                                        <div className="p-3 pt-2 text-destructive text-xs">
                                                            Error: {theme.error}
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <Separator />

                        {/* Footer */}
                        <div className="flex items-center justify-center gap-1 p-3 text-muted-foreground text-sm">
                            Get more themes at
                            <a
                                href="https://tweakcn.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-primary transition-colors hover:underline"
                            >
                                tweakcn.com
                                <ExternalLinkIcon className="ml-1 size-3" />
                            </a>
                        </div>
                    </ResponsivePopoverContent>
                </ResponsivePopover>
            </div>
        </>
    )
}
