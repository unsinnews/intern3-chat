import { AuthCard } from "@/components/auth/auth-card"
import { ThemeSwitcher } from "@/components/themes/theme-switcher"
import { Button } from "@/components/ui/button"
import { Link, createLazyFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

export const Route = createLazyFileRoute("/auth/$pathname")({
    component: RouteComponent
})

function RouteComponent() {
    return (
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            {/* Left side - Background Image */}
            <div className="hidden bg-[url('/bg.png')] bg-center bg-cover bg-no-repeat lg:block" />

            {/* Right side - Auth Content */}
            <div className="relative flex flex-col items-center justify-center gap-4 p-4">
                <div className="absolute top-4 left-4">
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
                <div className="absolute top-4 right-4">
                    <ThemeSwitcher />
                </div>
                <div className="flex w-full max-w-lg items-center justify-center gap-4">
                    <AuthCard />
                </div>
            </div>
        </main>
    )
}
