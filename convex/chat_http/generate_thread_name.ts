import { GenericActionCtx } from "convex/server"
import { internalMutation } from "../_generated/server"
import { CoreMessage, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { api, internal } from "../_generated/api"
import { Id } from "../_generated/dataModel"
import { google } from "@ai-sdk/google"
import { createLanguageModel } from "../lib/models"
import { ChatError } from "@/lib/errors"

const contentToText = (content: CoreMessage["content"]): string => {
    if (typeof content === "string") {
        return content
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (part.type === "text") {
                    return part.text
                } else if (part.type === "image") {
                    return "[image]"
                } else if (part.type === "file") {
                    return `[file: ${part.filename || "unknown"}]`
                } else if (part.type === "tool-call") {
                    return `[tool: ${part.toolName}]`
                } else if (part.type === "tool-result") {
                    return `[tool result: ${part.toolName}]`
                } else if (part.type === "reasoning") {
                    return `[reasoning: ${part.text}]`
                }
                return ""
            })
            .join(" ")
    }

    return ""
}

export const generateThreadName = async (
    ctx: GenericActionCtx<any>,
    threadId: Id<"threads">,
    messages: CoreMessage[],
    userId: string
) => {
    const relevant_messages = messages.filter((message) => message.role != "system").slice(0, 5)

    const userGoogleApiKey = await ctx.runQuery(internal.apikeys.getDecryptedApiKey, {
        userId,
        provider: "google"
    })

    const modelResult = createLanguageModel("gemini-2.0-flash-lite", "google", userGoogleApiKey)
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
