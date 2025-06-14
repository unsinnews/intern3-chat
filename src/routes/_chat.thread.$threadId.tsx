import { Chat } from "@/components/chat"
import { createFileRoute } from "@tanstack/react-router"
import { ChatErrorBoundary } from "./_chat"

export const Route = createFileRoute("/_chat/thread/$threadId")({
    component: RouteComponent,
    errorComponent: ChatErrorBoundary
})

function RouteComponent() {
    const threadId = Route.useParams().threadId
    return <Chat threadId={threadId} />
}
