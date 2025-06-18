import MCPIcon from "@/assets/mcp.svg"
import SupermemoryIcon from "@/assets/supermemory.svg"
import { Button } from "@/components/ui/button"
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
import { Brain, Globe, Settings2 } from "lucide-react"
import { memo } from "react"

type ToolSelectorPopoverProps = {
    threadId?: string
    enabledTools: AbilityId[]
    onEnabledToolsChange: (tools: AbilityId[]) => void
    modelSupportsFunctionCalling: boolean
    modelSupportsReasoning: boolean
    className?: string
}

export const ToolSelectorPopover = memo(
    ({
        threadId,
        enabledTools,
        onEnabledToolsChange,
        modelSupportsFunctionCalling,
        modelSupportsReasoning,
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

        const handleReasoningToggle = () => {
            if (!modelSupportsReasoning) return
            onEnabledToolsChange(
                enabledTools.includes("reasoning")
                    ? enabledTools.filter((tool) => tool !== "reasoning")
                    : [...enabledTools, "reasoning"]
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
            if (enabledTools.includes("reasoning")) count++
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
                <ResponsivePopoverContent className="w-54 p-2" align="start">
                    <div className="space-y-3">
                        <div className="mb-0 px-2 py-1.5 font-medium text-muted-foreground text-sm">
                            Tools
                        </div>

                        <div className="space-y-1">
                            <div
                                className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 transition-colors hover:bg-accent/50"
                                onClick={
                                    modelSupportsFunctionCalling ? handleWebSearchToggle : undefined
                                }
                                onKeyDown={(e) => {
                                    if (
                                        modelSupportsFunctionCalling &&
                                        (e.key === "Enter" || e.key === " ")
                                    ) {
                                        e.preventDefault()
                                        handleWebSearchToggle()
                                    }
                                }}
                                role="switch"
                                aria-checked={enabledTools.includes("web_search")}
                                tabIndex={modelSupportsFunctionCalling ? 0 : -1}
                            >
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4" />
                                    <span className="text-sm">Web Search</span>
                                </div>
                                <Switch
                                    checked={enabledTools.includes("web_search")}
                                    onCheckedChange={handleWebSearchToggle}
                                    disabled={!modelSupportsFunctionCalling}
                                />
                            </div>

                            {/* Supermemory */}
                            {hasSupermemory && (
                                <div
                                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 transition-colors hover:bg-accent/50"
                                    onClick={handleSupermemoryToggle}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            handleSupermemoryToggle()
                                        }
                                    }}
                                    role="switch"
                                    aria-checked={enabledTools.includes("supermemory")}
                                    tabIndex={0}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-4 items-center justify-center">
                                            <SupermemoryIcon />
                                        </div>
                                        <span className="text-sm">Supermemory</span>
                                    </div>
                                    <Switch
                                        checked={enabledTools.includes("supermemory")}
                                        onCheckedChange={handleSupermemoryToggle}
                                    />
                                </div>
                            )}

                            {modelSupportsReasoning && (
                                <div className="flex items-center justify-between rounded-sm px-2 py-2 transition-colors hover:bg-accent/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-4 items-center justify-center">
                                            <Brain className="size-4" />
                                        </div>
                                        <span className="text-sm">Think for longer</span>
                                    </div>
                                    <Switch
                                        checked={enabledTools.includes("reasoning")}
                                        onCheckedChange={handleReasoningToggle}
                                        disabled={!modelSupportsReasoning}
                                    />
                                </div>
                            )}
                        </div>

                        {hasMcpServers && (
                            <div className="space-y-1 border-t pt-3">
                                <div className="px-2 py-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                                    MCP Servers
                                </div>

                                {mcpServers.map((server) => {
                                    const isEnabled = currentMcpOverrides[server.name] !== false
                                    return (
                                        <div
                                            key={server.name}
                                            className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 transition-colors hover:bg-accent/50"
                                            onClick={() =>
                                                handleMcpServerToggle(server.name, !isEnabled)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault()
                                                    handleMcpServerToggle(server.name, !isEnabled)
                                                }
                                            }}
                                            role="switch"
                                            aria-checked={isEnabled}
                                            tabIndex={0}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-4 items-center justify-center">
                                                    <MCPIcon />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{server.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {server.type.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
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
                        )}

                        {!modelSupportsFunctionCalling && (
                            <div className="mt-2 border-t px-2 py-2 pt-2 text-muted-foreground text-xs">
                                Current model doesn't support function calling
                            </div>
                        )}
                    </div>
                </ResponsivePopoverContent>
            </ResponsivePopover>
        )
    }
)
