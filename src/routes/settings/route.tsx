import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/hooks/auth-hooks"
import { cn } from "@/lib/utils"
import { useConvexQuery } from "@convex-dev/react-query"
import { Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import {
    ArrowLeft,
    BarChart3,
    Bot,
    Key,
    PaintBucket,
    Paperclip,
    Sparkles,
    User
} from "lucide-react"
import type { ReactNode } from "react"

interface SettingsLayoutProps {
    children?: ReactNode
    title?: string
    description?: string
}

const settingsNavItems = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: User
    },
    {
        title: "Models/Providers",
        href: "/settings/models-providers",
        icon: Key
    },
    {
        title: "AI Options",
        href: "/settings/ai-options",
        icon: Bot
    },
    {
        title: "Customization",
        href: "/settings/customization",
        icon: Sparkles
    },
    {
        title: "Usage Analytics",
        href: "/settings/usage",
        icon: BarChart3
    },
    {
        title: "Attachments",
        href: "/settings/attachments",
        icon: Paperclip
    },
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: PaintBucket
    }
]

export const Route = createFileRoute("/settings")({
    beforeLoad: ({ location }) => {
        // Redirect to profile page if we're at /settings exactly
        if (location.pathname === "/settings") {
            throw redirect({
                to: "/settings/profile"
            })
        }
    },
    component: SettingsPage
})

const Inner = () => {
    const session = useSession()
    const userSettings = useConvexQuery(
        api.settings.getUserSettings,
        session.user?.id ? {} : "skip"
    )
    if (!session.user?.id) {
        return (
            <SettingsLayout
                title="API Keys"
                description="Manage your models and providers. Keys are encrypted and stored securely."
            >
                <p className="text-muted-foreground text-sm">Sign in to manage your API keys.</p>
            </SettingsLayout>
        )
    }
    if (!userSettings) {
        return (
            <SettingsLayout
                title="API Keys"
                description="Manage your models and providers. Keys are encrypted and stored securely."
            >
                <Skeleton className="h-10 w-full" />
            </SettingsLayout>
        )
    }
    if ("error" in userSettings) {
        return (
            <SettingsLayout
                title="API Keys"
                description="Manage your models and providers. Keys are encrypted and stored securely."
            >
                <p className="text-muted-foreground text-sm">Error loading API keys.</p>
            </SettingsLayout>
        )
    }

    return <Outlet />
}

function SettingsPage({ title, description }: SettingsLayoutProps) {
    const location = useLocation()

    return (
        <div className="flex h-screen flex-col overflow-y-auto bg-background">
            <div className="container mx-auto flex max-w-6xl flex-1 flex-col p-3 pb-6 lg:max-h-dvh lg:overflow-y-hidden lg:p-6">
                {/* Header */}
                <div className="mb-8 max-md:px-2">
                    <div className="mb-6 flex items-center gap-4">
                        <Link to="/">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        <h1 className="font-semibold text-3xl tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account preferences and configuration.
                        </p>
                    </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Navigation */}
                    <div className="w-full flex-shrink-0 lg:w-64">
                        <nav className="w-full space-y-1">
                            {settingsNavItems.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                                            isActive
                                                ? "bg-muted text-foreground"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-3 flex-1">
                        <div className="space-y-6 px-0.5 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
                            <Inner />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
