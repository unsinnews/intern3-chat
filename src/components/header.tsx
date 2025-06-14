import { GitHubIcon, UserButton } from "@daveyplate/better-auth-ui";
import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "./themes/theme-switcher";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { SettingsIcon } from "lucide-react";

export function Header() {
  return (
    <header className="absolute top-0 z-50 w-full pointer-events-none">
      <div className="flex items-center justify-between w-full">
        <div className="pointer-events-auto p-4">
          <SidebarTrigger />
        </div>
        <div className="flex items-center gap-2 pointer-events-auto p-4">
          <ThemeSwitcher />
          <UserButton
            additionalLinks={[
              {
                label: "Settings",
                href: "/settings",
                icon: <SettingsIcon className="size-4" />,
              },
              {
                label: "GitHub",
                href: "https://github.com/intern3-chat/intern3-chat",
                icon: <GitHubIcon className="size-4" />,
              },
            ]}
            disableDefaultLinks={true}
          />
        </div>
      </div>
    </header>
  );
}
