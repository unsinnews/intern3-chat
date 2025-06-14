import type { ReactNode } from "react"

interface SettingsLayoutProps {
    title: string
    description: string
    action?: ReactNode
    children: ReactNode
}

export function SettingsLayout({ title, description, action, children }: SettingsLayoutProps) {
    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-semibold text-lg">{title}</h1>
                    <p className="mt-1 text-muted-foreground text-sm">{description}</p>
                </div>
                {action}
            </div>

            {children}
        </div>
    )
}
