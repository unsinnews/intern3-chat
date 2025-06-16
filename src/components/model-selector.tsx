import Claude from "@/assets/claude.svg"
import Gemini from "@/assets/gemini.svg"
import OpenAI from "@/assets/openai.svg"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/convex/_generated/api"
import type { SharedModel } from "@/convex/lib/models"
import { useSession } from "@/hooks/auth-hooks"
import { cn } from "@/lib/utils"
import { type DisplayModel, useAvailableModels } from "@/routes/settings/models-providers"
import { useConvexQuery } from "@convex-dev/react-query"
import { Brain, Check, ChevronDown, Eye, Globe } from "lucide-react"
import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface ModelItemProps {
    model: DisplayModel
    selectedModel: string
    onModelChange: (modelId: string) => void
    onClose: () => void
    isCustom?: boolean
}

const ModelItem = React.memo(function ModelItem({
    model,
    selectedModel,
    onModelChange,
    onClose,
    isCustom = false
}: ModelItemProps) {
    const getProviderIcon = () => {
        if (isCustom) {
            return <Badge className="text-xs">Custom</Badge>
        }

        // For shared models, try to determine provider from adapters
        const sharedModel = model as SharedModel
        if (sharedModel.adapters) {
            const firstAdapter = sharedModel.adapters[0]
            const provider = firstAdapter?.split(":")[0]

            switch (provider) {
                case "i3-openai":
                case "openai":
                    return <OpenAI />
                case "i3-anthropic":
                case "anthropic":
                    return <Claude />
                case "i3-google":
                case "google":
                    return <Gemini />
                default:
                    return <Badge className="text-xs">Built-in</Badge>
            }
        }

        return <Badge className="text-xs">Built-in</Badge>
    }

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
        }
    }

    return (
        <CommandItem
            key={model.id}
            onSelect={() => {
                onModelChange(model.id)
                onClose()
            }}
            className={cn(
                "flex items-center gap-2",
                model.id === selectedModel && "bg-accent/50 text-accent-foreground"
            )}
        >
            {getProviderIcon()}
            <span className="flex items-center gap-2">
                {model.name}
                {model.id === selectedModel && <Check className="size-4" />}
            </span>
            <div className="ml-auto flex gap-2">
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
    const session = useSession()
    const userSettings = useConvexQuery(
        api.settings.getUserSettings,
        session.user?.id ? {} : "skip"
    )
    const { availableModels } = useAvailableModels(userSettings)

    const [open, setOpen] = React.useState(false)
    const selectedModelData = availableModels.find((model) => model.id === selectedModel)

    // Group models by type
    const sharedModels = availableModels.filter((model) => !("isCustom" in model))
    const customModels = availableModels.filter((model) => "isCustom" in model && model.isCustom)

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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    aria-expanded={open}
                    className={cn(
                        "gap-2 rounded-md border border-accent bg-background font-normal",
                        className
                    )}
                >
                    <span>{selectedModelData?.name}</span>
                    <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search models..." className="h-9" />
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
                                            isCustom={true}
                                        />
                                    ))}
                                </CommandGroup>
                            )}
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
