import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
        <div className="h-screen bg-background flex flex-col">
            <div className="container mx-auto max-w-6xl p-6 flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="mb-8 flex-shrink-0">
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

                <div className="flex flex-col lg:flex-row gap-8 overflow-hidden">
                    {/* Navigation */}
                    <div className="lg:w-64 flex-shrink-0">
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
