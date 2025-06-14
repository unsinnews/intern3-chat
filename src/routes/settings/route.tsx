import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, BarChart3, Key, User } from "lucide-react"
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
        title: "API Keys",
        href: "/settings/apikeys",
        icon: Key
    },
    {
        title: "Usage Analytics",
        href: "/settings/usage",
        icon: BarChart3
    }
]

export const Route = createFileRoute("/settings")({
    beforeLoad: ({ location }) => {
        // Redirect to profile page if we're at /settings exactly
        if (location.pathname === "/settings/") {
            throw redirect({
                to: "/settings/profile"
            })
        }
    },
    component: SettingsLayout
})

function SettingsLayout({ title, description }: SettingsLayoutProps) {
    const location = useLocation()

    return (
        <div className="flex h-screen flex-col bg-background">
            <div className="container mx-auto flex max-w-6xl flex-1 flex-col overflow-hidden p-6">
                {/* Header */}
                <div className="mb-8 flex-shrink-0">
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

                <div className="flex flex-col gap-8 overflow-hidden lg:flex-row">
                    {/* Navigation */}
                    <div className="flex-shrink-0 lg:w-64">
                        <nav className="space-y-1">
                            {settingsNavItems.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
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
                    <ScrollArea className="flex-1">
                        <div className="space-y-6 pr-4">
                            <Outlet />
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
