import type { ToolInvocation } from "ai"
import { ChevronDown, Loader2, Wrench } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { memo, useState } from "react"

export const GenericToolRenderer = memo(
    ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
        const [isExpanded, setIsExpanded] = useState(false)

        const isLoading = toolInvocation.state === "partial-call" || toolInvocation.state === "call"
        const hasResults = toolInvocation.state === "result" && toolInvocation.result

        return (
            <div className="w-full rounded-md border bg-background">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex h-8 w-full items-center gap-1.5 px-2 text-sm transition-colors hover:bg-muted/50"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Wrench className="size-4" />
                    )}
                    <span className="font-medium">{toolInvocation.toolName}</span>

                    {!isLoading && (
                        <ChevronDown
                            className={`ml-auto size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                    )}
                </button>

                <AnimatePresence>
                    {isExpanded && hasResults && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="scrollbar-thin max-h-64 overflow-y-auto border-t px-3 pt-1 pb-3">
                                <span className="font-medium text-muted-foreground text-xs">
                                    Arguments
                                </span>
                                <div className="flex w-full items-center gap-1 whitespace-pre-wrap rounded bg-accent px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
                                    {JSON.stringify(toolInvocation.args, null, 2)}
                                </div>

                                {toolInvocation.result && (
                                    <>
                                        <span className="font-medium text-muted-foreground text-xs">
                                            Result
                                        </span>
                                        <div className="flex w-full items-center gap-1 whitespace-pre-wrap rounded bg-accent px-1.5 py-0.5 font-medium text-muted-foreground text-xs">
                                            {JSON.stringify(toolInvocation.result, null, 2)}
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }
)

GenericToolRenderer.displayName = "GenericToolRenderer"
