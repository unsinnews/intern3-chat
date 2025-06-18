import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/hooks/auth-hooks"
import { cn } from "@/lib/utils"
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { Infer } from "convex/values"
import type { MCPServerConfig as MCPServerConfigSchema, UserSettings } from "@/convex/schema/settings"
import {
    AlertCircle,
    Brain,
    Check,
    CheckCircle,
    Globe,
    Key,
    Plus,
    RotateCcw,
    Search,
    Server,
    SquarePen,
    Trash2,
    X
} from "lucide-react"
import { memo, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/settings/ai-options")({
    component: AIOptionsSettings
})

type SearchProvider = "firecrawl" | "brave"
type MCPServerConfig = Infer<typeof MCPServerConfigSchema>

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

const SupermemoryCard = memo(
    ({
        userSettings,
        onSave,
        loading
    }: {
        userSettings: Infer<typeof UserSettings>
        onSave: (enabled: boolean, newKey?: string) => Promise<void>
        loading: boolean
    }) => {
        const [isEditing, setIsEditing] = useState(false)
        const [enabled, setEnabled] = useState(userSettings.supermemory?.enabled || false)
        const [newKey, setNewKey] = useState("")
        const [rotatingKey, setRotatingKey] = useState(false)

        const hasExistingKey = Boolean(userSettings.supermemory?.encryptedKey)
        const isEnabled = userSettings.supermemory?.enabled || false

        const handleSave = async () => {
            const canSave = !enabled || newKey.trim() || hasExistingKey
            if (!canSave) return

            try {
                await onSave(enabled, newKey.trim() || undefined)
                setIsEditing(false)
                setNewKey("")
                setRotatingKey(false)
            } catch (error) {
                // Error handling is done in the parent component
            }
        }

        const handleCancel = () => {
            setIsEditing(false)
            setEnabled(userSettings.supermemory?.enabled || false)
            setNewKey("")
            setRotatingKey(false)
        }

        const canSave = !enabled || newKey.trim() || hasExistingKey

        return (
            <Card className="p-4 shadow-xs">
                <div className="flex items-start gap-2 space-y-4">
                    <div className="flex size-8 items-center justify-center rounded-lg">
                        <Brain className="size-5" />
                    </div>
                    <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-start gap-2">
                                <div>
                                    <h4 className="font-semibold text-sm">Supermemory</h4>
                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                        Store and retrieve memories for AI context across
                                        conversations
                                    </p>
                                </div>
                            </div>

                            {isEnabled && (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground text-xs">Active</span>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="supermemory-enabled"
                                        checked={enabled}
                                        onCheckedChange={setEnabled}
                                    />
                                    <Label htmlFor="supermemory-enabled">Enable Supermemory</Label>
                                </div>

                                {enabled && (
                                    <div className="space-y-3">
                                        {hasExistingKey && (
                                            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <Key className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm">
                                                        API key configured
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setRotatingKey(!rotatingKey)}
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                    {rotatingKey ? "Keep existing" : "Rotate key"}
                                                </Button>
                                            </div>
                                        )}

                                        {(!hasExistingKey || rotatingKey) && (
                                            <div className="space-y-2">
                                                <Label htmlFor="supermemory-key">
                                                    {rotatingKey ? "New API Key" : "API Key"}
                                                </Label>
                                                <Input
                                                    id="supermemory-key"
                                                    type="password"
                                                    value={newKey}
                                                    onChange={(e) => setNewKey(e.target.value)}
                                                    placeholder="sm-..."
                                                    className="font-mono"
                                                />
                                                {rotatingKey && (
                                                    <p className="text-muted-foreground text-xs">
                                                        Leave empty to keep existing key
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                {enabled && !hasExistingKey && !newKey.trim() && (
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm">
                                            API key required to enable Supermemory
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={loading || !canSave}
                                size="sm"
                            >
                                <Check className="h-4 w-4" />
                                {loading ? "Saving..." : "Save"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }
)

const MCPServersCard = memo(
    ({
        userSettings,
        onSave,
        loading
    }: {
        userSettings: Infer<typeof UserSettings>
        onSave: (servers: MCPServerConfig[]) => Promise<void>
        loading: boolean
    }) => {
        const [isEditing, setIsEditing] = useState(false)
        const [servers, setServers] = useState<MCPServerConfig[]>(userSettings.mcpServers || [])
        const [newServer, setNewServer] = useState<MCPServerConfig>({
            name: "",
            url: "",
            type: "http",
            headers: []
        })
        const [showAddHeader, setShowAddHeader] = useState(false)
        const [newHeader, setNewHeader] = useState({ key: "", value: "" })

        const handleAddServer = () => {
            if (newServer.name && newServer.url) {
                setServers([...servers, { ...newServer }])
                setNewServer({
                    name: "",
                    url: "",
                    type: "http",
                    headers: []
                })
                setShowAddHeader(false)
            }
        }

        const handleRemoveServer = (index: number) => {
            setServers(servers.filter((_, i: number) => i !== index))
        }

        const handleAddHeader = () => {
            if (newHeader.key && newHeader.value) {
                setNewServer({
                    ...newServer,
                    headers: [...(newServer.headers || []), { ...newHeader }]
                })
                setNewHeader({ key: "", value: "" })
            }
        }

        const handleRemoveHeader = (index: number) => {
            setNewServer({
                ...newServer,
                headers: (newServer.headers || []).filter((_, i) => i !== index)
            })
        }

        const handleSave = async () => {
            try {
                await onSave(servers)
                setIsEditing(false)
            } catch (error) {
                // Error handling is done in the parent component
            }
        }

        const handleCancel = () => {
            setIsEditing(false)
            setServers(userSettings.mcpServers || [])
            setNewServer({
                name: "",
                url: "",
                type: "http",
                headers: []
            })
            setShowAddHeader(false)
        }

        return (
            <Card className="p-4 shadow-xs">
                <div className="flex items-start gap-2 space-y-4">
                    <div className="flex size-8 items-center justify-center rounded-lg">
                        <Server className="size-5" />
                    </div>
                    <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-start gap-2">
                                <div>
                                    <h4 className="font-semibold text-sm">MCP Servers</h4>
                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                        Connect to Model Context Protocol servers for additional AI
                                        tools
                                    </p>
                                </div>
                            </div>

                            {servers.length > 0 && !isEditing && (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground text-xs">
                                        {servers.length} server{servers.length > 1 ? "s" : ""}{" "}
                                        configured
                                    </span>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                {/* List existing servers */}
                                {servers.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm">Configured Servers</Label>
                                        {servers.map((server, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {server.name}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {server.type.toUpperCase()}: {server.url}
                                                    </div>
                                                    {server.headers?.length > 0 && (
                                                        <div className="mt-1 text-muted-foreground text-xs">
                                                            {server.headers.length} custom header
                                                            {server.headers.length > 1 ? "s" : ""}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveServer(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new server form */}
                                <div className="space-y-3 rounded-lg border p-4">
                                    <Label className="text-sm">Add New Server</Label>
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="mcp-name" className="text-xs">
                                                Server Name
                                            </Label>
                                            <Input
                                                id="mcp-name"
                                                value={newServer.name}
                                                onChange={(e) =>
                                                    setNewServer({
                                                        ...newServer,
                                                        name: e.target.value
                                                    })
                                                }
                                                placeholder="my-server"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="mcp-url" className="text-xs">
                                                Server URL
                                            </Label>
                                            <Input
                                                id="mcp-url"
                                                value={newServer.url}
                                                onChange={(e) =>
                                                    setNewServer({
                                                        ...newServer,
                                                        url: e.target.value
                                                    })
                                                }
                                                placeholder="http://localhost:3000/mcp"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="mcp-type" className="text-xs">
                                                Transport Type
                                            </Label>
                                            <div className="mt-1 flex gap-2">
                                                <Button
                                                    variant={
                                                        newServer.type === "http"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setNewServer({ ...newServer, type: "http" })
                                                    }
                                                >
                                                    HTTP
                                                </Button>
                                                <Button
                                                    variant={
                                                        newServer.type === "sse"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setNewServer({ ...newServer, type: "sse" })
                                                    }
                                                >
                                                    SSE
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Headers section */}
                                        {(newServer.headers?.length || 0) > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-xs">Headers</Label>
                                                {newServer.headers?.map((header, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 text-xs"
                                                    >
                                                        <code className="flex-1 rounded bg-muted px-2 py-1">
                                                            {header.key}: {header.value}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveHeader(index)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {showAddHeader ? (
                                            <div className="space-y-2">
                                                <Label className="text-xs">Add Header</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newHeader.key}
                                                        onChange={(e) =>
                                                            setNewHeader({
                                                                ...newHeader,
                                                                key: e.target.value
                                                            })
                                                        }
                                                        placeholder="Header key"
                                                        className="flex-1"
                                                    />
                                                    <Input
                                                        value={newHeader.value}
                                                        onChange={(e) =>
                                                            setNewHeader({
                                                                ...newHeader,
                                                                value: e.target.value
                                                            })
                                                        }
                                                        placeholder="Header value"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={handleAddHeader}
                                                        disabled={
                                                            !newHeader.key || !newHeader.value
                                                        }
                                                    >
                                                        Add
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowAddHeader(false)
                                                            setNewHeader({ key: "", value: "" })
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowAddHeader(true)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Header
                                            </Button>
                                        )}

                                        <Button
                                            onClick={handleAddServer}
                                            disabled={!newServer.name || !newServer.url}
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Server
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading}
                                        size="sm"
                                    >
                                        <Check className="h-4 w-4" />
                                        {loading ? "Saving..." : "Save"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                {servers.length > 0 ? (
                                    <SquarePen className="size-4" />
                                ) : (
                                    <Server className="size-4" />
                                )}
                                {servers.length > 0 ? "Edit" : "Setup"}
                            </Button>
                        )}
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

    const handleMCPServersUpdate = async (servers: MCPServerConfig[]) => {
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
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground">MCP Servers</h3>
                        <p className="mt-1 text-muted-foreground text-sm">
                            Connect to Model Context Protocol servers for additional AI capabilities
                        </p>
                    </div>

                    <MCPServersCard
                        userSettings={userSettings}
                        onSave={handleMCPServersUpdate}
                        loading={isLoading}
                    />
                </div>

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
