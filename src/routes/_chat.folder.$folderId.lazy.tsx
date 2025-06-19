import { Chat } from "@/components/chat"
import type { Id } from "@/convex/_generated/dataModel"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_chat/folder/$folderId")({
    component: () => {
        const { folderId } = Route.useParams()
        return <Chat threadId={undefined} folderId={folderId as Id<"projects">} />
    }
})
