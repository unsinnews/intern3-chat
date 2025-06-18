import { createServerFileRoute } from "@tanstack/react-start/server"

const POSTHOG_HOST = process.env.VITE_POSTHOG_HOST

function filterHeaders(headers: Headers): Record<string, string> {
    const filtered: Record<string, string> = {}
    for (const [key, value] of headers.entries()) {
        // Filter out headers that might cause issues when proxying
        if (key.toLowerCase() !== "host") {
            filtered[key] = value
        }
    }
    return filtered
}

export const ServerRoute = createServerFileRoute("/api/phr/$").methods({
    GET: async ({ params, request }) => {
        const url = new URL(request.url)
        const targetUrl = `${POSTHOG_HOST}${url.pathname.replace("/api/phr", "")}${url.search}`

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: filterHeaders(request.headers)
        })

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...Object.fromEntries(response.headers.entries()),
                "Content-Encoding": "",
                // Ensure CORS headers are preserved
                "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
                "Access-Control-Allow-Credentials": "true"
            }
        })
    },
    POST: async ({ params, request }) => {
        const url = new URL(request.url)
        const targetUrl = `${POSTHOG_HOST}${url.pathname.replace("/api/phr", "")}${url.search}`

        // Get the request body as an ArrayBuffer to preserve binary data
        const body = await request.arrayBuffer()

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: filterHeaders(request.headers),
            body: body
            // Note: duplex is not needed when using ArrayBuffer
        })

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...Object.fromEntries(response.headers.entries()),
                // Ensure CORS headers are preserved
                "Content-Encoding": "",
                "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
                "Access-Control-Allow-Credentials": "true"
            }
        })
    },
    OPTIONS: async ({ params, request }) => {
        const url = new URL(request.url)
        const targetUrl = `${POSTHOG_HOST}${url.pathname.replace("/api/phr", "")}${url.search}`

        const response = await fetch(targetUrl, {
            method: "OPTIONS",
            headers: filterHeaders(request.headers)
        })

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...Object.fromEntries(response.headers.entries()),
                // Ensure CORS headers are preserved
                "Content-Encoding": "",
                "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers":
                    "Content-Type, Authorization, Accept, Accept-Language, Content-Encoding"
            }
        })
    }
})
