import type { ReactNode } from "react";

interface SettingsLayoutProps {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SettingsLayout({
  title,
  description,
  action,
  children,
}: SettingsLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        {action}
      </div>

      {children}
    </div>
  );
} 