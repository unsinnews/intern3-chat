import { memo, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  ArrowDownSquareIcon,
  ArrowsUpFromLine,
  CheckIcon,
  CopyIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCodeHighlighter } from "@/hooks/use-code-highlighter";
import { copyToClipboard } from "@/lib/utils";

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
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    disable?: {
      copy?: boolean;
      expand?: boolean;
      wrap?: boolean;
    };
    default?: {
      expand?: boolean;
      wrap?: boolean;
    };
  }) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "plaintext";

    const [isMultiLine, lineNumber] = useMemo(() => {
      const lines =
        [...(Array.isArray(children) ? children : [children])]
          .filter((x: any) => typeof x === "string")
          .join("")
          .match(/\n/g)?.length ?? 0;
      return [lines > 1, lines];
    }, [children]);

    const [didRecentlyCopied, setDidRecentlyCopied] = useState(false);
    const [expanded, setExpanded] = useState(defaultProps?.expand ?? false);
    const [wrapped, setWrapped] = useState(defaultProps?.wrap ?? false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const codeString = useMemo(() => {
      return [...(Array.isArray(children) ? children : [children])]
        .filter((x: any) => typeof x === "string")
        .join("");
    }, [children]);

    const { highlightedCode, isHighlighting } = useCodeHighlighter({
      codeString,
      language,
      expanded,
      wrapped,
      inline,
      shouldHighlight: !inline && (!!match || isMultiLine),
    });

    if (!children) return null;

    return !inline && (match || isMultiLine) ? (
      <div className="relative flex flex-col rounded-lg border border-border mt-1 mb-1">
        <div className="flex px-0.5 py-px items-center bg-muted rounded-t-lg border-b border-border">
          <span className="pl-2 font-mono text-xs text-muted-foreground">
            {language}
          </span>
          {lineNumber >= 16 && (
            <span className="pl-2 font-mono text-xs text-muted-foreground/50">
              {lineNumber + 1} lines
            </span>
          )}
          <div className="flex-grow" />
          {lineNumber >= 16 && !disable?.expand && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-[1.5rem] md:w-auto md:px-2 font-sans gap-1"
              onClick={() => setExpanded((t) => !t)}
            >
              {expanded ? (
                <>
                  <ArrowsUpFromLine className="!size-5" />
                  {isDesktop && (
                    <span className="ml-1 text-xs hidden md:inline">
                      Collapse
                    </span>
                  )}
                </>
              ) : (
                <>
                  <ArrowDownSquareIcon className="!size-5" />
                  {isDesktop && (
                    <span className="ml-1 text-xs hidden md:inline">
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
              className="text-muted-foreground h-[1.5rem] md:w-auto md:px-2 font-sans gap-1"
              onClick={() => setWrapped((t) => !t)}
            >
              <AlignLeft className="!size-5" />
              {isDesktop && (
                <span className="ml-1 text-xs hidden md:inline">Wrap</span>
              )}
            </Button>
          )}
          {!disable?.copy && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-[1.5rem] md:w-auto md:px-2 font-sans gap-1"
              onClick={() => {
                copyToClipboard(codeString);
                setDidRecentlyCopied(true);
                setTimeout(() => {
                  setDidRecentlyCopied(false);
                }, 1000);
              }}
            >
              {didRecentlyCopied ? (
                <>
                  <CheckIcon className="size-4" />
                  {isDesktop && (
                    <span className="ml-1 text-xs hidden md:inline">
                      Copied
                    </span>
                  )}
                </>
              ) : (
                <>
                  <CopyIcon className="size-4" />
                  {isDesktop && (
                    <span className="ml-1 text-xs hidden md:inline">Copy</span>
                  )}
                </>
              )}
            </Button>
          )}
        </div>

        {isHighlighting ? (
          <div className="text-wrap overflow-x-auto overflow-y-auto resize-none max-w-full text-[0.8125rem] leading-4 py-3 ps-[0.75rem] pe-[0.75rem] relative my-0 rounded-b-lg rounded-t-none bg-[#0d1117] text-[#e6edf3] animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-5/6"></div>
          </div>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            className="shiki-container pl-2 font-mono"
          />
        )}

        {!expanded && lineNumber > 17 && (
          <div className="absolute bg-gradient-to-b from-transparent to-background rounded-b-lg h-12 bottom-0 w-full flex items-end justify-center pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-muted-foreground h-[1.5rem] rounded-full gap-1.5 shadow-lg"
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
          "rounded-md px-1 py-0.5 text-sm leading-4 bg-primary/10 border border-primary/20 font-medium font-mono text-foreground/80"
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);
Codeblock.displayName = "Codeblock";
