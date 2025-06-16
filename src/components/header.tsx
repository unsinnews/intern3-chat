import { ShareButton } from "./share-button"
import { ThemeSwitcher } from "./themes/theme-switcher"
import { SidebarTrigger } from "./ui/sidebar"
import { UserButton } from "./user-button"

export function Header({ threadId }: { threadId?: string }) {
    return (
        <header className="pointer-events-none absolute top-0 z-50 w-full px-4 pt-2">
            <div className="flex w-full items-center justify-between">
                <div className="pointer-events-auto">
                    <SidebarTrigger />
                </div>
                <div className="pointer-events-auto flex items-center gap-2">
                    {threadId && <ShareButton threadId={threadId} />}
                    <ThemeSwitcher />
                    <UserButton />
                </div>
            </div>
        </header>
    )
}
