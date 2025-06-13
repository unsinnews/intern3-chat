import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Copy, RotateCcw, Edit3, Check } from "lucide-react";
import { memo, useState } from "react";
import { cn, copyToClipboard } from "@/lib/utils";
import type { UIMessage } from "ai";

export const ChatActions = memo(
  ({
    role,
    message,
    onRetry,
    onEdit,
  }: {
    role: UIMessage["role"];
    message: UIMessage;
    onRetry?: (message: UIMessage) => void;
    onEdit?: (message: UIMessage) => void;
  }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      const textContent = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");

      await copyToClipboard(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    return (
      <div
        className={cn(
          "absolute mt-3 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100 group-hover:visible group-focus:visible group-hover:z-10 group-focus:z-10",
          role === "user" ? "right-0" : "left-0"
        )}
      >
        {onRetry && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent text-primary"
                onClick={() => onRetry(message)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Retry</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onEdit && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent text-primary"
                onClick={() => onEdit(message)}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent text-primary"
              onClick={handleCopy}
            >
              <div className="relative">
                <Copy
                  className={`h-3.5 w-3.5 transition-all duration-200 ${
                    copied ? "opacity-0 scale-75" : "opacity-100 scale-100"
                  }`}
                />
                <Check
                  className={`h-3.5 w-3.5 absolute inset-0 transition-all duration-200 text-primary ${
                    copied ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  }`}
                />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {copied ? "Copied!" : "Copy"}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
);

ChatActions.displayName = "ChatActions";
