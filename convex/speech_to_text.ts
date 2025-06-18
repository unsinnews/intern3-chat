import { httpAction } from "./_generated/server"
import { getUserIdentity } from "./lib/identity"

// Groq API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY

export const transcribeAudio = httpAction(async (ctx, request) => {
    try {
        // Verify user authentication
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) {
            console.error("Unauthorized")
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Check if API key is configured
        if (!GROQ_API_KEY || GROQ_API_KEY === "your-groq-api-key-here") {
            console.error("GROQ_API_KEY not configured. Please set environment variable.")
            return new Response(
                JSON.stringify({
                    error: "Voice input service not configured. Please contact administrator."
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        // Parse the form data
        const formData = await request.formData()
        const audioFile = formData.get("audio") as Blob

        if (!audioFile) {
            console.error("No audio file provided")
            return new Response(JSON.stringify({ error: "No audio file provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Check file size (max 25MB for free tier)
        const maxSize = 25 * 1024 * 1024 // 25MB
        if (audioFile.size > maxSize) {
            console.error("Audio file too large (max 25MB)")
            return new Response(JSON.stringify({ error: "Audio file too large (max 25MB)" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Prepare form data for Groq API
        const groqFormData = new FormData()
        groqFormData.append("file", audioFile, "audio.webm")
        groqFormData.append("model", "whisper-large-v3-turbo")
        groqFormData.append("response_format", "json")
        groqFormData.append("temperature", "0")

        // Call Groq API
        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`
            },
            body: groqFormData
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Groq API error:", response.status, errorText)

            // Handle specific error cases
            if (response.status === 401) {
                console.error("Invalid API key. Please check configuration.")
                return new Response(
                    JSON.stringify({
                        error: "Invalid API key. Please check configuration."
                    }),
                    {
                        status: 500,
                        headers: { "Content-Type": "application/json" }
                    }
                )
            }
            if (response.status === 429) {
                console.error("Rate limit exceeded. Please try again later.")
                return new Response(
                    JSON.stringify({
                        error: "Rate limit exceeded. Please try again later."
                    }),
                    {
                        status: 429,
                        headers: { "Content-Type": "application/json" }
                    }
                )
            }
            console.error("Transcription service temporarily unavailable")
            return new Response(
                JSON.stringify({
                    error: "Transcription service temporarily unavailable"
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        const transcriptionResult = await response.json()

        return new Response(
            JSON.stringify({
                text: transcriptionResult.text
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        )
    } catch (error) {
        console.error("Speech-to-text error:", error)
        return new Response(JSON.stringify({ error: `Internal server error: ${error}` }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
})
