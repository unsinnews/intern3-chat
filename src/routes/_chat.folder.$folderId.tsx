import { Chat } from "@/components/chat"
import type { Id } from "@/convex/_generated/dataModel"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_chat/folder/$folderId")({
    component: () => {
        const { folderId } = Route.useParams()
        return <Chat threadId={undefined} folderId={folderId as Id<"projects">} />
    }
})
