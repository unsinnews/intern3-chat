import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Header } from "@/components/header";
import { ThreadsSidebar } from "@/components/threads-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_chat")({
  component: ChatLayout,
});

function ChatLayout() {
  return (
    <SidebarProvider>
      <ThreadsSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <Header />
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
