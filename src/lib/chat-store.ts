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
}

const initialState: ChatState = {
    threadId: undefined,
    files: [],
    rerenderTrigger: nanoid(),
    lastProcessedDataIndex: -1,
    shouldUpdateQuery: false,
    skipNextDataCheck: true,
    attachedStreamIds: {},
    pendingStreams: {}
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
            attachedStreamIds: {}
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
    }
}))
