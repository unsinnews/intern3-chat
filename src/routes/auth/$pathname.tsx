import { AuthCard } from "@/components/auth/auth-card"
import { ShaderBackground } from "@/components/auth/shader-background"
import { ThemeSwitcher } from "@/components/themes/theme-switcher"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/auth/$pathname")({
    component: RouteComponent
})

function RouteComponent() {
    const { pathname } = Route.useParams()

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center gap-4 p-4">
            <ShaderBackground />
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
