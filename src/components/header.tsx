import { GitHubIcon, UserButton } from "@daveyplate/better-auth-ui"
import { SettingsIcon } from "lucide-react"
import { ThemeSwitcher } from "./themes/theme-switcher"
import { SidebarTrigger } from "./ui/sidebar"
import { ShareButton } from "./share-button"

export function Header({ threadId }: { threadId?: string }) {
    return (
        <header className="pointer-events-none absolute top-0 z-50 w-full">
            <div className="flex w-full items-center justify-between">
                <div className="pointer-events-auto p-4">
                    <SidebarTrigger />
                </div>
                <div className="pointer-events-auto flex items-center gap-2 p-4">
                    {threadId && <ShareButton threadId={threadId} />}
                    <ThemeSwitcher />
                    <UserButton
                        additionalLinks={[
                            {
                                label: "Settings",
                                href: "/settings",
                                icon: <SettingsIcon className="size-4" />
                            },
                            {
                                label: "GitHub",
                                href: "https://github.com/intern3-chat/intern3-chat",
                                icon: <GitHubIcon className="size-4" />
                            }
                        ]}
                        disableDefaultLinks={true}
                    />
                </div>
            </div>
        </header>
    )
}
