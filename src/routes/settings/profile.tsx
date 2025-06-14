import { createFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SettingsLayout } from "@/components/settings/settings-layout";

export const Route = createFileRoute("/settings/profile")({
  component: ProfileSettings,
});

function ProfileSettings() {
  return (
    <SettingsLayout
      title="Profile Settings"
      description="Manage your account settings and profile information."
    >
      <div
        className={cn(
          "flex flex-col gap-6 p-6",
          "border rounded-lg bg-card",
          "transition-colors duration-200"
        )}
      >
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>

        <div className="grid gap-6">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
            <div>John Doe</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
            <div>john.doe@example.com</div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
} 