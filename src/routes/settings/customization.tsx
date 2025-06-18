import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/hooks/auth-hooks"
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Save } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/settings/customization")({
    component: CustomizationSettings
})

function CustomizationSettings() {
    const session = useSession()
    const userSettings = useConvexQuery(
        api.settings.getUserSettings,
        session.user?.id ? {} : "skip"
    )
    const updateSettings = useConvexMutation(api.settings.updateUserSettings)

    const [isSaving, setIsSaving] = useState(false)

    // Using refs for uncontrolled inputs
    const nameRef = useRef<HTMLInputElement>(null)
    const personalityRef = useRef<HTMLTextAreaElement>(null)
    const contextRef = useRef<HTMLTextAreaElement>(null)

    const handleSave = async () => {
        if (!userSettings || !session.user?.id) return

        const name = nameRef.current?.value.trim()
        const personality = personalityRef.current?.value.trim()
        const context = contextRef.current?.value.trim()

        // Validate character limits
        if (personality && personality.length > 2000) {
            toast.error("AI personality must be 2000 characters or less")
            return
        }

        if (context && context.length > 2000) {
            toast.error("Additional context must be 2000 characters or less")
            return
        }

        setIsSaving(true)
        try {
            // Include current state for all core providers
            const coreProviders: Record<string, { enabled: boolean; newKey?: string }> = {}
            for (const [id, provider] of Object.entries(userSettings.coreAIProviders)) {
                coreProviders[id] = {
                    enabled: provider.enabled
                }
            }

            // Include current state for all custom providers
            const customProviders: Record<
                string,
                { name: string; enabled: boolean; endpoint: string; newKey?: string }
            > = {}
            for (const [id, provider] of Object.entries(userSettings.customAIProviders)) {
                customProviders[id] = {
                    name: provider.name,
                    enabled: provider.enabled,
                    endpoint: provider.endpoint
                }
            }

            if ("_creationTime" in userSettings) {
                userSettings._creationTime = undefined
            }
            if ("_id" in userSettings) {
                userSettings._id = undefined
            }

            await updateSettings({
                userId: session.user.id,
                baseSettings: {
                    userId: session.user!.id,
                    searchProvider: userSettings.searchProvider,
                    searchIncludeSourcesByDefault: userSettings.searchIncludeSourcesByDefault,
                    customModels: userSettings.customModels,
                    titleGenerationModel: userSettings.titleGenerationModel,
                    customThemes: userSettings.customThemes,
                    supermemory: userSettings.supermemory,
                    mcpServers: userSettings.mcpServers,
                    customization: {
                        name: name || undefined,
                        aiPersonality: personality || undefined,
                        additionalContext: context || undefined
                    }
                },
                coreProviders,
                customProviders,
                supermemory: userSettings.supermemory
                    ? { enabled: userSettings.supermemory.enabled }
                    : undefined
            })
            toast.success("Customization settings saved")
        } catch (error) {
            console.error("Failed to save customization:", error)
            toast.error("Failed to save customization settings")
        } finally {
            setIsSaving(false)
        }
    }

    if (!session.user?.id) {
        return (
            <SettingsLayout
                title="Customization"
                description="Personalize how the AI interacts with you"
            >
                <p className="text-muted-foreground text-sm">
                    Sign in to customize your AI experience.
                </p>
            </SettingsLayout>
        )
    }

    if (!userSettings) {
        return (
            <SettingsLayout
                title="Customization"
                description="Personalize how the AI interacts with you"
            >
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </SettingsLayout>
        )
    }

    return (
        <SettingsLayout
            title="Customization"
            description="Personalize how the AI interacts with you"
        >
            <div className="space-y-8">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-foreground">AI Personalization</h3>
                        <p className="mt-1 text-muted-foreground text-sm">
                            Customize how the AI addresses you and behaves in conversations
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">What should I call you?</Label>
                            <Input
                                ref={nameRef}
                                id="name"
                                placeholder="e.g. Theo (t3.gg), Mark (also t3.gg)"
                                defaultValue={userSettings.customization?.name || ""}
                                className="max-w-md"
                            />
                            <p className="text-muted-foreground text-sm">
                                Leave blank to use your account name
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personality">AI Personality Traits</Label>
                            <Textarea
                                ref={personalityRef}
                                id="personality"
                                placeholder="e.g., Be concise and direct. Use casual language. Include relevant examples. Focus on practical solutions."
                                defaultValue={userSettings.customization?.aiPersonality || ""}
                                rows={6}
                                maxLength={2000}
                                className="resize-none"
                            />
                            <p className="text-muted-foreground text-sm">
                                Describe how you'd like the AI to communicate (max 2000 characters)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="context">Additional Context</Label>
                            <Textarea
                                ref={contextRef}
                                id="context"
                                placeholder="e.g., I'm a software developer working primarily with React and TypeScript. I prefer functional programming patterns. I'm learning Rust. Personally, Tauri > Electron any day of the week."
                                defaultValue={userSettings.customization?.additionalContext || ""}
                                rows={6}
                                maxLength={2000}
                                className="resize-none"
                            />
                            <p className="text-muted-foreground text-sm">
                                Any background information the AI should know about you (max 2000
                                characters)
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="min-w-[100px]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    )
}
