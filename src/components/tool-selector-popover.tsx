import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    ResponsivePopover,
    ResponsivePopoverContent,
    ResponsivePopoverTrigger
} from "@/components/ui/responsive-popover"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import type { AbilityId } from "@/convex/lib/toolkit"
import { useSession } from "@/hooks/auth-hooks"
import { useModelStore } from "@/lib/model-store"
import { cn } from "@/lib/utils"
import { useConvexQuery } from "@convex-dev/react-query"
import { Brain, Globe, Server, Settings2 } from "lucide-react"
import { memo } from "react"

type ToolSelectorPopoverProps = {
    threadId?: string
    enabledTools: AbilityId[]
    onEnabledToolsChange: (tools: AbilityId[]) => void
    modelSupportsFunctionCalling: boolean
    className?: string
}

export const ToolSelectorPopover = memo(
    ({
        threadId,
        enabledTools,
        onEnabledToolsChange,
        modelSupportsFunctionCalling,
        className
    }: ToolSelectorPopoverProps) => {
        const session = useSession()
        const { setMcpOverride, setDefaultMcpOverride, mcpOverrides, defaultMcpOverrides } =
            useModelStore()

        const userSettings = useConvexQuery(
            api.settings.getUserSettings,
            session.user?.id ? {} : "skip"
        )

        if (!userSettings) return null

        const hasSupermemory = Boolean(userSettings.supermemory?.enabled)
        const mcpServers = (userSettings.mcpServers || []).filter(
            (server) => server.enabled !== false
        )
        const hasMcpServers = mcpServers.length > 0

        // If no supermemory or MCP servers, show simple web search button
        if (!hasSupermemory && !hasMcpServers) {
            return (
                <Button
                    type="button"
                    variant={enabledTools.includes("web_search") ? "default" : "ghost"}
                    disabled={!modelSupportsFunctionCalling}
                    onClick={() => {
                        if (modelSupportsFunctionCalling) {
                            onEnabledToolsChange(
                                enabledTools.includes("web_search")
                                    ? enabledTools.filter((tool) => tool !== "web_search")
                                    : [...enabledTools, "web_search"]
                            )
                        }
                    }}
                    className={cn(
                        "size-8 shrink-0",
                        !enabledTools.includes("web_search") &&
                            "border border-accent bg-secondary/70 backdrop-blur-lg hover:bg-secondary/80",
                        !modelSupportsFunctionCalling && "cursor-not-allowed opacity-50",
                        className
                    )}
                >
                    <Globe className="size-4" />
                </Button>
            )
        }

        // Calculate effective MCP overrides directly to ensure re-renders
        const currentMcpOverrides = threadId
            ? { ...defaultMcpOverrides, ...(mcpOverrides[threadId] || {}) }
            : { ...defaultMcpOverrides }

        const handleWebSearchToggle = () => {
            if (!modelSupportsFunctionCalling) return

            onEnabledToolsChange(
                enabledTools.includes("web_search")
                    ? enabledTools.filter((tool) => tool !== "web_search")
                    : [...enabledTools, "web_search"]
            )
        }

        const handleSupermemoryToggle = () => {
            onEnabledToolsChange(
                enabledTools.includes("supermemory")
                    ? enabledTools.filter((tool) => tool !== "supermemory")
                    : [...enabledTools, "supermemory"]
            )
        }

        const handleMcpServerToggle = (serverName: string, enabled: boolean) => {
            if (threadId) {
                // Set thread-specific override
                setMcpOverride(threadId, serverName, enabled)
            } else {
                // Set default override for new chats
                setDefaultMcpOverride(serverName, enabled)
            }
        }

        const getActiveToolsCount = () => {
            let count = 0
            if (enabledTools.includes("web_search")) count++
            if (enabledTools.includes("supermemory")) count++
            if (hasMcpServers) {
                // Count enabled MCP servers for this thread
                const enabledMcpCount = mcpServers.filter(
                    (server) => currentMcpOverrides[server.name] !== false // Default to enabled
                ).length
                if (enabledMcpCount > 0) count++
            }
            return count
        }

        const activeCount = getActiveToolsCount()

        return (
            <ResponsivePopover>
                <ResponsivePopoverTrigger asChild>
                    <Button
                        type="button"
                        variant={activeCount > 0 ? "default" : "ghost"}
                        disabled={!modelSupportsFunctionCalling}
                        className={cn(
                            "relative size-8 shrink-0",
                            activeCount === 0 &&
                                "border border-accent bg-secondary/70 backdrop-blur-lg hover:bg-secondary/80",
                            !modelSupportsFunctionCalling && "cursor-not-allowed opacity-50",
                            className
                        )}
                    >
                        <Settings2 className="size-4" />
                        {activeCount > 0 && (
                            <span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                {activeCount}
                            </span>
                        )}
                    </Button>
                </ResponsivePopoverTrigger>
                <ResponsivePopoverContent
                    title="AI Tools"
                    description="Configure which tools the AI can use"
                    className="max-sm:p-3 [&_[data-slot='sheet-header']]:p-1"
                >
                    <div className="space-y-4 p-1">
                        {/* Web Search */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-blue-500" />
                                <Label className="font-medium text-sm">Web Search</Label>
                            </div>
                            <Switch
                                checked={enabledTools.includes("web_search")}
                                onCheckedChange={handleWebSearchToggle}
                                disabled={!modelSupportsFunctionCalling}
                            />
                        </div>

                        {/* Supermemory */}
                        {hasSupermemory && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Brain className="h-4 w-4 text-purple-500" />
                                    <Label className="font-medium text-sm">Supermemory</Label>
                                </div>
                                <Switch
                                    checked={enabledTools.includes("supermemory")}
                                    onCheckedChange={handleSupermemoryToggle}
                                />
                            </div>
                        )}

                        {/* MCP Servers */}
                        {hasMcpServers && (
                            <div className="border-t pt-3">
                                <div className="mb-3 flex items-center gap-2">
                                    <Server className="h-4 w-4 text-green-500" />
                                    <Label className="font-medium text-sm">MCP Servers</Label>
                                </div>
                                <div className="space-y-3">
                                    {mcpServers.map((server) => {
                                        const isEnabled = currentMcpOverrides[server.name] !== false // Default to enabled
                                        return (
                                            <div
                                                key={server.name}
                                                className="flex items-center gap-2"
                                            >
                                                <Label className="text-sm">{server.name}</Label>
                                                <span className="rounded bg-muted px-0.5 py-0.25 text-muted-foreground text-xs leading-none">
                                                    {server.type.toUpperCase()}
                                                </span>
                                                <div className="flex-1" />

                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={(enabled) =>
                                                        handleMcpServerToggle(server.name, enabled)
                                                    }
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {!modelSupportsFunctionCalling && (
                            <div className="rounded bg-muted p-2 text-muted-foreground text-xs">
                                Current model doesn't support function calling
                            </div>
                        )}
                    </div>
                </ResponsivePopoverContent>
            </ResponsivePopover>
        )
    }
)
