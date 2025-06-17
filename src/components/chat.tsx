import { Messages } from "@/components/messages"
import { MODELS_SHARED } from "@/convex/lib/models"
import { useChatActions } from "@/hooks/use-chat-actions"
import { useChatDataProcessor } from "@/hooks/use-chat-data-processor"
import { useChatIntegration } from "@/hooks/use-chat-integration"
import { useDynamicTitle } from "@/hooks/use-dynamic-title"
import { useThreadSync } from "@/hooks/use-thread-sync"
import type { UploadedFile } from "@/lib/chat-store"
// import { useChatStore } from "@/lib/chat-store"
import { useModelStore } from "@/lib/model-store"
import { useMemo } from "react"
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom"
import { MultimodalInput } from "./multimodal-input"
import { StickToBottomButton } from "./stick-to-bottom-button"

interface ChatProps {
    threadId: string | undefined
}

const ChatContent = ({ threadId: routeThreadId }: ChatProps) => {
    const { selectedModel, setSelectedModel } = useModelStore()
    const { threadId } = useThreadSync({ routeThreadId })
    const { scrollToBottom } = useStickToBottomContext()
    // const { setTargetFromMessageId } = useChatStore()

    useDynamicTitle({ threadId })

    useMemo(() => {
        if (!selectedModel && MODELS_SHARED.length > 0) {
            setSelectedModel(MODELS_SHARED[0].id)
        }
    }, [selectedModel, setSelectedModel])

    const { status, data, messages } = useChatIntegration({
        threadId
    })

    const { handleInputSubmit, handleRetry, handleEditAndRetry } = useChatActions({
        threadId
    })

    useChatDataProcessor({ data, messages })

    const handleInputSubmitWithScroll = (inputValue?: string, fileValues?: UploadedFile[]) => {
        handleInputSubmit(inputValue, fileValues)
        scrollToBottom({ animation: "instant" })
    }

    return (
        <div className="relative mb-80 flex h-[calc(100vh-64px)] flex-col">
            <Messages
                messages={messages}
                onRetry={handleRetry}
                onEditAndRetry={handleEditAndRetry}
                status={status}
            />
            <div className="-bottom-[3.875rem] md:-bottom-10 absolute right-0 left-0 z-[10] flex flex-col items-center justify-center gap-2">
                <StickToBottomButton />
                <MultimodalInput onSubmit={handleInputSubmitWithScroll} status={status} />
            </div>
        </div>
    )
}

export const Chat = ({ threadId }: ChatProps) => {
    return (
        <StickToBottom className="relative h-full" resize="instant" initial="instant">
            <ChatContent threadId={threadId} />
        </StickToBottom>
    )
}
