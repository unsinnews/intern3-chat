import { nanoid } from "nanoid"
import { create } from "zustand"
import { saveUserInput, clearUserInput, loadUserInput } from "@/lib/persistence"

interface ChatState {
    threadId: string | undefined
    input: string
    files: File[]
    rerenderTrigger: string
    seedNextId: string | null
    lastProcessedDataIndex: number
    shouldUpdateQuery: boolean
    skipNextDataCheck: boolean
    attachedStreamIds: Record<string, string>
    pendingStreams: Record<string, boolean>
}

interface ChatActions {
    setThreadId: (threadId: string | undefined) => void
    setInput: (input: string) => void
    setFiles: (files: File[]) => void
    setSeedNextId: (id: string | null) => void
    setLastProcessedDataIndex: (index: number) => void
    setShouldUpdateQuery: (should: boolean) => void
    setSkipNextDataCheck: (skip: boolean) => void
    generateIdSeeded: () => string
    resetChat: () => void
    triggerRerender: () => void
    setAttachedStreamId: (threadId: string, streamId: string) => void
    setPendingStream: (threadId: string, pending: boolean) => void
}

// Load initial input from localStorage
const initialInput = loadUserInput()

const initialState: ChatState = {
    threadId: undefined,
    input: initialInput,
    files: [],
    rerenderTrigger: nanoid(),
    seedNextId: null,
    lastProcessedDataIndex: -1,
    shouldUpdateQuery: false,
    skipNextDataCheck: true,
    attachedStreamIds: {},
    pendingStreams: {}
}

// Debounced persistence for user input
let inputPersistTimeout: NodeJS.Timeout | null = null
const debouncedPersistInput = (input: string) => {
    if (inputPersistTimeout) {
        clearTimeout(inputPersistTimeout)
    }
    inputPersistTimeout = setTimeout(() => {
        saveUserInput(input)
    }, 300) // 300ms debounce for better UX while typing
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
    ...initialState,

    setThreadId: (threadId) => set({ threadId }),
    
    setInput: (input) => {
        set({ input })
        // Use debounced persistence for user input
        debouncedPersistInput(input)
    },
    
    setFiles: (files) => set({ files }),
    setSeedNextId: (seedNextId) => set({ seedNextId }),
    setLastProcessedDataIndex: (lastProcessedDataIndex) => set({ lastProcessedDataIndex }),
    setShouldUpdateQuery: (shouldUpdateQuery) => set({ shouldUpdateQuery }),
    setSkipNextDataCheck: (skipNextDataCheck) => set({ skipNextDataCheck }),

    generateIdSeeded: () => {
        const { seedNextId } = get()
        if (seedNextId) {
            set({ seedNextId: null })
            return seedNextId
        }
        return nanoid()
    },

    resetChat: () => {
        // Clear any pending input persistence
        if (inputPersistTimeout) {
            clearTimeout(inputPersistTimeout)
            inputPersistTimeout = null
        }
        // Immediately clear persisted input when resetting chat
        clearUserInput()
        set({
            ...initialState,
            rerenderTrigger: nanoid(),
            attachedStreamIds: {},
            input: "" // Reset to empty since we cleared localStorage
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

// Ensure input is persisted when the page is about to unload
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
        if (inputPersistTimeout) {
            clearTimeout(inputPersistTimeout)
            const currentInput = useChatStore.getState().input
            saveUserInput(currentInput)
        }
    })
}
