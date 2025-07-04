"use client"

import { useOnboarding } from "@/hooks/use-onboarding"
import { useEffect, useState } from "react"
import { OnboardingDialog } from "./onboarding-dialog"

interface OnboardingProviderProps {
    children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
    const { shouldShowOnboarding, isLoading, completeOnboarding } = useOnboarding()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (!isLoading && shouldShowOnboarding) {
            // Add a small delay to ensure the app is fully loaded
            const timer = setTimeout(() => {
                setIsDialogOpen(true)
            }, 1000)

            return () => clearTimeout(timer)
        }

        if (!isLoading && !shouldShowOnboarding) {
            // If onboarding is complete, make sure dialog is closed
            setIsDialogOpen(false)
        }
    }, [isLoading, shouldShowOnboarding])

    const handleOnboardingComplete = async () => {
        setIsDialogOpen(false)
        await completeOnboarding()
    }

    return (
        <>
            {children}
            <OnboardingDialog isOpen={isDialogOpen} onComplete={handleOnboardingComplete} />
        </>
    )
}
