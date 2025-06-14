import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Key, X } from "lucide-react"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/settings")({
    beforeLoad: ({ location }) => {
        // Redirect to profile page if we're at /settings exactly
        if (location.pathname === "/settings") {
            throw redirect({
                to: "/settings/profile"
            })
        }
    },
    component: SettingsLayout
})

function SettingsLayout() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex">
                    <div className="w-64 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Settings
                            </h2>
                            <Link to="/">
                                <Button variant="ghost" size="sm">
                                    <X className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-1">
                            <div className="mb-6">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Settings
                                </p>
                                <nav className="space-y-1">
                                    <Link
                                        to="/settings/profile"
                                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        activeProps={{
                                            className:
                                                "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        }}
                                    >
                                        <User className="mr-3 h-4 w-4" />
                                        Profile
                                    </Link>
                                </nav>


                                <nav className="space-y-1">
                                    <Link
                                        to="/settings/apikeys"
                                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        activeProps={{
                                            className:
                                                "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        }}
                                    >
                                        <Key className="mr-3 h-4 w-4" />
                                        API Keys
                                    </Link>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}
