import Claude from "@/assets/claude.svg"
import Gemini from "@/assets/gemini.svg"
import OpenAI from "@/assets/openai.svg"
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
import { MODELS_SHARED, type SharedModel } from "@/convex/lib/models"
import type { Provider } from "@/convex/schema/apikey"
import { cn } from "@/lib/utils"
import { Brain, Check, ChevronDown, Eye, Globe } from "lucide-react"
import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface ModelItemProps {
    model: SharedModel
    selectedModel: string
    onModelChange: (modelId: string) => void
    onClose: () => void
}

const ModelItem = React.memo(function ModelItem({
    model,
    selectedModel,
    onModelChange,
    onClose
}: ModelItemProps) {
    const provider = model.id.split(":")[0] as Provider
    const providerIcon = (provider: Provider) => {
        switch (provider) {
            case "openai":
                return <OpenAI />
            case "anthropic":
                return <Claude />
            case "google":
                return <Gemini />
        }
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
            {providerIcon(provider)}
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
    const [open, setOpen] = React.useState(false)
    const selectedModelData = MODELS_SHARED.find((model) => model.id === selectedModel)

    const providerTitle = (provider: Provider) => {
        switch (provider) {
            case "openai":
                return "OpenAI"
            case "anthropic":
                return "Anthropic"
            case "google":
                return "Google"
        }
    }

    const groupedModels = Object.entries(
        MODELS_SHARED.reduce<Record<string, SharedModel[]>>((acc, model) => {
            const provider = model.id.split(":")[0]
            if (!acc[provider]) {
                acc[provider] = []
            }
            acc[provider].push(model)
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
                        "gap-2 rounded-full border border-accent bg-background font-normal",
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
                            {groupedModels.map(([provider, providerModels]) => (
                                <CommandGroup
                                    key={provider}
                                    heading={providerTitle(provider as Provider)}
                                >
                                    {providerModels.map((model) => (
                                        <ModelItem
                                            key={model.id}
                                            model={model}
                                            selectedModel={selectedModel}
                                            onModelChange={onModelChange}
                                            onClose={() => setOpen(false)}
                                        />
                                    ))}
                                </CommandGroup>
                            ))}
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
