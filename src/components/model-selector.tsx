import { ClaudeIcon, GeminiIcon, MetaIcon, OpenAIIcon } from "@/components/brand-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import {
    ResponsivePopover,
    ResponsivePopoverContent,
    ResponsivePopoverTrigger
} from "@/components/ui/responsive-popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/convex/_generated/api"
import { MODELS_SHARED, type SharedModel } from "@/convex/lib/models"
import { useSession } from "@/hooks/auth-hooks"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import { DefaultSettings } from "@/convex/settings"
import { useDiskCachedQuery } from "@/lib/convex-cached-query"
import { type DisplayModel, useAvailableModels } from "@/lib/models-providers-shared"
import { useConvexAuth } from "@convex-dev/react-query"
import { Brain, Check, ChevronDown, ExternalLink, Eye, Globe, Image } from "lucide-react"
import * as React from "react"
import { BlackForestLabsIcon, StabilityIcon } from "./brand-icons"
import { Separator } from "./ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export const getProviderIcon = (model: DisplayModel, isCustom: boolean) => {
    if (isCustom) {
        return <Badge className="text-xs">Custom</Badge>
    }

    // For shared models, try to determine provider from adapters
    const sharedModel = model as SharedModel
    if (sharedModel.customIcon || sharedModel.adapters) {
        const firstAdapter = sharedModel.adapters?.[0]
        const icon = sharedModel.customIcon ?? firstAdapter?.split(":")[0]

        switch (icon) {
            case "i3-openai":
            case "openai":
                return <OpenAIIcon className="size-4" />
            case "i3-anthropic":
            case "anthropic":
                return <ClaudeIcon className="size-4" />
            case "i3-google":
            case "google":
                return <GeminiIcon className="size-4" />
            case "bflabs":
                return <BlackForestLabsIcon className="size-4" />
            case "stability-ai":
                return <StabilityIcon className="size-4" />
            case "meta":
                return <MetaIcon className="size-4" />
            default:
                return <Badge className="text-xs">Built-in</Badge>
        }
    }

    return <Badge className="text-xs">Built-in</Badge>
}

interface ModelInfoPanelProps {
    model: DisplayModel | null
    isCustom?: boolean
}

const ModelInfoPanel = React.memo(function ModelInfoPanel({
    model,
    isCustom = false
}: ModelInfoPanelProps) {
    if (!model) return null

    const sharedModel = model as SharedModel
    const providerName = React.useMemo(() => {
        if (isCustom) return "Custom"

        const firstAdapter = sharedModel.adapters?.[0]
        const provider = firstAdapter?.split(":")[0]

        switch (provider) {
            case "i3-openai":
            case "openai":
                return "OpenAI"
            case "i3-anthropic":
            case "anthropic":
                return "Anthropic"
            case "i3-google":
            case "google":
                return "Google"
            case "bflabs":
                return "Black Forest Labs"
            case "stability-ai":
                return "Stability AI"
            default:
                return "Built-in"
        }
    }, [sharedModel.adapters, isCustom])

    const abilityRenderer = (ability: string) => {
        switch (ability) {
            case "reasoning":
                return (
                    <Badge variant="secondary" className="text-xs">
                        <Brain className="mr-1 h-3 w-3" />
                        Reasoning
                    </Badge>
                )
            case "vision":
                return (
                    <Badge variant="secondary" className="text-xs">
                        <Eye className="mr-1 h-3 w-3" />
                        Vision
                    </Badge>
                )
            case "web_search":
                return (
                    <Badge variant="secondary" className="text-xs">
                        <Globe className="mr-1 h-3 w-3" />
                        Web Search
                    </Badge>
                )
            case "image_generation":
                return (
                    <Badge variant="secondary" className="text-xs">
                        <Image className="mr-1 h-3 w-3" />
                        Image Generation
                    </Badge>
                )
            case "supermemory":
                return (
                    <Badge variant="secondary" className="text-xs">
                        <Brain className="mr-1 h-3 w-3" />
                        Memory
                    </Badge>
                )
            default:
                return null
        }
    }

    return (
        <div className="-translate-y-px flex w-68 flex-col space-y-4 rounded-md border bg-popover p-4">
            <div className="flex items-center gap-3">
                {getProviderIcon(model, isCustom)}
                <div>
                    <h3 className="font-semibold">{model.name}</h3>
                </div>
            </div>

            {(model.abilities.length > 0 || model.mode === "image") && (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {model.mode === "image" && abilityRenderer("image_generation")}
                        {model.abilities.sort().map((ability) => (
                            <div key={ability}>{abilityRenderer(ability)}</div>
                        ))}
                    </div>
                </div>
            )}

            <Separator />

            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{providerName}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Id</span>
                    <span className="font-mono text-xs">{model.id}</span>
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a
                        href={`https://platform.openai.com/docs/models/${model.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                    >
                        API Docs
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </Button>
                <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a
                        href={`https://openai.com/api/models/${model.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                    >
                        Model Page
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </Button>
            </div>
        </div>
    )
})

interface ModelItemProps {
    model: DisplayModel
    selectedModel: string
    onModelChange: (modelId: string) => void
    onClose: () => void
    isCustom?: boolean
    onHover?: (model: DisplayModel | null) => void
}

const ModelItem = React.memo(function ModelItem({
    model,
    selectedModel,
    onModelChange,
    onClose,
    isCustom = false,
    onHover
}: ModelItemProps) {
    const abilityRenderer = (ability: string, className: string) => {
        switch (ability) {
            case "reasoning":
                return (
                    <Tooltip>
                        <TooltipTrigger>
                            <Brain className={className} />
                        </TooltipTrigger>
                        <TooltipContent>Reasoning</TooltipContent>
                    </Tooltip>
                )
            case "vision":
                return (
                    <Tooltip>
                        <TooltipTrigger>
                            <Eye className={className} />
                        </TooltipTrigger>
                        <TooltipContent>Vision</TooltipContent>
                    </Tooltip>
                )
            case "web_search":
                return (
                    <Tooltip>
                        <TooltipTrigger>
                            <Globe className={className} />
                        </TooltipTrigger>
                        <TooltipContent>Web Search</TooltipContent>
                    </Tooltip>
                )
            case "image_generation":
                return (
                    <Tooltip>
                        <TooltipTrigger>
                            <Image className={className} />
                        </TooltipTrigger>
                        <TooltipContent>Image Generation</TooltipContent>
                    </Tooltip>
                )
        }
    }

    return (
        <CommandItem
            key={model.id}
            onSelect={() => {
                onModelChange(model.id)
                onClose()
            }}
            onMouseEnter={() => onHover?.(model)}
            onMouseLeave={() => onHover?.(null)}
            className={cn(
                "flex items-center gap-2",
                model.id === selectedModel && "bg-accent/50 text-accent-foreground"
            )}
        >
            {getProviderIcon(model, isCustom)}
            <span className="flex items-center gap-2">
                {model.name}
                {model.id === selectedModel && <Check className="size-4" />}
            </span>
            <div className="ml-auto flex gap-2">
                {model.mode === "image" &&
                    abilityRenderer(
                        "image_generation",
                        "bg-accent text-accent-foreground p-1 rounded-md size-5"
                    )}
                {model.abilities.sort().map((ability) => (
                    <div key={ability} className="flex items-center justify-center rounded-full">
                        {abilityRenderer(
                            ability,
                            "bg-accent text-accent-foreground p-1 rounded-md size-5"
                        )}
                    </div>
                ))}
            </div>
        </CommandItem>
    )
})

export function ModelSelector({
    selectedModel,
    onModelChange,
    className
}: {
    selectedModel: string
    onModelChange: (modelId: string) => void
    className?: string
}) {
    const auth = useConvexAuth()
    const session = useSession()
    const userSettings = useDiskCachedQuery(
        api.settings.getUserSettings,
        {
            key: "user-settings",
            default: DefaultSettings(session.user?.id ?? "CACHE"),
            forceCache: true
        },
        session.user?.id && !auth.isLoading ? {} : "skip"
    )

    const { availableModels } = useAvailableModels(
        "error" in userSettings ? DefaultSettings(session.user?.id ?? "") : userSettings
    )

    const [open, setOpen] = React.useState(false)
    const [hoveredModel, setHoveredModel] = React.useState<DisplayModel | null>(null)

    // Memoize expensive computations to avoid repeating them on every render
    const { selectedModelData, customModels, groupedSharedModels } = React.useMemo(() => {
        // Find the model currently selected by the user
        const selectedModelData = availableModels.find((model) => model.id === selectedModel)

        // Separate shared and custom models
        const sharedModels = availableModels.filter((model) => !("isCustom" in model))
        const customModels = availableModels.filter(
            (model) => "isCustom" in model && model.isCustom
        )

        // Group shared models by provider
        const groupedSharedModels = Object.entries(
            sharedModels.reduce<Record<string, DisplayModel[]>>((acc, model) => {
                const sharedModel = model as SharedModel
                const provider = sharedModel.adapters?.[0]?.split(":")[0] || "unknown"
                const providerKey = provider.startsWith("i3-") ? "Built-in" : provider

                if (!acc[providerKey]) {
                    acc[providerKey] = []
                }
                acc[providerKey].push(model)
                return acc
            }, {})
        )

        return { selectedModelData, customModels, groupedSharedModels }
    }, [availableModels, selectedModel])

    const isMobile = useIsMobile()

    // React.useEffect(() => {
    //     const down = (e: KeyboardEvent) => {
    //         if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    //             e.preventDefault()
    //             setOpen((open) => !open)
    //         }
    //     }

    //     document.addEventListener("keydown", down)
    //     return () => document.removeEventListener("keydown", down)
    // }, [])

    const icon = React.useMemo(() => {
        if (!selectedModelData) return null

        const isCustom = !MODELS_SHARED.some((m) => m.id === selectedModelData.id)
        return getProviderIcon(selectedModelData, isCustom)
    }, [selectedModelData])

    return (
        <ResponsivePopover open={open} onOpenChange={setOpen}>
            <ResponsivePopoverTrigger asChild>
                <Button
                    variant="ghost"
                    aria-expanded={open}
                    className={cn(
                        "h-8 bg-secondary/70 font-normal text-xs backdrop-blur-lg sm:text-sm md:rounded-md",
                        className,
                        "!px-1.5 min-[390px]:!px-2 gap-0.5 min-[390px]:gap-2"
                    )}
                >
                    {selectedModelData && (
                        <div className="flex items-center gap-2">
                            <div className="block min-[390px]:hidden">{icon}</div>
                            <span className="hidden md:hidden min-[390px]:block">
                                {(selectedModelData as SharedModel)?.shortName ||
                                    selectedModelData?.name}
                            </span>
                            <span className="hidden md:block">{selectedModelData?.name}</span>
                        </div>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
            </ResponsivePopoverTrigger>
            <ResponsivePopoverContent
                className={cn("w-80 p-0")}
                align="start"
                title="Select Model"
                description="Choose a model for your conversation"
            >
                <div className={cn("relative flex")}>
                    <div className={cn("w-80")}>
                        <Command>
                            {!isMobile && (
                                <CommandInput placeholder="Search models..." className="h-8" />
                            )}
                            <CommandList>
                                <CommandEmpty>No model found.</CommandEmpty>
                                <ScrollArea className="h-[300px]">
                                    {groupedSharedModels.map(([providerKey, providerModels]) => (
                                        <CommandGroup
                                            key={providerKey}
                                            heading={
                                                providerKey === "Built-in"
                                                    ? "Built-in Models"
                                                    : providerKey === "openai"
                                                      ? "OpenAI"
                                                      : providerKey === "anthropic"
                                                        ? "Anthropic"
                                                        : providerKey === "google"
                                                          ? "Google"
                                                          : providerKey === "fal"
                                                            ? "Fal.AI"
                                                            : providerKey
                                            }
                                        >
                                            {providerModels.map((model) => (
                                                <ModelItem
                                                    key={model.id}
                                                    model={model}
                                                    selectedModel={selectedModel}
                                                    onModelChange={onModelChange}
                                                    onClose={() => setOpen(false)}
                                                    onHover={setHoveredModel}
                                                    isCustom={false}
                                                />
                                            ))}
                                        </CommandGroup>
                                    ))}
                                    {customModels.length > 0 && (
                                        <CommandGroup heading="Custom Models">
                                            {customModels.map((model) => (
                                                <ModelItem
                                                    key={model.id}
                                                    model={model}
                                                    selectedModel={selectedModel}
                                                    onModelChange={onModelChange}
                                                    onClose={() => setOpen(false)}
                                                    onHover={setHoveredModel}
                                                    isCustom={true}
                                                />
                                            ))}
                                        </CommandGroup>
                                    )}
                                </ScrollArea>
                            </CommandList>
                        </Command>
                    </div>
                    {!isMobile && (
                        <div className="absolute top-0 left-[100%] ml-0.5">
                            <ModelInfoPanel
                                model={hoveredModel || selectedModelData || null}
                                isCustom={
                                    hoveredModel
                                        ? !MODELS_SHARED.some((m) => m.id === hoveredModel.id)
                                        : selectedModelData
                                          ? !MODELS_SHARED.some(
                                                (m) => m.id === selectedModelData.id
                                            )
                                          : false
                                }
                            />
                        </div>
                    )}
                </div>
            </ResponsivePopoverContent>
        </ResponsivePopover>
    )
}
