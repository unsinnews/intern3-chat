"use client"

import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useThemeManagement } from "@/hooks/use-theme-management"
import { extractThemeColors } from "@/lib/theme-utils"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import {
    ArrowLeft,
    ArrowRight,
    Bot,
    ExternalLink,
    Image,
    Key,
    Palette,
    Search,
    Settings,
    Sparkles,
    Wand2,
    Zap
} from "lucide-react"
import { CheckCircle, MoonIcon, SunIcon } from "lucide-react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useCallback, useState } from "react"

interface OnboardingStep {
    id: string
    title: string
    content: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
}

interface OnboardingDialogProps {
    isOpen: boolean
    onComplete: () => void
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: "welcome",
        title: "Welcome to intern3.chat",
        icon: Sparkles,
        content: (
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="mx-auto h-24 w-24 rounded-full border-2 border-primary/20">
                    <Logo />
                </div>
                <div className="max-w-md space-y-3 text-center">
                    <h3 className="font-bold text-2xl text-foreground">Welcome to intern3.chat</h3>

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="text-muted-foreground text-sm">Built by:</span>
                        <a
                            href="https://x.com/vishyfishy2"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                        >
                            @vishyfishy2
                        </a>
                        <a
                            href="https://x.com/iamsahaj_xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                        >
                            @iamsahaj_xyz
                        </a>
                        <a
                            href="https://x.com/blakssh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                        >
                            @blakssh
                        </a>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "themes",
        title: "Beautiful Themes",
        icon: Palette,
        content: (
            <div className="flex w-full flex-col items-center space-y-4">
                <ThemeSelector />
                <div className="space-y-2 text-center">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Try switching themes and modes above! You can always change this later in
                        settings.
                    </p>
                    <Link to="/settings/appearance">
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                            <Settings className="h-3 w-3" />
                            More Themes
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </div>
        )
    },
    {
        id: "byok",
        title: "Bring Your Own Keys (BYOK)",
        icon: Key,
        content: (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                        <Bot className="h-6 w-6 text-primary" />
                        <div>
                            <div className="font-medium text-sm">OpenAI</div>
                            <div className="text-muted-foreground text-xs">GPT-4, GPT-3.5</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                        <Zap className="h-6 w-6 text-primary" />
                        <div>
                            <div className="font-medium text-sm">Anthropic</div>
                            <div className="text-muted-foreground text-xs">Claude 3</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <h3 className="font-semibold text-xl">Your Keys, Your Control</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Connect your own API keys for unlimited usage, better privacy, and access to
                        the latest models. All keys are encrypted and stored securely.
                    </p>
                    <Link to="/settings/providers">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Key className="h-4 w-4" />
                            Setup API Keys
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </div>
        )
    },
    {
        id: "search",
        title: "Web Search & Research",
        icon: Search,
        content: (
            <div className="space-y-6">
                <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                    <div className="flex items-start space-x-3">
                        <Search className="mt-0.5 h-5 w-5 text-primary" />
                        <div className="space-y-2">
                            <div className="font-medium text-sm">
                                "What's the latest news about AI?"
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-xs">
                                    Brave Search
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    Tavily
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    Serper
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <h3 className="font-semibold text-xl">Real-time Information</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Access up-to-date information from the web. Choose from multiple search
                        providers and get comprehensive answers backed by real sources.
                    </p>
                    <Link to="/settings/ai-options">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Search className="h-4 w-4" />
                            Configure Search
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </div>
        )
    },
    {
        id: "features",
        title: "More Amazing Features",
        icon: Wand2,
        content: (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                        <Image className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Image Generation</div>
                            <div className="text-muted-foreground text-xs">
                                Create stunning visuals with AI
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                        <Bot className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Multiple AI Models</div>
                            <div className="text-muted-foreground text-xs">
                                Switch between different AI providers
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                        <Settings className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Advanced Customization</div>
                            <div className="text-muted-foreground text-xs">
                                Tailor everything to your needs
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Explore all these features and more to enhance your AI conversations.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: "ready",
        title: "Ready to Get Started?",
        icon: Sparkles,
        content: (
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10">
                    <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <div className="max-w-md space-y-4">
                    <h3 className="font-bold text-2xl text-foreground">You're All Set! 🚀</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Start chatting with AI and make intern3.chat truly yours!
                    </p>
                </div>
            </div>
        )
    }
]

function ThemeSelector() {
    const { themeState, filteredThemes, handleThemeSelect, toggleMode, selectedThemeUrl } =
        useThemeManagement()

    const popularThemes = filteredThemes.filter((theme) => theme.type === "built-in").slice(0, 4)

    return (
        <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Color Mode</h4>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMode}
                    className="flex h-8 items-center justify-center gap-2 px-3"
                >
                    <div className="relative flex h-3 w-3 items-center justify-center">
                        <SunIcon className="dark:-rotate-90 absolute h-3 w-3 transition-all duration-300 dark:scale-0" />
                        <MoonIcon className="absolute h-3 w-3 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
                    </div>
                    <span className="text-xs">
                        {themeState.currentMode === "light" ? "Light" : "Dark"}
                    </span>
                </Button>
            </div>

            <div className="space-y-3">
                <h4 className="font-medium text-sm">Popular Themes</h4>
                <div className="grid grid-cols-2 gap-2">
                    {popularThemes.map((theme) => {
                        const colors =
                            "error" in theme && theme.error
                                ? []
                                : "preset" in theme
                                  ? extractThemeColors(theme.preset, themeState.currentMode)
                                  : []
                        const isSelected = selectedThemeUrl === theme.url

                        return (
                            <button
                                type="button"
                                key={theme.url}
                                onClick={() => handleThemeSelect(theme)}
                                className={cn(
                                    "relative overflow-hidden rounded-lg border p-2 text-left transition-all hover:scale-[1.02]",
                                    isSelected
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="truncate font-medium text-xs">
                                        {theme.name}
                                    </span>
                                    {isSelected && (
                                        <CheckCircle className="h-3 w-3 flex-shrink-0 text-primary" />
                                    )}
                                </div>
                                {colors.length > 0 && (
                                    <div className="flex h-1.5 overflow-hidden rounded">
                                        {colors.slice(0, 4).map((color, index) => (
                                            <div
                                                key={index}
                                                className="flex-1"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export function OnboardingDialog({ isOpen, onComplete }: OnboardingDialogProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const currentStepData = ONBOARDING_STEPS[currentStep]

    const handleNext = useCallback(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onComplete()
        }
    }, [currentStep, onComplete])

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }, [currentStep])

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent
                className="w-[95vw] max-w-2xl border-0 bg-transparent p-0 shadow-none sm:w-full"
                showCloseButton={false}
            >
                <MotionConfig
                    transition={{
                        type: "spring",
                        duration: 0.4,
                        bounce: 0.1
                    }}
                >
                    <Card className="inset-shadow-sm w-full max-w-none overflow-hidden border-2 bg-card pt-3 pb-5">
                        <div className="relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <CardContent className="flex flex-col items-center px-4 py-4 sm:px-6">
                                        <div className="flex w-full max-w-lg justify-center">
                                            {currentStepData.content}
                                        </div>
                                    </CardContent>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <CardFooter className="relative flex items-center justify-between border-t-2 px-4 pt-4 sm:px-6">
                            <Button
                                variant="secondary"
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className="h-8 gap-2 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                            >
                                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Previous</span>
                                <span className="sm:hidden">Prev</span>
                            </Button>

                            <div className="flex gap-1">
                                {ONBOARDING_STEPS.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                            index === currentStep
                                                ? "w-6 bg-primary"
                                                : index < currentStep
                                                  ? "bg-primary/60"
                                                  : "bg-muted-foreground/20"
                                        }`}
                                    />
                                ))}
                            </div>

                            <Button
                                onClick={handleNext}
                                className="h-8 gap-2 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                            >
                                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                                    <>
                                        <span className="hidden sm:inline">Get Started</span>
                                        <span className="sm:hidden">Start</span>
                                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Next</span>
                                        <span className="sm:hidden">Next</span>
                                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </MotionConfig>
            </DialogContent>
        </Dialog>
    )
}
