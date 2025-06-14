import dedent from "ts-dedent"
import type { AbilityId } from "../lib/toolkit"
export const buildPrompt = (enabledTools: AbilityId[]) => {
    const hasWebSearch = enabledTools.includes("web_search")

    // Get current UTC date in DD-MM-YYYY format
    const now = new Date()
    const utcDate = `${now.getUTCDate().toString().padStart(2, "0")}-${(now.getUTCMonth() + 1).toString().padStart(2, "0")}-${now.getUTCFullYear()}`

    const layers: string[] = [
        `You are a helpful assistant inside a chatbot called "intern3-chat".`,
        dedent`## Math/LaTeX Formatting
- Inline math: Use $$like this$$ for inline LaTeX
- Block math: Use \\[ \\] or \\( \\) for block LaTeX equations`
    ]

    if (hasWebSearch)
        layers.push(
            dedent`
## Web Search Tool
Use web search for:
- Current events or recent information
- Real-time data verification
- Technology updates beyond your training data
- When you need to confirm current facts`
        )

    layers.push(dedent`Today's date (UTC): ${utcDate}`)

    return layers.join("\n\n")
}
