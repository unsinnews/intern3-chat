import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { Provider } from "@/convex/schema/apikey"
import { useSession } from "@/hooks/auth-hooks"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/settings/apikeys")({
    component: ApiKeysSettings
})

const PROVIDERS: {
    id: Provider
    name: string
    description: string
    placeholder: string
}[] = [
    {
        id: "openai",
        name: "OpenAI",
        description: "Access GPT-4 and other OpenAI models",
        placeholder: "sk-..."
    },
    {
        id: "anthropic",
        name: "Anthropic",
        description: "Access Claude and other Anthropic models",
        placeholder: "sk-ant-..."
    },
    {
        id: "google",
        name: "Google",
        description: "Access Gemini and other Google AI models",
        placeholder: "AIza..."
    }
]

function ApiKeysSettings() {
    const [newKey, setNewKey] = useState<{ provider: Provider; key: string }>({
        provider: "openai",
        key: ""
    })
    const [addingKey, setAddingKey] = useState<Provider | null>(null)
    const [loading, setLoading] = useState(false)

    const session = useSession()
    const apiKeys = useQuery(api.apikeys.listApiKeys, session.user?.id ? {} : "skip") ?? []
    const storeApiKey = useMutation(api.apikeys.storeApiKey)
    const deleteApiKey = useMutation(api.apikeys.deleteApiKey)

    if (!session.user?.id) {
        return (
            <SettingsLayout
                title="API Keys"
                description="Manage your API keys for different AI providers. Keys are encrypted and stored securely."
            >
                <p className="text-muted-foreground text-sm">Sign in to manage your API keys.</p>
            </SettingsLayout>
        )
    }

    const handleAddKey = async () => {
        if (!newKey.key.trim()) {
            toast.error("Please enter a valid API key")
            return
        }

        setLoading(true)

        try {
            await storeApiKey({
                provider: newKey.provider,
                apiKey: newKey.key
            })

            setNewKey({ provider: newKey.provider, key: "" })
            setAddingKey(null)

            toast.success(
                `Your ${PROVIDERS.find((p) => p.id === newKey.provider)?.name} API key has been securely stored.`
            )
        } catch (error) {
            toast.error("Failed to add API key. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteKey = async (keyId: Id<"apiKeys">) => {
        try {
            await deleteApiKey({ keyId })
            toast.success("The API key has been removed from your account.")
        } catch (error) {
            toast.error("Failed to delete API key. Please try again.")
        }
    }

    const formatDate = (dateString: string | number) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
    }

    if ("error" in apiKeys) {
        return (
            <SettingsLayout
                title="API Keys"
                description="Manage your API keys for different AI providers. Keys are encrypted and stored securely."
            >
                <p className="text-muted-foreground text-sm">Error loading API keys.</p>
            </SettingsLayout>
        )
    }

    return (
        <SettingsLayout
            title="API Keys"
            description="Manage your API keys for different AI providers. Keys are encrypted and stored securely."
        >
            <div className="space-y-6">
                {/* Provider Cards */}
                <div className="space-y-4">
                    {PROVIDERS.map((provider) => {
                        const existingKey = apiKeys.find((k) => k.provider === provider.id)
                        const isAdding = addingKey === provider.id

                        return (
                            <Card key={provider.id} className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {provider.name}
                                            </h3>
                                            <p className="mt-1 text-muted-foreground text-sm">
                                                {provider.description}
                                            </p>
                                            {existingKey && (
                                                <p className="mt-2 text-muted-foreground text-xs">
                                                    Added {formatDate(existingKey.createdAt)}
                                                </p>
                                            )}
                                        </div>

                                        {existingKey && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="text-muted-foreground text-xs">
                                                    Active
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {existingKey && !isAdding && (
                                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                            <code className="flex-1 font-mono text-muted-foreground text-sm">
                                                {provider.placeholder}
                                                {"•".repeat(32)}
                                            </code>
                                        </div>
                                    )}

                                    {isAdding && (
                                        <div className="space-y-3">
                                            <div>
                                                <label
                                                    htmlFor={`api-key-${provider.id}`}
                                                    className="mb-2 block font-medium text-foreground text-sm"
                                                >
                                                    API Key
                                                </label>
                                                <Input
                                                    id={`api-key-${provider.id}`}
                                                    type="password"
                                                    value={newKey.key}
                                                    onChange={(e) =>
                                                        setNewKey((prev) => ({
                                                            ...prev,
                                                            key: e.target.value
                                                        }))
                                                    }
                                                    placeholder={provider.placeholder}
                                                    className="font-mono"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleAddKey}
                                                    disabled={!newKey.key.trim() || loading}
                                                    size="sm"
                                                >
                                                    {loading ? "Adding..." : "Save Key"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setAddingKey(null)
                                                        setNewKey({ provider: "openai", key: "" })
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {existingKey && !isAdding && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteKey(existingKey.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        )}
                                        {!existingKey && !isAdding && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setAddingKey(provider.id)
                                                    setNewKey({ provider: provider.id, key: "" })
                                                }}
                                                disabled={isAdding}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Key
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </SettingsLayout>
    )
}
