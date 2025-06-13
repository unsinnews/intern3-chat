import type { ToolInvocation } from "ai";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Search, ChevronDown, ExternalLink } from "lucide-react";
import { useState, memo } from "react";

export const WebSearchToolRenderer = memo(
  ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (toolInvocation.toolName !== "web_search") return null;

    const isLoading =
      toolInvocation.state === "partial-call" ||
      toolInvocation.state === "call";
    const hasResults =
      toolInvocation.state === "result" && toolInvocation.result;

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
            <Search className="size-4" />
          )}
          <span className="font-medium">Web Search</span>
          {toolInvocation.state === "result" && (
            <span className="text-xs text-muted-foreground">
              {toolInvocation.result.results.length} results
            </span>
          )}
          {!isLoading && (
            <ChevronDown
              className={`size-4 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
              <div className="border-t p-3 space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                <div className="text-xs text-muted-foreground font-medium bg-accent w-fit px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Search className="size-3.5" />
                  {toolInvocation.args?.query}
                </div>

                {toolInvocation.result?.results && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-foreground">
                      Results ({toolInvocation.result.results.length})
                    </div>
                    {toolInvocation.result.results.map(
                      (result: any, index: number) => (
                        <div
                          key={index}
                          className="rounded border bg-muted/30 p-2"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.title}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {result.description || result.snippet}
                              </div>
                              {result.url && (
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-muted-foreground/70 hover:text-accent-foreground text-xs"
                                >
                                  <span className="truncate">
                                    {result.url
                                      .replace(/^(https?:\/\/)/, "")
                                      .split("/")
                                      .filter(Boolean)
                                      .join("/")}
                                  </span>
                                  <ExternalLink className="size-3 flex-shrink-0" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

WebSearchToolRenderer.displayName = "WebSearchToolRenderer";
