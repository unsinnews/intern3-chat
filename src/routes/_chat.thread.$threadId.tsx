import { Chat } from "@/components/chat"
import { useDynamicTitle } from "@/hooks/use-dynamic-title"
import { createFileRoute } from "@tanstack/react-router"
import { ChatErrorBoundary } from "./_chat"

export const Route = createFileRoute("/_chat/thread/$threadId")({
    component: RouteComponent,
    errorComponent: ChatErrorBoundary
})

function RouteComponent() {
    const threadId = Route.useParams().threadId
    useDynamicTitle({ threadId })
    return <Chat threadId={threadId} />
}
