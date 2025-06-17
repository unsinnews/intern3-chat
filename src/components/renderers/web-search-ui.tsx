import { cn } from "@/lib/utils"
import type { ToolInvocation } from "ai"
import { ChevronDown, ExternalLink, Loader2, Search } from "lucide-react"
import { memo, useEffect, useRef, useState } from "react"

function getFaviconUrl(url: string): string {
    try {
        const domain = new URL(url).hostname
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
        return ""
    }
}

function getOpenGraphImage(url: string): string {
    try {
        const domain = new URL(url).hostname
        return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`
    } catch {
        return ""
    }
}

export const WebSearchToolRenderer = memo(
    ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
        const [isExpanded, setIsExpanded] = useState(false)
        const contentRef = useRef<HTMLDivElement>(null)
        const innerRef = useRef<HTMLDivElement>(null)

        if (toolInvocation.toolName !== "web_search") return null

        const isLoading = toolInvocation.state === "partial-call" || toolInvocation.state === "call"
        const hasResults = toolInvocation.state === "result" && toolInvocation.result

        useEffect(() => {
            if (!contentRef.current || !innerRef.current) return

            const observer = new ResizeObserver(() => {
                if (contentRef.current && innerRef.current && isExpanded) {
                    contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`
                }
            })

            observer.observe(innerRef.current)

            if (isExpanded) {
                contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`
            }

            return () => observer.disconnect()
        }, [isExpanded])

        return (
            <div className="w-full">
                <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 text-left"
                    onClick={() => setIsExpanded(!isExpanded)}
                    disabled={isLoading}
                >
                    <div className="flex flex-1 items-center gap-2">
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                            <Search className="size-4 text-primary" />
                        )}
                        <span className="font-medium text-primary">Web Search</span>
                        {toolInvocation.args?.query && (
                            <span className="text-muted-foreground text-sm">
                                "{toolInvocation.args.query}"
                            </span>
                        )}
                        {hasResults && (
                            <span className="text-muted-foreground text-sm">
                                • {toolInvocation.result.results.length} results
                            </span>
                        )}
                    </div>
                    {!isLoading && hasResults && (
                        <div
                            className={cn(
                                "transform transition-transform",
                                isExpanded ? "rotate-180" : ""
                            )}
                        >
                            <ChevronDown className="size-4 text-muted-foreground" />
                        </div>
                    )}
                </button>

                <div
                    ref={contentRef}
                    className={cn(
                        "overflow-hidden transition-[max-height] duration-150 ease-out",
                        "my-4 rounded-lg border bg-muted/50"
                    )}
                    style={{
                        maxHeight: isExpanded ? contentRef.current?.scrollHeight : "0px"
                    }}
                >
                    <div ref={innerRef} className="text-muted-foreground">
                        {hasResults && (
                            <div className="relative w-full">
                                <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border flex gap-4 overflow-x-auto p-4">
                                    {toolInvocation.result?.results?.map(
                                        (result: any, index: number) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={cn(
                                                    "group relative flex-shrink-0 rounded-lg border bg-card text-left",
                                                    "transition-all duration-200 hover:border-primary/20 hover:shadow-lg",
                                                    "hover:bg-accent/50",
                                                    "w-64 min-w-64 overflow-hidden"
                                                )}
                                                onClick={() =>
                                                    result.url && window.open(result.url, "_blank")
                                                }
                                                aria-label={`Open ${result.title} in new tab`}
                                            >
                                                {result.url && (
                                                    <div className="relative h-32 overflow-hidden bg-muted/30">
                                                        <img
                                                            src={getOpenGraphImage(result.url)}
                                                            alt=""
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            onError={(e) => {
                                                                const target =
                                                                    e.target as HTMLImageElement
                                                                target.style.display = "none"
                                                                const fallback =
                                                                    target.nextElementSibling as HTMLDivElement
                                                                if (fallback)
                                                                    fallback.style.display = "flex"
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                                                        <div
                                                            className="absolute inset-0 hidden items-center justify-center bg-muted/50"
                                                            style={{ display: "none" }}
                                                        >
                                                            <Search className="size-8 text-muted-foreground/50" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2 p-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-4 flex-shrink-0">
                                                                {result.url && (
                                                                    <img
                                                                        src={getFaviconUrl(
                                                                            result.url
                                                                        )}
                                                                        alt=""
                                                                        className="size-4 rounded-sm"
                                                                        onError={(e) => {
                                                                            const target =
                                                                                e.target as HTMLImageElement
                                                                            target.style.display =
                                                                                "none"
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <h1 className="m-0 flex-1 truncate font-semibold text-foreground text-sm leading-none">
                                                                {result.title}
                                                            </h1>
                                                        </div>
                                                        <p className="line-clamp-3 text-muted-foreground text-xs leading-relaxed">
                                                            {result.description || result.snippet}
                                                        </p>
                                                    </div>

                                                    {result.url && (
                                                        <div className="flex items-center gap-1.5 border-border/50 border-t pt-2">
                                                            <span className="flex-1 truncate text-muted-foreground/70 text-xs">
                                                                {
                                                                    result.url
                                                                        .replace(
                                                                            /^(https?:\/\/)/,
                                                                            ""
                                                                        )
                                                                        .split("/")[0]
                                                                }
                                                            </span>
                                                            <ExternalLink className="size-3 flex-shrink-0 text-muted-foreground/50" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }
)

WebSearchToolRenderer.displayName = "WebSearchToolRenderer"
