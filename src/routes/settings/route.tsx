import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { User, Key, ArrowLeft } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

interface SettingsLayoutProps {
    children?: ReactNode
    title?: string
    description?: string
}

const settingsNavItems = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: User,
    },
    {
        title: "API Keys", 
        href: "/settings/apikeys",
        icon: Key,
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
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-6xl p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                    
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account preferences and configuration.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation */}
                    <div className="lg:col-span-1">
                        <nav className="space-y-1">
                            {settingsNavItems.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon
                                
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                            isActive 
                                                ? "bg-muted text-foreground" 
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    <div className="lg:col-span-3 overflow-y-auto max-h-[calc(100vh-12rem)]">
                        <div className="space-y-6">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
