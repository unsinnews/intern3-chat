import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { experimental_createMCPClient as createMCPClient } from "ai"
import type { CoreTool } from "ai"
import type { ToolAdapter } from "../toolkit"

// Cache for MCP clients to avoid reconnecting on every request
interface MCPClientCache {
    client: Awaited<ReturnType<typeof createMCPClient>>
    tools: Record<string, CoreTool>
}
const mcpClientsCache = new Map<string, MCPClientCache>()

export const MCPAdapter: ToolAdapter = ({ enabledTools, userSettings }) => {
    // Check if MCP is enabled
    if (!enabledTools.includes("mcp")) {
        return {}
    }

    // Get MCP servers from user settings
    const mcpServers = userSettings.mcpServers || []
    if (mcpServers.length === 0) {
        return {}
    }

    // Initialize all MCP tools synchronously by wrapping async initialization
    const tools: Record<string, CoreTool> = {}

    // Create a unique cache key for the server configuration
    const cacheKey = JSON.stringify(mcpServers)

    // Check if we already have cached clients for this configuration
    const cached = mcpClientsCache.get(cacheKey)
    if (cached) {
        return cached.tools
    }

    // For each server, create a lazy-loading tool wrapper
    for (const server of mcpServers) {
        // Create a promise that will initialize the MCP client on first use
        const clientPromise = (async () => {
            try {
                const headers = server.headers?.reduce<Record<string, string>>((acc, header) => {
                    if (header.key) acc[header.key] = header.value || ""
                    return acc
                }, {})

                // Create transport based on server type
                const transport =
                    server.type === "sse"
                        ? {
                              type: "sse" as const,
                              url: server.url,
                              headers
                          }
                        : new StreamableHTTPClientTransport(new URL(server.url), {
                              requestInit: {
                                  headers
                              }
                          })

                // Create MCP client
                const client = await createMCPClient({
                    transport,
                    name: `intern3-chat-${server.name}`
                })

                // Get tools from the client
                const mcpTools = await client.tools()

                return { client, tools: mcpTools }
            } catch (error) {
                console.error(`Failed to initialize MCP client for ${server.name}:`, error)
                return null
            }
        })()

        // Store the promise for cleanup later
        const serverTools = new Proxy(
            {},
            {
                get(target, prop) {
                    if (typeof prop !== "string") return undefined

                    // Return the tool from the MCP client
                    return async (...args: unknown[]) => {
                        const result = await clientPromise
                        if (!result) {
                            throw new Error(`MCP server ${server.name} is not available`)
                        }

                        // Get the specific tool with the server prefix
                        const toolName = `${server.name}_${prop}`
                        const tool = result.tools[toolName]
                        if (!tool) {
                            // Try without prefix as fallback
                            const unprefixedTool = result.tools[prop]
                            if (!unprefixedTool) {
                                throw new Error(
                                    `MCP tool '${prop}' not found in server ${server.name}`
                                )
                            }
                            return unprefixedTool
                        }
                        return tool
                    }
                }
            }
        )

        // Add all tools from this server to the main tools object
        // We'll need to enumerate them when the client is ready
        clientPromise.then((result) => {
            if (result) {
                for (const [toolName, tool] of Object.entries(result.tools)) {
                    // Add with server prefix to avoid conflicts
                    tools[`${server.name}_${toolName}`] = tool
                }
                // Cache the result
                if (!mcpClientsCache.has(cacheKey)) {
                    mcpClientsCache.set(cacheKey, { client: result.client, tools })
                }
            }
        })
    }

    // Return a proxy that will lazy-load tools
    return new Proxy(tools, {
        get(target, prop) {
            if (typeof prop !== "string") return undefined

            // Check if we have a cached tool
            if (prop in target) {
                return target[prop]
            }

            // Otherwise, try to find it in any server
            for (const server of mcpServers) {
                const toolName = prop.startsWith(`${server.name}_`)
                    ? prop.substring(`${server.name}_`.length)
                    : prop

                // Return a lazy-loading wrapper
                return async (...args: unknown[]) => {
                    const cached = mcpClientsCache.get(cacheKey)
                    if (cached?.tools[prop]) {
                        const tool = cached.tools[prop]
                        // CoreTool is not a function, just return it
                        return tool
                    }
                    throw new Error(`MCP tool '${prop}' not found`)
                }
            }

            return undefined
        }
    })
}

// Cleanup function to close all MCP clients
export async function cleanupMCPClients() {
    for (const [key, { client }] of mcpClientsCache.entries()) {
        try {
            await client.close()
        } catch (error) {
            console.error("Error closing MCP client:", error)
        }
    }
    mcpClientsCache.clear()
}
