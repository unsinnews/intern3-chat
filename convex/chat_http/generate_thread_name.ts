import { ChatError } from "@/lib/errors"
import { type CoreMessage, generateText } from "ai"
import type { GenericActionCtx } from "convex/server"
import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"
import { getLanguageModel, type APIKeyConfig } from "../lib/models"

const contentToText = (content: CoreMessage["content"]): string => {
    if (typeof content === "string") {
        return content
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (part.type === "text") {
                    return part.text
                }
                if (part.type === "image") {
                    return "[image]"
                }
                if (part.type === "file") {
                    return `[file: ${part.filename || "unknown"}]`
                }
                if (part.type === "tool-call") {
                    return `[tool: ${part.toolName}]`
                }
                if (part.type === "tool-result") {
                    return `[tool result: ${part.toolName}]`
                }
                if (part.type === "reasoning") {
                    return `[reasoning: ${part.text}]`
                }
                return ""
            })
            .join(" ")
    }

    return ""
}

export const generateThreadName = async (
    ctx: GenericActionCtx<DataModel>,
    threadId: Id<"threads">,
    messages: CoreMessage[],
    userId: string
) => {
    const relevant_messages = messages.filter((message) => message.role !== "system").slice(0, 5)

    const userGoogleApiKey = await ctx.runQuery(internal.apikeys.getDecryptedApiKey, {
        userId,
        provider: "google"
    })

    // Create API key configuration for the registry
    const apiKeys: APIKeyConfig = {
        google: userGoogleApiKey
    }

    const modelResult = getLanguageModel("google:gemini-2.0-flash-lite", apiKeys)
    if (modelResult instanceof ChatError) return modelResult

    const result = await generateText({
        model: modelResult,
        messages: [
            {
                role: "system",
                content: `
You are tasked with generating a concise, descriptive title for a chat conversation based on the initial messages. The title should:

1. Be 2-6 words long
2. Capture the main topic or question being discussed
3. Be clear and specific
4. Use title case (capitalize first letter of each major word)
5. Not include quotation marks or special characters
6. Be professional and appropriate

Examples of good titles:
- "Python Data Analysis Help"
- "React Component Design"
- "Travel Planning Italy"
- "Budget Spreadsheet Formula"
- "Career Change Advice"

Generate a title that accurately represents what this conversation is about based on the messages provided.`
            },
            {
                role: "user",
                content: `Here are the first 5 messages of the conversation:

${relevant_messages.map((message) => `${message.role}: ${contentToText(message.content)}`).join("\n")}

Generate a title that accurately represents what this conversation is about based on the messages provided.`
            }
        ]
    })

    await ctx.runMutation(internal.threads.updateThreadName, {
        threadId,
        name: result.text
    })

    return result.text
}
