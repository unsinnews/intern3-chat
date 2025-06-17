import { AuthCard } from "@/components/auth/auth-card"
import { ShaderBackground } from "@/components/auth/shader-background"
import { ThemeSwitcher } from "@/components/themes/theme-switcher"
import { Button } from "@/components/ui/button"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

export const Route = createFileRoute("/auth/$pathname")({
    component: RouteComponent
})

function RouteComponent() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center gap-4 p-4">
            <ShaderBackground />
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
                {/* <AuthCard pathname={pathname} /> */}
            </div>

            {/* <p
                className={cn(
                    ["callback", "settings", "sign-out"].includes(pathname) && "hidden",
                    "text-muted-foreground text-xs"
                )}
            >
                Powered by{" "}
                <a
                    className="text-warning underline"
                    href="https://better-auth.com"
                    target="_blank"
                    rel="noreferrer"
                >
                    better-auth.
                </a>
            </p> */}
        </main>
    )
}
