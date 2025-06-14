import { GitHubIcon, UserButton } from "@daveyplate/better-auth-ui"
import { ShareButton } from "./share-button"
import { ThemeSwitcher } from "./themes/theme-switcher"
import { Button } from "./ui/button"
import { SidebarTrigger } from "./ui/sidebar"

interface HeaderProps {
    threadId?: string
}

export function Header({ threadId }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/60 px-4 py-3 backdrop-blur">
            <div className="container mx-auto flex items-center justify-between">
                <SidebarTrigger />

                <div className="flex items-center gap-2">
                    {threadId && <ShareButton threadId={threadId} />}

                    <a
                        href="https://github.com/daveyplate/better-auth-tanstack-starter"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button variant="outline" size="icon" className="size-8 rounded-full">
                            <GitHubIcon />
                        </Button>
                    </a>

                    <ThemeSwitcher />
                    <UserButton />
                </div>
            </div>
        </header>
    )
}
