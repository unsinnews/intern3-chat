import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CheckCircle, Search } from "lucide-react"
import { memo } from "react"

type SearchProvider = "firecrawl" | "brave"

type SearchProviderCardProps = {
    provider: SearchProvider
    isSelected: boolean
    onSelect: (provider: SearchProvider) => void
    title: string
    description: string
}

export const SearchProviderCard = memo(
    ({ provider, isSelected, onSelect, title, description }: SearchProviderCardProps) => {
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
