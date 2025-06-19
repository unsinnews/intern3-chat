import { useSession } from "@/hooks/auth-hooks"
import { useEffect, useState } from "react"

const ONBOARDING_STORAGE_KEY = "intern3-onboarding-completed"
const ONBOARDING_USER_KEY = "intern3-onboarded-users"

export function useOnboarding() {
    const { data: session } = useSession()
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!session?.user?.id) {
            setIsLoading(false)
            setShouldShowOnboarding(false)
            return
        }

        const userId = session.user.id

        try {
            // Check if user has completed onboarding
            const globalOnboardingCompleted =
                localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true"

            // Check if this specific user has been onboarded
            const onboardedUsersRaw = localStorage.getItem(ONBOARDING_USER_KEY)
            const onboardedUsers: string[] = onboardedUsersRaw ? JSON.parse(onboardedUsersRaw) : []
            const userOnboarded = onboardedUsers.includes(userId)

            // Check if user was created recently (within last 5 minutes - indicating new signup)
            const userCreatedAt = session.user.createdAt
            const isRecentUser = userCreatedAt
                ? Date.now() - new Date(userCreatedAt).getTime() < 5 * 60 * 1000
                : false

            // Show onboarding if:
            // 1. Global onboarding never completed AND this user hasn't been onboarded AND user is recent
            // OR
            // 2. Force show for new users regardless (you can adjust this logic)
            const shouldShow =
                (!globalOnboardingCompleted && !userOnboarded && isRecentUser) ||
                (!userOnboarded && isRecentUser)

            setShouldShowOnboarding(shouldShow)
        } catch (error) {
            console.error("Error checking onboarding status:", error)
            setShouldShowOnboarding(false)
        } finally {
            setIsLoading(false)
        }
    }, [session?.user?.id, session?.user?.createdAt])

    const completeOnboarding = () => {
        if (!session?.user?.id) return

        const userId = session.user.id

        try {
            // Mark global onboarding as completed
            localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")

            // Add user to the list of onboarded users
            const onboardedUsersRaw = localStorage.getItem(ONBOARDING_USER_KEY)
            const onboardedUsers: string[] = onboardedUsersRaw ? JSON.parse(onboardedUsersRaw) : []

            if (!onboardedUsers.includes(userId)) {
                onboardedUsers.push(userId)
                localStorage.setItem(ONBOARDING_USER_KEY, JSON.stringify(onboardedUsers))
            }

            setShouldShowOnboarding(false)
        } catch (error) {
            console.error("Error completing onboarding:", error)
        }
    }

    const resetOnboarding = () => {
        try {
            localStorage.removeItem(ONBOARDING_STORAGE_KEY)
            localStorage.removeItem(ONBOARDING_USER_KEY)
            setShouldShowOnboarding(true)
        } catch (error) {
            console.error("Error resetting onboarding:", error)
        }
    }

    return {
        shouldShowOnboarding,
        isLoading,
        completeOnboarding,
        resetOnboarding
    }
}
