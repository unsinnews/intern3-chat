import { nanoid } from "nanoid"
import { create } from "zustand"

interface ChatState {
    threadId: string | undefined
    files: File[]
    rerenderTrigger: string
    lastProcessedDataIndex: number
    shouldUpdateQuery: boolean
    skipNextDataCheck: boolean
    attachedStreamIds: Record<string, string>
    pendingStreams: Record<string, boolean>
    targetFromMessageId: string | undefined
    targetMode: "normal" | "edit" | "retry"
}

interface ChatActions {
    setThreadId: (threadId: string | undefined) => void
    setFiles: (files: File[]) => void
    setLastProcessedDataIndex: (index: number) => void
    setShouldUpdateQuery: (should: boolean) => void
    setSkipNextDataCheck: (skip: boolean) => void
    resetChat: () => void
    triggerRerender: () => void
    setAttachedStreamId: (threadId: string, streamId: string) => void
    setPendingStream: (threadId: string, pending: boolean) => void
    setTargetFromMessageId: (messageId: string | undefined) => void
    setTargetMode: (mode: "normal" | "edit" | "retry") => void
}

const initialState: ChatState = {
    threadId: undefined,
    files: [],
    rerenderTrigger: nanoid(),
    lastProcessedDataIndex: -1,
    shouldUpdateQuery: false,
    skipNextDataCheck: true,
    attachedStreamIds: {},
    pendingStreams: {},
    targetFromMessageId: undefined,
    targetMode: "normal"
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
    ...initialState,

    setThreadId: (threadId) => set({ threadId }),
    setFiles: (files) => set({ files }),
    setLastProcessedDataIndex: (lastProcessedDataIndex) => set({ lastProcessedDataIndex }),
    setShouldUpdateQuery: (shouldUpdateQuery) => set({ shouldUpdateQuery }),
    setSkipNextDataCheck: (skipNextDataCheck) => set({ skipNextDataCheck }),

    resetChat: () => {
        set({
            ...initialState,
            rerenderTrigger: nanoid(),
            attachedStreamIds: {},
            targetFromMessageId: undefined,
            targetMode: "normal"
        })
    },

    triggerRerender: () => {
        set({ rerenderTrigger: nanoid() })
    },

    setAttachedStreamId: (threadId, streamId) => {
        if (!threadId) return
        set((state) => ({
            attachedStreamIds: {
                ...state.attachedStreamIds,
                [threadId]: streamId
            }
        }))
    },

    setPendingStream: (threadId, pending) => {
        if (!threadId) return
        set((state) => ({
            pendingStreams: {
                ...state.pendingStreams,
                [threadId]: pending
            }
        }))
    },

    setTargetFromMessageId: (messageId) => set({ targetFromMessageId: messageId }),

    setTargetMode: (mode) => set({ targetMode: mode })
}))
