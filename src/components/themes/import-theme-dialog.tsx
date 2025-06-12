import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangleIcon, LoaderIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form"
import { Input } from "../ui/input"

type ThemePreset = {
    cssVars: {
        theme: Record<string, string>
        light: Record<string, string>
        dark: Record<string, string>
    }
}

type FetchedTheme = {
    name: string
    preset: ThemePreset
    url: string
    error?: string
}

const formSchema = z.object({
    url: z
        .string()
        .min(1, { message: "Theme URL is required" })
        .url({ message: "Please enter a valid URL" })
})

type ThemeImportForm = z.infer<typeof formSchema>

interface ImportThemeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onThemeImported: (preset: ThemePreset, url: string) => void
}

function convertToThemePreset(externalTheme: any): ThemePreset {
    if (externalTheme.cssVars) {
        return {
            cssVars: {
                theme: externalTheme.cssVars.theme || {},
                light: externalTheme.cssVars.light || {},
                dark: externalTheme.cssVars.dark || {}
            }
        }
    }

    throw new Error("Unsupported theme format")
}

function getThemeName(themeData: any, url: string): string {
    if (themeData.name) {
        return themeData.name.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }

    return "Custom Theme"
}

async function fetchThemeFromUrl(url: string): Promise<FetchedTheme> {
    const baseUrl = "https://tweakcn.com/r/themes/"
    const isBuiltInUrl = url.includes("editor/theme?theme=")

    const transformedUrl =
        url
            .replace("https://tweakcn.com/editor/theme?theme=", baseUrl)
            .replace("https://tweakcn.com/themes/", baseUrl) + (isBuiltInUrl ? ".json" : "")

    try {
        const response = await fetch(transformedUrl)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const themeData = await response.json()
        const themePreset = convertToThemePreset(themeData)
        const themeName = getThemeName(themeData, url)

        return {
            name: themeName,
            preset: themePreset,
            url
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch theme"
        return {
            name: getThemeName({}, url),
            preset: { cssVars: { theme: {}, light: {}, dark: {} } },
            url,
            error: errorMessage
        }
    }
}

export function ImportThemeDialog({ open, onOpenChange, onThemeImported }: ImportThemeDialogProps) {
    const queryClient = useQueryClient()

    const form = useForm<ThemeImportForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: ""
        }
    })

    // Mutation for fetching and applying user-provided theme URLs
    const fetchAndApplyThemeMutation = useMutation({
        mutationFn: async (url: string) => {
            new URL(url)
            const fetchedTheme = await fetchThemeFromUrl(url)

            if (fetchedTheme.error) {
                throw new Error(fetchedTheme.error)
            }

            return fetchedTheme
        },
        onSuccess: (fetchedTheme) => {
            onThemeImported(fetchedTheme.preset, fetchedTheme.url)
            form.reset() // Clear form on success
            onOpenChange(false) // Close modal

            // Optionally cache the successfully fetched theme
            queryClient.setQueryData(["theme", "custom", fetchedTheme.url], fetchedTheme)
        }
    })

    const onSubmit = (data: ThemeImportForm) => {
        if (data.url.trim()) {
            fetchAndApplyThemeMutation.mutate(data.url.trim())
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Theme</DialogTitle>
                    <DialogDescription>
                        Enter a theme URL to import and apply a custom theme.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://tweakcn.com/r/themes/..."
                                            disabled={fetchAndApplyThemeMutation.isPending}
                                            autoFocus
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {fetchAndApplyThemeMutation.error && (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                                <p className="text-destructive text-sm leading-relaxed">
                                    {fetchAndApplyThemeMutation.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={fetchAndApplyThemeMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={fetchAndApplyThemeMutation.isPending}>
                                {fetchAndApplyThemeMutation.isPending ? (
                                    <>
                                        <LoaderIcon className="mr-2 size-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    "Import Theme"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
