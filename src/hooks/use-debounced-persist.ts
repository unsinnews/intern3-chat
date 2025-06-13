import { useEffect, useRef } from "react"

/**
 * Custom hook for debounced persistence operations
 * Useful for user input that changes frequently to avoid excessive localStorage writes
 */
export function useDebouncedPersist(
    value: string,
    persistFn: (value: string) => void,
    delay = 500
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            persistFn(value)
        }, delay)

        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                // Immediately persist on unmount to avoid data loss
                persistFn(value)
            }
        }
    }, [value, persistFn, delay])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])
}