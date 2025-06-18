import { SharedChat } from "@/components/shared-chat"
import { createFileRoute } from "@tanstack/react-router"
import { StickToBottom } from "use-stick-to-bottom"
import { ChatErrorBoundary } from "./_chat"

export const Route = createFileRoute("/_chat/s/$sharedThreadId")({
    component: RouteComponent,
    errorComponent: ChatErrorBoundary
})

function RouteComponent() {
    const { sharedThreadId } = Route.useParams()
    return (
        <StickToBottom>
            <SharedChat sharedThreadId={sharedThreadId} />
        </StickToBottom>
    )
}
