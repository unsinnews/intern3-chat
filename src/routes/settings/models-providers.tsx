import Claude from "@/assets/claude.svg"
import Google from "@/assets/gemini.svg"
import OpenAI from "@/assets/openai.svg"
import OpenRouter from "@/assets/openrouter.svg"
import { SettingsLayout } from "@/components/settings/settings-layout"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import {
    type CoreProvider,
    CoreProviders,
    MODELS_SHARED,
    type SharedModel
} from "@/convex/lib/models"
import type { ModelAbility, UserSettings } from "@/convex/schema/settings"
import { useSession } from "@/hooks/auth-hooks"
import { cn } from "@/lib/utils"
import Logo from "@/logo.svg"
import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import type { Infer } from "convex/values"
import {
    AlertCircle,
    Bot,
    Brain,
    Check,
    Code,
    Eye,
    File,
    Key,
    Plus,
    RotateCcw,
    Settings2,
    SquarePen,
    Trash2,
    X
} from "lucide-react"
import { memo, useState } from "react"
import { toast } from "sonner"

export type DisplayModel =
    | SharedModel
    | {
          id: string
          name: string
          abilities: ModelAbility[]
          isCustom: true
          providerId: string
          mode?: "text" | "image"
      }

export function useAvailableModels(userSettings: Infer<typeof UserSettings> | undefined) {
    const currentProviders = {
        core: userSettings?.coreAIProviders || {},
        custom: userSettings?.customAIProviders || {}
    }

    const availableModels: DisplayModel[] = []
    const unavailableModels: DisplayModel[] = []

    // Add shared models
    MODELS_SHARED.forEach((model) => {
        const hasProvider = model.adapters.some((adapter) => {
            const providerId = adapter.split(":")[0]
            if (providerId.startsWith("i3-")) return true
            if (providerId === "openrouter") return currentProviders.core.openrouter?.enabled
            return currentProviders.core[providerId as CoreProvider]?.enabled
        })

        if (hasProvider) {
            availableModels.push(model)
        } else {
            unavailableModels.push(model)
        }
    })

    // Add custom models
    Object.entries(userSettings?.customModels || {}).forEach(([id, customModel]) => {
        if (!customModel.enabled) return

        const hasProvider =
            currentProviders.core[customModel.providerId]?.enabled ||
            currentProviders.custom[customModel.providerId]?.enabled

        const modelData = {
            id,
            name: customModel.name || customModel.modelId,
            abilities: customModel.abilities,
            isCustom: true as const,
            providerId: customModel.providerId
        }

        if (hasProvider) {
            availableModels.push(modelData)
        } else {
            unavailableModels.push(modelData)
        }
    })

    return { availableModels, unavailableModels, currentProviders }
}

export const Route = createFileRoute("/settings/models-providers")({
    component: ModelsProvidersSettings
})

type CoreProviderInfo = {
    id: CoreProvider | "openrouter"
    name: string
    description: string
    placeholder: string
    icon: React.ComponentType<{ className?: string }> | string
}

const CORE_PROVIDERS: CoreProviderInfo[] = [
    {
        id: "openrouter",
        name: "OpenRouter",
        description: "Access a wide variety of models through OpenRouter",
        placeholder: "sk-or-...",
        icon: OpenRouter
    },
    {
        id: "openai",
        name: "OpenAI",
        description: "Access GPT-4, GPT-4o, o3, and other OpenAI models",
        placeholder: "sk-...",
        icon: OpenAI
    },
    {
        id: "anthropic",
        name: "Anthropic",
        description: "Access Claude Sonnet, Opus, and other Anthropic models",
        placeholder: "sk-ant-...",
        icon: Claude
    },
    {
        id: "google",
        name: "Google",
        description: "Access Gemini 2.5, 2.0 Flash and other Google AI models",
        placeholder: "AIza...",
        icon: Google
    }
]

const getAbilityIcon = (ability: ModelAbility) => {
    switch (ability) {
        case "vision":
            return Eye
        case "reasoning":
            return Brain
        case "function_calling":
            return Code
        case "pdf":
            return File
        default:
            return Key
    }
}

const getAbilityLabel = (ability: ModelAbility) => {
    switch (ability) {
        case "function_calling":
            return "Function Calling"
        case "vision":
            return "Vision"
        case "reasoning":
            return "Reasoning"
        case "pdf":
            return "PDF"
        default:
            return ability
    }
}

type ProviderCardProps = {
    provider: CoreProviderInfo
    currentProvider?: { enabled: boolean; encryptedKey: string }
    onSave: (providerId: string, enabled: boolean, newKey?: string) => Promise<void>
    loading: boolean
}

const ProviderCard = memo(({ provider, currentProvider, onSave, loading }: ProviderCardProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [enabled, setEnabled] = useState(currentProvider?.enabled || false)
    const [newKey, setNewKey] = useState("")
    const [rotatingKey, setRotatingKey] = useState(false)

    const hasExistingKey = Boolean(currentProvider?.encryptedKey)
    const canSave = enabled ? (hasExistingKey && !rotatingKey) || newKey.trim() : true

    const handleSave = async () => {
        try {
            await onSave(provider.id, enabled, rotatingKey || !hasExistingKey ? newKey : undefined)
            setIsEditing(false)
            setNewKey("")
            setRotatingKey(false)
        } catch (error) {
            // Error handled in parent
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEnabled(currentProvider?.enabled || false)
        setNewKey("")
        setRotatingKey(false)
    }

    const Icon = provider.icon
    const isEnabled = currentProvider?.enabled || false

    return (
        <Card className="p-4 shadow-xs">
            <div className="flex items-start gap-2 space-y-4">
                <div className="flex size-8 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                </div>
                <div className="flex-1">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-start gap-2">
                            <div>
                                <h4 className="font-semibold text-sm">{provider.name}</h4>
                                <p className="mt-0.5 text-muted-foreground text-xs">
                                    {provider.description}
                                </p>
                            </div>
                        </div>

                        {isEnabled && (
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-muted-foreground text-xs">Active</span>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`${provider.id}-enabled`}
                                    checked={enabled}
                                    onCheckedChange={setEnabled}
                                />
                                <Label htmlFor={`${provider.id}-enabled`}>
                                    Enable {provider.name}
                                </Label>
                            </div>

                            {enabled && (
                                <div className="space-y-3">
                                    {hasExistingKey && (
                                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                            <div className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-green-600" />
                                                <span className="text-sm">API key configured</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRotatingKey(!rotatingKey)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                {rotatingKey ? "Keep existing" : "Rotate key"}
                                            </Button>
                                        </div>
                                    )}

                                    {(!hasExistingKey || rotatingKey) && (
                                        <div className="space-y-2">
                                            <Label htmlFor={`${provider.id}-key`}>
                                                {rotatingKey ? "New API Key" : "API Key"}
                                            </Label>
                                            <Input
                                                id={`${provider.id}-key`}
                                                type="password"
                                                value={newKey}
                                                onChange={(e) => setNewKey(e.target.value)}
                                                placeholder={provider.placeholder}
                                                className="font-mono"
                                            />
                                            {rotatingKey && (
                                                <p className="text-muted-foreground text-xs">
                                                    Leave empty to keep existing key
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {enabled && !hasExistingKey && !newKey.trim() && (
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="text-sm">
                                                API key required to enable provider
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={loading || !canSave}
                                    size="sm"
                                >
                                    <Check className="h-4 w-4" />
                                    {loading ? "Saving..." : "Save"}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            {isEnabled ? (
                                <SquarePen className="size-4" />
                            ) : (
                                <Settings2 className="size-4" />
                            )}
                            {isEnabled ? "Edit" : "Setup BYOK"}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
})

type ModelCardProps = {
    model: DisplayModel
    currentProviders: {
        core: Record<string, { enabled: boolean; encryptedKey: string }>
        custom: Record<
            string,
            { name: string; enabled: boolean; endpoint: string; encryptedKey: string }
        >
    }
    onEdit?: (modelId: string) => void
    onDelete?: (modelId: string) => void
}

const ModelCard = memo(({ model, currentProviders, onEdit, onDelete }: ModelCardProps) => {
    // Determine the active provider following priority: BYOK Core > Custom > OpenRouter > i3-internal
    const getActiveProvider = () => {
        // Handle custom models differently - they have a direct providerId reference
        if ("isCustom" in model && model.isCustom) {
            const providerId = model.providerId

            // Check if it's a core provider
            if (currentProviders.core[providerId]?.enabled) {
                const provider = CORE_PROVIDERS.find((p) => p.id === providerId)
                return { name: `${provider?.name} BYOK`, available: true }
            }

            // Check if it's a custom provider
            if (currentProviders.custom[providerId]?.enabled) {
                return { name: currentProviders.custom[providerId].name, available: true }
            }

            return { name: "Provider not found", available: false }
        }

        // Handle shared models with adapters
        const sharedModel = model as SharedModel

        // Check BYOK core providers first
        for (const adapter of sharedModel.adapters) {
            const providerId = adapter.split(":")[0]
            if (
                CoreProviders.includes(providerId as CoreProvider) &&
                currentProviders.core[providerId]?.enabled
            ) {
                const provider = CORE_PROVIDERS.find((p) => p.id === providerId)
                return { name: `${provider?.name} BYOK`, available: true }
            }
        }

        // Check OpenRouter
        for (const adapter of sharedModel.adapters) {
            const providerId = adapter.split(":")[0]
            if (providerId === "openrouter" && currentProviders.core.openrouter?.enabled) {
                return { name: "OpenRouter", available: true }
            }
        }

        // Check i3-internal (always available)
        for (const adapter of sharedModel.adapters) {
            const providerId = adapter.split(":")[0]
            if (providerId.startsWith("i3-")) {
                return { name: "Built-in", available: true }
            }
        }

        return { name: "No provider configured", available: false }
    }

    const activeProvider = getActiveProvider()

    const isCustomModel = "isCustom" in model && model.isCustom

    return (
        <Card
            className={cn(
                "px-4 py-3 shadow-xs",
                !activeProvider.available && "bg-muted/20 opacity-50"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{model.name}</h4>
                        {isCustomModel && (
                            <Badge variant="outline" className="text-xs">
                                Custom
                            </Badge>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.75">
                        {model.abilities.map((ability) => {
                            const Icon = getAbilityIcon(ability)
                            return (
                                <Badge
                                    key={ability}
                                    variant="secondary"
                                    className="gap-1.5 px-1.5 text-xs"
                                >
                                    <Icon className="size-3" />
                                    {getAbilityLabel(ability)}
                                </Badge>
                            )
                        })}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p
                            className={cn(
                                "text-xs",
                                activeProvider.available
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            {activeProvider.name}
                        </p>
                    </div>
                    {isCustomModel && onEdit && onDelete && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(model.id)}
                                className="h-7 w-7 p-0"
                            >
                                <SquarePen className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Custom Model</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete "{model.name}"? This
                                            action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(model.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
})

type CustomProviderCardProps = {
    providerId: string
    provider: { name: string; enabled: boolean; endpoint: string; encryptedKey: string }
    onSave: (
        providerId: string,
        data: { name: string; enabled: boolean; endpoint: string; newKey?: string }
    ) => Promise<void>
    loading: boolean
}

const CustomProviderCard = memo(
    ({ providerId, provider, onSave, loading }: CustomProviderCardProps) => {
        const [isEditing, setIsEditing] = useState(false)
        const [formData, setFormData] = useState({
            name: provider.name,
            enabled: provider.enabled,
            endpoint: provider.endpoint,
            newKey: ""
        })
        const [rotatingKey, setRotatingKey] = useState(false)

        const hasExistingKey = Boolean(provider.encryptedKey)
        const canSave = formData.enabled
            ? (hasExistingKey && !rotatingKey) || formData.newKey.trim()
            : true

        const handleSave = async () => {
            try {
                await onSave(providerId, {
                    name: formData.name,
                    enabled: formData.enabled,
                    endpoint: formData.endpoint,
                    newKey: rotatingKey || !hasExistingKey ? formData.newKey : undefined
                })
                setIsEditing(false)
                setFormData((prev) => ({ ...prev, newKey: "" }))
                setRotatingKey(false)
            } catch (error) {
                // Error handled in parent
            }
        }

        const handleCancel = () => {
            setIsEditing(false)
            setFormData({
                name: provider.name,
                enabled: provider.enabled,
                endpoint: provider.endpoint,
                newKey: ""
            })
            setRotatingKey(false)
        }

        return (
            <Card className="p-4 shadow-xs">
                <div className="flex items-start gap-2 space-y-4">
                    <div className="flex size-8 items-center justify-center rounded-lg">
                        <Bot className="size-5" />
                    </div>
                    <div className="flex-1">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div>
                                    <h4 className="font-semibold text-sm">{provider.name}</h4>
                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                        Custom OpenAI-compatible provider
                                    </p>
                                    <p className="mt-0.5 font-mono text-muted-foreground text-xs">
                                        {provider.endpoint}
                                    </p>
                                </div>
                            </div>

                            {provider.enabled && (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground text-xs">Active</span>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`${providerId}-enabled`}
                                        checked={formData.enabled}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, enabled: checked }))
                                        }
                                    />
                                    <Label htmlFor={`${providerId}-enabled`}>
                                        Enable {provider.name}
                                    </Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`${providerId}-name`}>Provider Name</Label>
                                        <Input
                                            id={`${providerId}-name`}
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }))
                                            }
                                            placeholder="My Custom Provider"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`${providerId}-endpoint`}>Base URL</Label>
                                        <Input
                                            id={`${providerId}-endpoint`}
                                            value={formData.endpoint}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    endpoint: e.target.value
                                                }))
                                            }
                                            placeholder="https://api.example.com/v1"
                                        />
                                    </div>
                                </div>

                                {formData.enabled && (
                                    <div className="space-y-3">
                                        {hasExistingKey && (
                                            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <Key className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm">
                                                        API key configured
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setRotatingKey(!rotatingKey)}
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                    {rotatingKey ? "Keep existing" : "Rotate key"}
                                                </Button>
                                            </div>
                                        )}

                                        {(!hasExistingKey || rotatingKey) && (
                                            <div className="space-y-2">
                                                <Label htmlFor={`${providerId}-key`}>
                                                    {rotatingKey ? "New API Key" : "API Key"}
                                                </Label>
                                                <Input
                                                    id={`${providerId}-key`}
                                                    type="password"
                                                    value={formData.newKey}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            newKey: e.target.value
                                                        }))
                                                    }
                                                    placeholder="sk-..."
                                                    className="font-mono"
                                                />
                                                {rotatingKey && (
                                                    <p className="text-muted-foreground text-xs">
                                                        Leave empty to keep existing key
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {formData.enabled &&
                                            !hasExistingKey &&
                                            !formData.newKey.trim() && (
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        API key required to enable provider
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={
                                            loading ||
                                            !canSave ||
                                            !formData.name.trim() ||
                                            !formData.endpoint.trim()
                                        }
                                        size="sm"
                                    >
                                        <Check className="h-4 w-4" />
                                        {loading ? "Saving..." : "Save"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <SquarePen className="h-4 w-4" />
                                {provider.enabled ? "Edit" : "Configure"}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        )
    }
)

type CustomModelFormData = {
    name: string
    modelId: string
    providerId: string
    contextLength: number
    maxTokens: number
    abilities: ModelAbility[]
    enabled: boolean
}

function ModelsProvidersSettings() {
    const session = useSession()
    const userSettings = useConvexQuery(
        api.settings.getUserSettings,
        session.user?.id ? {} : "skip"
    )
    const updateSettings = useMutation(api.settings.updateUserSettings)

    const [loading, setLoading] = useState(false)
    const [addingCustomModel, setAddingCustomModel] = useState(false)
    const [addingCustomProvider, setAddingCustomProvider] = useState(false)
    const [editingCustomModel, setEditingCustomModel] = useState<string | null>(null)
    const [customModelForm, setCustomModelForm] = useState<CustomModelFormData>({
        name: "",
        modelId: "",
        providerId: "",
        contextLength: 4096,
        maxTokens: 1024,
        abilities: [],
        enabled: true
    })
    const [customProviderForm, setCustomProviderForm] = useState({
        name: "",
        endpoint: "",
        enabled: true,
        key: ""
    })

    const handleSaveProvider = async (providerId: string, enabled: boolean, newKey?: string) => {
        if (!session.user?.id) return

        setLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}

            // Copy all existing core providers
            for (const [id, provider] of Object.entries(currentProviders.core)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                    // Don't include newKey for existing providers unless it's the one being updated
                }
            }

            // Update the specific provider being saved
            coreProviders[providerId] = {
                enabled,
                newKey
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(currentProviders.custom)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                    // Don't include newKey for existing providers
                }
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings?.searchProvider || "firecrawl",
                    searchIncludeSourcesByDefault:
                        userSettings?.searchIncludeSourcesByDefault || false,
                    customModels: userSettings?.customModels || {},
                    titleGenerationModel:
                        userSettings?.titleGenerationModel || "gemini-2.0-flash-lite"
                },
                coreProviders,
                customProviders
            })

            toast.success(
                `${CORE_PROVIDERS.find((p) => p.id === providerId)?.name} provider updated`
            )
        } catch (error) {
            toast.error("Failed to save provider settings")
            console.error(error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleSaveCustomProvider = async (
        providerId: string,
        data: { name: string; enabled: boolean; endpoint: string; newKey?: string }
    ) => {
        if (!session.user?.id) return

        setLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(currentProviders.core)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                    // Don't include newKey for existing providers
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(currentProviders.custom)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                    // Don't include newKey for existing providers unless it's the one being updated
                }
            }

            // Update the specific provider being saved
            customProviders[providerId] = data

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings?.searchProvider || "firecrawl",
                    searchIncludeSourcesByDefault:
                        userSettings?.searchIncludeSourcesByDefault || false,
                    customModels: userSettings?.customModels || {},
                    titleGenerationModel:
                        userSettings?.titleGenerationModel || "gemini-2.0-flash-lite"
                },
                coreProviders,
                customProviders
            })

            toast.success("Custom provider updated")
        } catch (error) {
            toast.error("Failed to save custom provider")
            console.error(error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleAddCustomProvider = async () => {
        if (!session.user?.id) return

        setLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(currentProviders.core)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                    // Don't include newKey for existing providers
                }
            }

            // Include current state for all custom providers + new one
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(currentProviders.custom)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                    // Don't include newKey for existing providers
                }
            }

            // Add the new provider
            const providerId = `custom-${Date.now()}`
            customProviders[providerId] = {
                name: customProviderForm.name,
                enabled: customProviderForm.enabled,
                endpoint: customProviderForm.endpoint,
                newKey: customProviderForm.key
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings?.searchProvider || "firecrawl",
                    searchIncludeSourcesByDefault:
                        userSettings?.searchIncludeSourcesByDefault || false,
                    customModels: userSettings?.customModels || {},
                    titleGenerationModel:
                        userSettings?.titleGenerationModel || "gemini-2.0-flash-lite"
                },
                coreProviders,
                customProviders
            })

            toast.success("Custom provider added")
            setAddingCustomProvider(false)
            setCustomProviderForm({
                name: "",
                endpoint: "",
                enabled: true,
                key: ""
            })
        } catch (error) {
            toast.error("Failed to add custom provider")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveCustomModel = async () => {
        if (!session.user?.id) return

        setLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(currentProviders.core)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                    // Don't include newKey for existing providers
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(currentProviders.custom)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                    // Don't include newKey for existing providers
                }
            }

            const customModels = { ...userSettings?.customModels }
            const modelId = `custom-${Date.now()}`

            customModels[modelId] = {
                enabled: customModelForm.enabled,
                name: customModelForm.name,
                modelId: customModelForm.modelId,
                providerId: customModelForm.providerId,
                contextLength: customModelForm.contextLength,
                maxTokens: customModelForm.maxTokens,
                abilities: customModelForm.abilities
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings?.searchProvider || "firecrawl",
                    searchIncludeSourcesByDefault:
                        userSettings?.searchIncludeSourcesByDefault || false,
                    customModels,
                    titleGenerationModel:
                        userSettings?.titleGenerationModel || "gemini-2.0-flash-lite"
                },
                coreProviders,
                customProviders
            })

            toast.success("Custom model added")
            setAddingCustomModel(false)
            setCustomModelForm({
                name: "",
                modelId: "",
                providerId: "",
                contextLength: 4096,
                maxTokens: 1024,
                abilities: [],
                enabled: true
            })
        } catch (error) {
            toast.error("Failed to save custom model")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditCustomModel = (modelId: string) => {
        const model = userSettings?.customModels?.[modelId]
        if (!model) return

        setCustomModelForm({
            name: model.name || "",
            modelId: model.modelId,
            providerId: model.providerId,
            contextLength: model.contextLength,
            maxTokens: model.maxTokens,
            abilities: model.abilities,
            enabled: model.enabled
        })
        setEditingCustomModel(modelId)
    }

    const handleSaveCustomModelEdit = async () => {
        if (!session.user?.id || !editingCustomModel) return

        setLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(currentProviders.core)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(currentProviders.custom)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                }
            }

            const customModels = { ...userSettings?.customModels }
            customModels[editingCustomModel] = {
                enabled: customModelForm.enabled,
                name: customModelForm.name,
                modelId: customModelForm.modelId,
                providerId: customModelForm.providerId,
                contextLength: customModelForm.contextLength,
                maxTokens: customModelForm.maxTokens,
                abilities: customModelForm.abilities
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings?.searchProvider || "firecrawl",
                    searchIncludeSourcesByDefault:
                        userSettings?.searchIncludeSourcesByDefault || false,
                    customModels,
                    titleGenerationModel:
                        userSettings?.titleGenerationModel || "gemini-2.0-flash-lite"
                },
                coreProviders,
                customProviders
            })

            toast.success("Custom model updated")
            setEditingCustomModel(null)
            setCustomModelForm({
                name: "",
                modelId: "",
                providerId: "",
                contextLength: 4096,
                maxTokens: 1024,
                abilities: [],
                enabled: true
            })
        } catch (error) {
            toast.error("Failed to update custom model")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCustomModel = async (modelId: string) => {
        if (!session.user?.id) return

        setLoading(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(currentProviders.core)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(currentProviders.custom)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                }
            }

            const customModels = { ...userSettings?.customModels }
            delete customModels[modelId]

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user.id,
                    searchProvider: userSettings?.searchProvider || "firecrawl",
                    searchIncludeSourcesByDefault:
                        userSettings?.searchIncludeSourcesByDefault || false,
                    customModels,
                    titleGenerationModel:
                        userSettings?.titleGenerationModel || "gemini-2.0-flash-lite"
                },
                coreProviders,
                customProviders
            })

            toast.success("Custom model deleted")
        } catch (error) {
            toast.error("Failed to delete custom model")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!session.user?.id) {
        return (
            <SettingsLayout
                title="Models & Providers"
                description="Manage your AI provider API keys and configure custom providers."
            >
                <p className="text-muted-foreground text-sm">Sign in to manage your providers.</p>
            </SettingsLayout>
        )
    }

    if (!userSettings || "error" in userSettings) {
        return (
            <SettingsLayout
                title="Models & Providers"
                description="Manage your AI provider API keys and configure custom providers."
            >
                <p className="text-muted-foreground text-sm">Loading provider settings...</p>
            </SettingsLayout>
        )
    }

    const { availableModels, unavailableModels, currentProviders } =
        useAvailableModels(userSettings)

    const availableProviders = [
        ...Object.keys(currentProviders.core).filter((id) => currentProviders.core[id].enabled),
        ...Object.keys(currentProviders.custom).filter((id) => currentProviders.custom[id].enabled)
    ]

    const getProviderDisplayName = (providerId: string) => {
        // Check if it's a core provider
        const coreProvider = CORE_PROVIDERS.find((p) => p.id === providerId)
        if (coreProvider) {
            return coreProvider.name
        }

        // Check if it's a custom provider
        const customProvider = currentProviders.custom[providerId]
        if (customProvider) {
            return customProvider.name
        }

        return providerId
    }

    return (
        <SettingsLayout
            title="Models & Providers"
            description="Manage your AI provider API keys and configure custom providers. Keys are encrypted and stored securely."
        >
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <div className="space-y-0.25">
                        <h3 className="font-semibold text-base">Providers</h3>
                        <p className="text-muted-foreground text-xs">
                            Configure AI providers to access different models
                        </p>
                    </div>

                    <Card className="p-4 shadow-xs">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg">
                                    <Logo />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">intern3.chat Built-in</h4>
                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                        Access built-in models without needing API keys. Rate limits
                                        may apply.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-muted-foreground text-xs">Active</span>
                            </div>
                        </div>
                    </Card>

                    {CORE_PROVIDERS.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            currentProvider={currentProviders.core[provider.id]}
                            onSave={handleSaveProvider}
                            loading={loading}
                        />
                    ))}

                    {/* Custom Providers */}
                    {Object.entries(currentProviders.custom).map(([id, provider]) => (
                        <CustomProviderCard
                            key={id}
                            providerId={id}
                            provider={provider}
                            onSave={handleSaveCustomProvider}
                            loading={loading}
                        />
                    ))}

                    {/* Add Custom Provider */}
                    {addingCustomProvider ? (
                        <Card className="p-4 shadow-xs">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm">Add Custom Provider</h4>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="custom-provider-enabled"
                                            checked={customProviderForm.enabled}
                                            onCheckedChange={(checked) =>
                                                setCustomProviderForm((prev) => ({
                                                    ...prev,
                                                    enabled: checked
                                                }))
                                            }
                                        />
                                        <Label htmlFor="custom-provider-enabled">
                                            Enable Provider
                                        </Label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="custom-provider-name">
                                                Provider Name
                                            </Label>
                                            <Input
                                                id="custom-provider-name"
                                                value={customProviderForm.name}
                                                onChange={(e) =>
                                                    setCustomProviderForm((prev) => ({
                                                        ...prev,
                                                        name: e.target.value
                                                    }))
                                                }
                                                placeholder="My Custom Provider"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="custom-provider-endpoint">
                                                Base URL
                                            </Label>
                                            <Input
                                                id="custom-provider-endpoint"
                                                value={customProviderForm.endpoint}
                                                onChange={(e) =>
                                                    setCustomProviderForm((prev) => ({
                                                        ...prev,
                                                        endpoint: e.target.value
                                                    }))
                                                }
                                                placeholder="https://api.example.com/v1"
                                            />
                                        </div>
                                    </div>

                                    {customProviderForm.enabled && (
                                        <div className="space-y-2">
                                            <Label htmlFor="custom-provider-key">API Key</Label>
                                            <Input
                                                id="custom-provider-key"
                                                type="password"
                                                value={customProviderForm.key}
                                                onChange={(e) =>
                                                    setCustomProviderForm((prev) => ({
                                                        ...prev,
                                                        key: e.target.value
                                                    }))
                                                }
                                                placeholder="sk-..."
                                                className="font-mono"
                                            />
                                            {customProviderForm.enabled &&
                                                !customProviderForm.key.trim() && (
                                                    <div className="flex items-center gap-2 text-amber-600">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span className="text-xs">
                                                            API key required to enable provider
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleAddCustomProvider}
                                            disabled={
                                                loading ||
                                                !customProviderForm.name.trim() ||
                                                !customProviderForm.endpoint.trim() ||
                                                (customProviderForm.enabled &&
                                                    !customProviderForm.key.trim())
                                            }
                                            size="sm"
                                        >
                                            <Check className="h-4 w-4" />
                                            {loading ? "Adding..." : "Add Provider"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAddingCustomProvider(false)
                                                setCustomProviderForm({
                                                    name: "",
                                                    endpoint: "",
                                                    enabled: true,
                                                    key: ""
                                                })
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-dashed p-4 shadow-xs">
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                                    <Plus className="size-5" />
                                </div>
                                <h4 className="mb-1 font-semibold text-sm">Add Custom Provider</h4>
                                <p className="mb-3 text-muted-foreground text-xs">
                                    Add any OpenAI-compatible provider with an API key and base URL
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAddingCustomProvider(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Provider
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="space-y-0.25">
                        <h3 className="font-semibold text-base">Models</h3>
                        <p className="text-muted-foreground text-xs">
                            Available models from your configured providers
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        {/* Available Models */}
                        {availableModels.map((model) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                currentProviders={currentProviders}
                                onEdit={handleEditCustomModel}
                                onDelete={handleDeleteCustomModel}
                            />
                        ))}

                        {/* Divider */}
                        {unavailableModels.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-4 py-4">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-muted-foreground text-sm">
                                        Unavailable Models
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                                <span className="text-muted-foreground text-xs">
                                    Configure a provider above to use these models
                                </span>
                            </div>
                        )}

                        {/* Unavailable Models */}
                        {unavailableModels.map((model) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                currentProviders={currentProviders}
                                onEdit={handleEditCustomModel}
                                onDelete={handleDeleteCustomModel}
                            />
                        ))}

                        {/* Add Custom Model */}
                        {/* Edit Custom Model */}
                        {editingCustomModel && (
                            <Card className="p-4 shadow-xs">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Edit Custom Model</h4>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="edit-custom-model-enabled"
                                                checked={customModelForm.enabled}
                                                onCheckedChange={(checked) =>
                                                    setCustomModelForm((prev) => ({
                                                        ...prev,
                                                        enabled: checked
                                                    }))
                                                }
                                            />
                                            <Label htmlFor="edit-custom-model-enabled">
                                                Enable Model
                                            </Label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-custom-model-name">
                                                    Model Name
                                                </Label>
                                                <Input
                                                    id="edit-custom-model-name"
                                                    value={customModelForm.name}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            name: e.target.value
                                                        }))
                                                    }
                                                    placeholder="GPT-4 Custom"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="edit-custom-model-id">
                                                    Model ID
                                                </Label>
                                                <Input
                                                    id="edit-custom-model-id"
                                                    value={customModelForm.modelId}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            modelId: e.target.value
                                                        }))
                                                    }
                                                    placeholder="gpt-4-custom"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-custom-model-provider">
                                                Provider
                                            </Label>
                                            <Select
                                                value={customModelForm.providerId}
                                                onValueChange={(value) =>
                                                    setCustomModelForm((prev) => ({
                                                        ...prev,
                                                        providerId: value
                                                    }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a provider" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableProviders.map((providerId) => (
                                                        <SelectItem
                                                            key={providerId}
                                                            value={providerId}
                                                        >
                                                            {getProviderDisplayName(providerId)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-custom-model-context">
                                                    Context Length
                                                </Label>
                                                <Input
                                                    id="edit-custom-model-context"
                                                    type="number"
                                                    value={customModelForm.contextLength}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            contextLength:
                                                                Number.parseInt(e.target.value) ||
                                                                4096
                                                        }))
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="edit-custom-model-tokens">
                                                    Max Tokens
                                                </Label>
                                                <Input
                                                    id="edit-custom-model-tokens"
                                                    type="number"
                                                    value={customModelForm.maxTokens}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            maxTokens:
                                                                Number.parseInt(e.target.value) ||
                                                                1024
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Abilities</Label>
                                            <div className="flex gap-2">
                                                {(
                                                    [
                                                        "vision",
                                                        "reasoning",
                                                        "function_calling"
                                                    ] as ModelAbility[]
                                                ).map((ability) => {
                                                    const Icon = getAbilityIcon(ability)
                                                    const isSelected =
                                                        customModelForm.abilities.includes(ability)
                                                    return (
                                                        <Button
                                                            key={ability}
                                                            variant={
                                                                isSelected ? "default" : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                setCustomModelForm((prev) => ({
                                                                    ...prev,
                                                                    abilities: isSelected
                                                                        ? prev.abilities.filter(
                                                                              (a) => a !== ability
                                                                          )
                                                                        : [
                                                                              ...prev.abilities,
                                                                              ability
                                                                          ]
                                                                }))
                                                            }}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            {getAbilityLabel(ability)}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSaveCustomModelEdit}
                                                disabled={
                                                    loading ||
                                                    !customModelForm.name ||
                                                    !customModelForm.modelId ||
                                                    !customModelForm.providerId
                                                }
                                                size="sm"
                                            >
                                                <Check className="h-4 w-4" />
                                                {loading ? "Updating..." : "Update Model"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingCustomModel(null)
                                                    setCustomModelForm({
                                                        name: "",
                                                        modelId: "",
                                                        providerId: "",
                                                        contextLength: 4096,
                                                        maxTokens: 1024,
                                                        abilities: [],
                                                        enabled: true
                                                    })
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {!editingCustomModel && addingCustomModel ? (
                            <Card className="p-4 shadow-xs">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Add Custom Model</h4>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="custom-model-enabled"
                                                checked={customModelForm.enabled}
                                                onCheckedChange={(checked) =>
                                                    setCustomModelForm((prev) => ({
                                                        ...prev,
                                                        enabled: checked
                                                    }))
                                                }
                                            />
                                            <Label htmlFor="custom-model-enabled">
                                                Enable Model
                                            </Label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-model-name">
                                                    Model Name
                                                </Label>
                                                <Input
                                                    id="custom-model-name"
                                                    value={customModelForm.name}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            name: e.target.value
                                                        }))
                                                    }
                                                    placeholder="GPT-4 Custom"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="custom-model-id">Model ID</Label>
                                                <Input
                                                    id="custom-model-id"
                                                    value={customModelForm.modelId}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            modelId: e.target.value
                                                        }))
                                                    }
                                                    placeholder="gpt-4-custom"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="custom-model-provider">Provider</Label>
                                            <Select
                                                value={customModelForm.providerId}
                                                onValueChange={(value) =>
                                                    setCustomModelForm((prev) => ({
                                                        ...prev,
                                                        providerId: value
                                                    }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a provider" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableProviders.map((providerId) => (
                                                        <SelectItem
                                                            key={providerId}
                                                            value={providerId}
                                                        >
                                                            {getProviderDisplayName(providerId)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-model-context">
                                                    Context Length
                                                </Label>
                                                <Input
                                                    id="custom-model-context"
                                                    type="number"
                                                    value={customModelForm.contextLength}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            contextLength:
                                                                Number.parseInt(e.target.value) ||
                                                                4096
                                                        }))
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="custom-model-tokens">
                                                    Max Tokens
                                                </Label>
                                                <Input
                                                    id="custom-model-tokens"
                                                    type="number"
                                                    value={customModelForm.maxTokens}
                                                    onChange={(e) =>
                                                        setCustomModelForm((prev) => ({
                                                            ...prev,
                                                            maxTokens:
                                                                Number.parseInt(e.target.value) ||
                                                                1024
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Abilities</Label>
                                            <div className="flex gap-2">
                                                {(
                                                    [
                                                        "vision",
                                                        "reasoning",
                                                        "function_calling"
                                                    ] as ModelAbility[]
                                                ).map((ability) => {
                                                    const Icon = getAbilityIcon(ability)
                                                    const isSelected =
                                                        customModelForm.abilities.includes(ability)
                                                    return (
                                                        <Button
                                                            key={ability}
                                                            variant={
                                                                isSelected ? "default" : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                setCustomModelForm((prev) => ({
                                                                    ...prev,
                                                                    abilities: isSelected
                                                                        ? prev.abilities.filter(
                                                                              (a) => a !== ability
                                                                          )
                                                                        : [
                                                                              ...prev.abilities,
                                                                              ability
                                                                          ]
                                                                }))
                                                            }}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            {getAbilityLabel(ability)}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSaveCustomModel}
                                                disabled={
                                                    loading ||
                                                    !customModelForm.name ||
                                                    !customModelForm.modelId ||
                                                    !customModelForm.providerId
                                                }
                                                size="sm"
                                            >
                                                <Check className="h-4 w-4" />
                                                {loading ? "Adding..." : "Add Model"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setAddingCustomModel(false)}
                                            >
                                                <X className="h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : !editingCustomModel ? (
                            <Card className="border-dashed p-4 shadow-xs">
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted">
                                        <Plus className="size-6" />
                                    </div>
                                    <h4 className="mb-2 font-semibold">Add Custom Model</h4>
                                    <p className="mb-4 text-muted-foreground text-sm">
                                        Add a custom model from any of your configured providers
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setAddingCustomModel(true)}
                                        disabled={availableProviders.length === 0}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Model
                                    </Button>
                                    {availableProviders.length === 0 && (
                                        <p className="mt-2 text-muted-foreground text-xs">
                                            Configure a provider first to add custom models
                                        </p>
                                    )}
                                </div>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>
        </SettingsLayout>
    )
}
