import { useState, useEffect } from "react";
import { createHighlighter, type Highlighter } from "shiki";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/lib/editor-store";

// Create a singleton highlighter instance
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

const getHighlighter = async (): Promise<Highlighter> => {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "python",
      "java",
      "c",
      "cpp",
      "csharp",
      "php",
      "ruby",
      "go",
      "rust",
      "swift",
      "kotlin",
      "scala",
      "html",
      "css",
      "scss",
      "sass",
      "json",
      "xml",
      "yaml",
      "markdown",
      "bash",
      "shell",
      "sql",
      "dockerfile",
      "nginx",
      "apache",
      "plaintext",
    ],
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
};

interface UseCodeHighlighterOptions {
  codeString: string;
  language: string;
  expanded: boolean;
  wrapped: boolean;
  inline?: boolean;
  shouldHighlight?: boolean;
}

export const useCodeHighlighter = ({
  codeString,
  language,
  expanded,
  wrapped,
  inline = false,
  shouldHighlight = true,
}: UseCodeHighlighterOptions) => {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isHighlighting, setIsHighlighting] = useState(true);
  const { themeState } = useEditorStore();

  useEffect(() => {
    const highlightCode = async () => {
      if (!shouldHighlight || inline || !codeString) {
        setIsHighlighting(false);
        return;
      }

      try {
        setIsHighlighting(true);
        const highlighter = await getHighlighter();

        // Check if the language is supported, fallback to plaintext if not
        const supportedLangs = highlighter.getLoadedLanguages();
        const langToUse = supportedLangs.includes(language)
          ? language
          : "plaintext";

        const highlighted = highlighter.codeToHtml(codeString, {
          lang: langToUse,
          theme:
            themeState.currentMode === "dark" ? "github-dark" : "github-light",
          transformers: [
            {
              pre(node) {
                // Remove default styling to use our custom styles
                delete node.properties.style;
                node.properties.class = cn(
                  "text-wrap overflow-x-auto overflow-y-auto resize-none max-w-full text-[0.8125rem] leading-4 py-3 ps-[0.75rem] pe-[0.75rem] relative my-0 rounded-b-lg rounded-t-none bg-[#0d1117] text-[#e6edf3]",
                  !expanded && "max-h-72"
                );
              },
              code(node) {
                node.properties.class = cn(
                  wrapped
                    ? "whitespace-pre-wrap break-words"
                    : "whitespace-pre break-keep"
                );
              },
            },
          ],
        });

        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain text if highlighting fails
        setHighlightedCode(`<pre><code>${codeString}</code></pre>`);
      } finally {
        setIsHighlighting(false);
      }
    };

    highlightCode();
  }, [
    codeString,
    language,
    expanded,
    wrapped,
    inline,
    shouldHighlight,
    themeState.currentMode,
  ]);

  return {
    highlightedCode,
    isHighlighting,
  };
};
