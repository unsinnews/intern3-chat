import { Button } from "@/components/ui/button"
import { useCodeHighlighter } from "@/hooks/use-code-highlighter"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/lib/utils"
import { AlignLeft, ArrowDownSquareIcon, ArrowsUpFromLine, CheckIcon, CopyIcon } from "lucide-react"
import { memo, useMemo, useState } from "react"

export const Codeblock = memo(
    ({
        node,
        inline,
        className,
        children,
        disable,
        default: defaultProps,
        ...props
    }: {
        node?: any
        inline?: boolean
        className?: string
        children?: React.ReactNode
        disable?: {
            copy?: boolean
            expand?: boolean
            wrap?: boolean
        }
        default?: {
            expand?: boolean
            wrap?: boolean
        }
    }) => {
        const match = /language-(\w+)/.exec(className || "")
        const language = match ? match[1] : "plaintext"

        const [isMultiLine, lineNumber] = useMemo(() => {
            const lines =
                [...(Array.isArray(children) ? children : [children])]
                    .filter((x: any) => typeof x === "string")
                    .join("")
                    .match(/\n/g)?.length ?? 0
            return [lines > 1, lines]
        }, [children])

        const [didRecentlyCopied, setDidRecentlyCopied] = useState(false)
        const [expanded, setExpanded] = useState(defaultProps?.expand ?? false)
        const [wrapped, setWrapped] = useState(defaultProps?.wrap ?? false)
        const isDesktop = useMediaQuery("(min-width: 768px)")

        const codeString = useMemo(() => {
            return [...(Array.isArray(children) ? children : [children])]
                .filter((x: any) => typeof x === "string")
                .join("")
        }, [children])

        const { highlightedCode, isHighlighting } = useCodeHighlighter({
            codeString,
            language,
            expanded,
            wrapped,
            inline,
            shouldHighlight: !inline && (!!match || isMultiLine)
        })

        if (!children) return null

        return !inline && (match || isMultiLine) ? (
            <div className="relative mt-1 mb-1 flex flex-col rounded-lg border border-border">
                <div className="flex items-center rounded-t-lg border-border border-b bg-muted px-0.5 py-px">
                    <span className="pl-2 font-mono text-muted-foreground text-xs">{language}</span>
                    {lineNumber >= 16 && (
                        <span className="pl-2 font-mono text-muted-foreground/50 text-xs">
                            {lineNumber + 1} lines
                        </span>
                    )}
                    <div className="flex-grow" />
                    {lineNumber >= 16 && !disable?.expand && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-[1.5rem] gap-1 font-sans text-muted-foreground md:w-auto md:px-2"
                            onClick={() => setExpanded((t) => !t)}
                        >
                            {expanded ? (
                                <>
                                    <ArrowsUpFromLine className="!size-5" />
                                    {isDesktop && (
                                        <span className="ml-1 hidden text-xs md:inline">
                                            Collapse
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <ArrowDownSquareIcon className="!size-5" />
                                    {isDesktop && (
                                        <span className="ml-1 hidden text-xs md:inline">
                                            Expand
                                        </span>
                                    )}
                                </>
                            )}
                        </Button>
                    )}
                    {!disable?.wrap && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-[1.5rem] gap-1 font-sans text-muted-foreground md:w-auto md:px-2"
                            onClick={() => setWrapped((t) => !t)}
                        >
                            <AlignLeft className="!size-5" />
                            {isDesktop && (
                                <span className="ml-1 hidden text-xs md:inline">Wrap</span>
                            )}
                        </Button>
                    )}
                    {!disable?.copy && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-[1.5rem] gap-1 font-sans text-muted-foreground md:w-auto md:px-2"
                            onClick={() => {
                                copyToClipboard(codeString)
                                setDidRecentlyCopied(true)
                                setTimeout(() => {
                                    setDidRecentlyCopied(false)
                                }, 1000)
                            }}
                        >
                            {didRecentlyCopied ? (
                                <>
                                    <CheckIcon className="size-4" />
                                    {isDesktop && (
                                        <span className="ml-1 hidden text-xs md:inline">
                                            Copied
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="size-4" />
                                    {isDesktop && (
                                        <span className="ml-1 hidden text-xs md:inline">Copy</span>
                                    )}
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {isHighlighting ? (
                    <div className="relative my-0 max-w-full animate-pulse resize-none overflow-x-auto overflow-y-auto text-wrap rounded-t-none rounded-b-lg bg-[#0d1117] py-3 ps-[0.75rem] pe-[0.75rem] text-[#e6edf3] text-[0.8125rem] leading-4">
                        <div className="mb-2 h-4 w-3/4 rounded bg-gray-600" />
                        <div className="mb-2 h-4 w-1/2 rounded bg-gray-600" />
                        <div className="h-4 w-5/6 rounded bg-gray-600" />
                    </div>
                ) : (
                    <div
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki!!
                        dangerouslySetInnerHTML={{ __html: highlightedCode }}
                        className="shiki-container pl-2 font-mono"
                    />
                )}

                {!expanded && lineNumber > 17 && (
                    <div className="absolute bottom-0 flex h-12 w-full items-end justify-center rounded-b-lg bg-gradient-to-b from-transparent to-background pb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpanded(true)}
                            className="h-[1.5rem] gap-1.5 rounded-full text-muted-foreground shadow-lg"
                        >
                            {lineNumber - 17} more lines
                            <ArrowDownSquareIcon />
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <code
                className={cn(
                    className,
                    "rounded-md border border-primary/20 bg-primary/10 px-1 py-0.5 font-medium font-mono text-foreground/80 text-sm leading-4"
                )}
                {...props}
            >
                {children}
            </code>
        )
    }
)
Codeblock.displayName = "Codeblock"
