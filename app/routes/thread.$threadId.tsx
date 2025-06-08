import { Chat } from "@/components/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/thread/$threadId")({
  component: RouteComponent,
});

function RouteComponent() {
  const threadId = Route.useParams().threadId;
  return <Chat threadId={threadId} />;
}
