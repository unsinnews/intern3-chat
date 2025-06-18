import { MCPServersCard } from "@/components/settings/mcp-servers-card"
import { SearchProviderCard } from "@/components/settings/search-provider-card"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { SupermemoryCard } from "@/components/settings/supermemory-card"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import type { MCPServerConfig } from "@/convex/schema/settings"
import { useSession } from "@/hooks/auth-hooks"
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { Infer } from "convex/values"
import { Globe } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/settings/ai-options")({
    component: AIOptionsSettings
})

type SearchProvider = "firecrawl" | "brave"

function AIOptionsSettings() {
    const session = useSession()
    const [isLoading, setIsLoading] = useState(false)

    const userSettings = useConvexQuery(
        api.settings.getUserSettings,
        session.user?.id ? {} : "skip"
    )

    const updateSettings = useConvexMutation(api.settings.updateUserSettings)

    if (!session.user?.id || !userSettings) return null

    const handleSearchProviderChange = async (provider: SearchProvider) => {
        if (provider === userSettings.searchProvider) return
        if (!session.user) return

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
                userId: session.user!.id,
                baseSettings: {
                    userId: session.user!.id,
                    searchProvider: provider,
                    searchIncludeSourcesByDefault: userSettings.searchIncludeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes,
                    supermemory: userSettings.supermemory,
                    mcpServers: userSettings.mcpServers
                },
                coreProviders,
                customProviders
            })
        } catch (error) {
            toast.error("Failed to update search provider")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleIncludeSourcesToggle = async (includeSourcesByDefault: boolean) => {
        if (includeSourcesByDefault === userSettings.searchIncludeSourcesByDefault) return
        if (!session.user) return

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
                userId: session.user!.id,
                baseSettings: {
                    userId: session.user!.id,
                    searchProvider: userSettings.searchProvider,
                    searchIncludeSourcesByDefault: includeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes,
                    supermemory: userSettings.supermemory,
                    mcpServers: userSettings.mcpServers
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

    const handleSupermemoryUpdate = async (enabled: boolean, newKey?: string) => {
        if (!session.user) return

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
                userId: session.user!.id,
                baseSettings: {
                    userId: session.user!.id,
                    searchProvider: userSettings.searchProvider,
                    searchIncludeSourcesByDefault: userSettings.searchIncludeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes,
                    supermemory: userSettings.supermemory,
                    mcpServers: userSettings.mcpServers
                },
                coreProviders,
                customProviders,
                supermemory: {
                    enabled,
                    newKey
                }
            })

            toast.success(`Supermemory ${enabled ? "enabled" : "disabled"}`)
        } catch (error) {
            toast.error("Failed to update Supermemory settings")
            console.error(error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const handleMCPServersUpdate = async (servers: Infer<typeof MCPServerConfig>[]) => {
        if (!session.user) return

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
                userId: session.user!.id,
                baseSettings: {
                    userId: session.user!.id,
                    searchProvider: userSettings.searchProvider,
                    searchIncludeSourcesByDefault: userSettings.searchIncludeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes,
                    supermemory: userSettings.supermemory,
                    mcpServers: servers
                },
                coreProviders,
                customProviders,
                mcpServers: servers
            })

            toast.success("MCP servers updated successfully")
        } catch (error) {
            toast.error("Failed to update MCP servers")
            console.error(error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SettingsLayout
            title="AI Options"
            description="Configure AI search, memory, and web search preferences."
        >
            <div className="space-y-8">
                {/* Supermemory Section */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground">AI Memory</h3>
                        <p className="mt-1 text-muted-foreground text-sm">
                            Store and retrieve information across conversations for enhanced AI
                            context
                        </p>
                    </div>

                    <SupermemoryCard
                        userSettings={userSettings}
                        onSave={handleSupermemoryUpdate}
                        loading={isLoading}
                    />
                </div>

                {/* MCP Servers Section */}
                <MCPServersCard
                    userSettings={userSettings}
                    onSave={handleMCPServersUpdate}
                    loading={isLoading}
                />

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

                    <Card className="border-0 bg-muted p-4">
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
            </div>
        </SettingsLayout>
    )
}
