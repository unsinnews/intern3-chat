import Claude from "@/assets/claude.svg"
import Gemini from "@/assets/gemini.svg"
import OpenAI from "@/assets/openai.svg"
import { buttonVariants } from "@/components/ui/button"
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
import { MODELS_SHARED, type modelSchema } from "@/convex/lib/models"
import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import * as React from "react"
import type { z } from "zod"

type Model = z.infer<typeof modelSchema>

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

    const groupedModels = Object.entries(
        MODELS_SHARED.reduce<Record<string, Model[]>>((acc, model) => {
            if (!acc[model.provider]) {
                acc[model.provider] = []
            }
            acc[model.provider].push(model)
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
                <select
                    aria-expanded={open}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "gap-2 rounded-full bg-background font-normal",
                        className
                    )}
                >
                    <span>{selectedModelData?.name}</span>
                    <ChevronDown className="ml-auto h-4 w-4" />
                </select>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search models..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No model found.</CommandEmpty>
                        <ScrollArea className="h-[300px]">
                            {groupedModels.map(([provider, providerModels]) => (
                                <CommandGroup key={provider} heading={provider}>
                                    {providerModels.map((model) => (
                                        <CommandItem
                                            key={model.id}
                                            onSelect={() => {
                                                onModelChange(model.id)
                                                setOpen(false)
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            {model.provider === "openai" && <OpenAI />}
                                            {model.provider === "anthropic" && <Claude />}
                                            {model.provider === "google" && <Gemini />}
                                            <span>{model.name}</span>
                                            {model.id === selectedModel && (
                                                <Check className="ml-auto h-4 w-4" />
                                            )}
                                        </CommandItem>
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
