import { SharedChat } from "@/components/shared-chat"
import { createLazyFileRoute } from "@tanstack/react-router"
import { ChatErrorBoundary } from "./_chat"

export const Route = createLazyFileRoute("/_chat/s/$sharedThreadId")({
    component: RouteComponent,
    errorComponent: ChatErrorBoundary
})

function RouteComponent() {
    const { sharedThreadId } = Route.useParams()
    return <SharedChat sharedThreadId={sharedThreadId} />
}
