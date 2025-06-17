import { SettingsLayout } from "@/components/settings/settings-layout"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/hooks/auth-hooks"
import { cn } from "@/lib/utils"
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CheckCircle, Globe, Search } from "lucide-react"
import { memo, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/settings/ai-options")({
    component: AIOptionsSettings
})

type SearchProvider = "firecrawl" | "brave"

const SearchProviderCard = memo(
    ({
        provider,
        isSelected,
        onSelect,
        title,
        description
    }: {
        provider: SearchProvider
        isSelected: boolean
        onSelect: (provider: SearchProvider) => void
        title: string
        description: string
    }) => {
        return (
            <Card
                className={cn(
                    "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
                    isSelected
                        ? "bg-primary/5 ring-1 ring-primary/20"
                        : "hover:ring-1 hover:ring-border"
                )}
                onClick={() => onSelect(provider)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-background">
                        <Search className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Label className="cursor-pointer font-medium text-foreground">
                                {title}
                            </Label>
                            {isSelected && <CheckCircle className="ml-auto size-4 text-primary" />}
                        </div>
                        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
                    </div>
                </div>
            </Card>
        )
    }
)

function AIOptionsSettings() {
    const session = useSession()
    const [isLoading, setIsLoading] = useState(false)

    const userSettings = useConvexQuery(
        api.settings.getUserSettings,
        session.user?.id ? {} : "skip"
    )

    const updateSettings = useConvexMutation(api.settings.updateUserSettings)

    if (!session.user?.id) {
        return (
            <SettingsLayout
                title="AI Options"
                description="Configure AI search and web search preferences."
            >
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Sign in to manage your AI options.</p>
                </div>
            </SettingsLayout>
        )
    }

    if (!userSettings) {
        return (
            <SettingsLayout
                title="AI Options"
                description="Configure AI search and web search preferences."
            >
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        Loading settings...
                    </div>
                </div>
            </SettingsLayout>
        )
    }

    if ("error" in userSettings) {
        return (
            <SettingsLayout
                title="AI Options"
                description="Configure AI search and web search preferences."
            >
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Error loading AI options.</p>
                </div>
            </SettingsLayout>
        )
    }

    const handleSearchProviderChange = async (provider: SearchProvider) => {
        if (provider === userSettings.searchProvider) return

        setIsLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(userSettings.coreAIProviders)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(userSettings.customAIProviders)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                }
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: provider,
                    searchIncludeSourcesByDefault: userSettings.searchIncludeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes
                },
                coreProviders,
                customProviders
            })

            toast.success(
                `Search provider updated to ${provider === "firecrawl" ? "Firecrawl" : "Brave"}`
            )
        } catch (error) {
            toast.error("Failed to update search provider")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleIncludeSourcesToggle = async (includeSourcesByDefault: boolean) => {
        if (includeSourcesByDefault === userSettings.searchIncludeSourcesByDefault) return

        setIsLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(userSettings.coreAIProviders)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(userSettings.customAIProviders)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                }
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings.searchProvider,
                    searchIncludeSourcesByDefault: includeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes
                },
                coreProviders,
                customProviders
            })

            toast.success(
                `Search sources ${includeSourcesByDefault ? "enabled" : "disabled"} by default`
            )
        } catch (error) {
            toast.error("Failed to update search sources setting")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SettingsLayout
            title="AI Options"
            description="Configure AI search and web search preferences."
        >
            <div className="space-y-8">
                {/* Search Provider Section */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground">Web Search Provider</h3>
                        <p className="mt-1 text-muted-foreground text-sm">
                            Choose which service to use for web searches
                        </p>
                    </div>

                    <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                        <SearchProviderCard
                            provider="firecrawl"
                            isSelected={userSettings.searchProvider === "firecrawl"}
                            onSelect={handleSearchProviderChange}
                            title="Firecrawl"
                            description="Advanced web scraping with content extraction and markdown support"
                        />
                        <SearchProviderCard
                            provider="brave"
                            isSelected={userSettings.searchProvider === "brave"}
                            onSelect={handleSearchProviderChange}
                            title="Brave Search"
                            description="Fast, privacy-focused search results from Brave's independent index"
                        />
                    </div>
                </div>

                {/* Search Sources Section */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground">Search Sources</h3>
                        <p className="mt-1 text-muted-foreground text-sm">
                            Control whether to include source information in search results by
                            default
                        </p>
                    </div>

                    <Card className="border-0 bg-muted/20 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-background">
                                    <Globe className="h-4 w-4 text-foreground" />
                                </div>
                                <div>
                                    <Label className="font-medium text-foreground">
                                        Include sources by default
                                    </Label>
                                    <p className="mt-1 text-muted-foreground text-sm">
                                        When enabled, search results will include source URLs and
                                        content snippets
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={userSettings.searchIncludeSourcesByDefault}
                                onCheckedChange={handleIncludeSourcesToggle}
                                disabled={isLoading}
                            />
                        </div>
                    </Card>
                </div>

                {/* Info Section */}
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                            <Search className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium text-foreground text-sm">
                                About Web Search
                            </h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                These settings control how the AI assistant performs web searches.
                                Firecrawl provides more detailed content extraction but may be
                                slower, while Brave Search offers faster results with privacy focus.
                                Source inclusion can help with factual verification but increases
                                response length.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    )
}
