"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"
import { useSession } from "@/hooks/auth-hooks"
import { authClient } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const emailSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address."
    })
})

const otpSchema = z.object({
    otp: z
        .string()
        .min(6, {
            message: "Please enter the 6-digit code."
        })
        .max(6, {
            message: "Code must be exactly 6 digits."
        })
})

const nameSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters."
    })
})

type EmailFormValues = z.infer<typeof emailSchema>
type OTPFormValues = z.infer<typeof otpSchema>
type NameFormValues = z.infer<typeof nameSchema>

export function AuthCard() {
    const router = useRouter()
    const { data: session, refetch: refetchSession } = useSession()
    const [step, setStep] = useState<"email" | "otp" | "onboarding">("email")
    const [email, setEmail] = useState("")

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: ""
        }
    })

    const otpForm = useForm<OTPFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: ""
        }
    })

    const nameForm = useForm<NameFormValues>({
        resolver: zodResolver(nameSchema),
        defaultValues: {
            name: ""
        }
    })

    // Check if user needs onboarding after session updates
    useEffect(() => {
        if (session?.user && !session?.user?.name && step === "otp") {
            setStep("onboarding")
        } else if (session?.user?.name && (step === "otp" || step === "onboarding")) {
            router.navigate({ to: "/" })
        }
    }, [session, step, router])

    const sendOTPMutation = useMutation({
        mutationFn: async (values: EmailFormValues) => {
            return await authClient.emailOtp.sendVerificationOtp({
                email: values.email,
                type: "sign-in"
            })
        },
        onSuccess: ({ error }, variables) => {
            if (error) {
                toast.error(error.message ?? "There was an error sending the code")
            } else {
                setEmail(variables.email)
                setStep("otp")
                toast.success("Verification code sent to your email!")
            }
        },
        onError: (error) => {
            toast.error(error.message ?? "There was an error sending the code")
        }
    })

    const verifyOTPMutation = useMutation({
        mutationFn: async (values: OTPFormValues) => {
            return await authClient.signIn.emailOtp({
                email: email,
                otp: values.otp
            })
        },
        onSuccess: async ({ error }) => {
            if (error) {
                toast.error(error.message ?? "Invalid verification code")
                otpForm.reset()
            } else {
                // Refetch session to check if user needs onboarding
                await refetchSession()
            }
        },
        onError: (error) => {
            toast.error(error.message ?? "Invalid verification code")
            otpForm.reset()
        }
    })

    const updateNameMutation = useMutation({
        mutationFn: async (values: NameFormValues) => {
            return await authClient.updateUser({
                name: values.name
            })
        },
        onSuccess: ({ error }) => {
            if (error) {
                toast.error(error.message ?? "Failed to update name")
            } else {
                router.navigate({ to: "/" })
            }
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to update name")
        }
    })

    const socialSignInMutation = useMutation({
        mutationFn: async (provider: "google" | "github") => {
            return await authClient.signIn.social({
                provider
            })
        },
        onError: (error) => {
            toast.error(error.message ?? `Failed to sign in with ${error}`)
        }
    })

    const onEmailSubmit = useCallback(
        (values: EmailFormValues) => {
            sendOTPMutation.mutate(values)
        },
        [sendOTPMutation]
    )

    const onOTPSubmit = useCallback(
        (values: OTPFormValues) => {
            verifyOTPMutation.mutate(values)
        },
        [verifyOTPMutation]
    )

    const onNameSubmit = useCallback(
        (values: NameFormValues) => {
            updateNameMutation.mutate(values)
        },
        [updateNameMutation]
    )

    const onBackToEmail = useCallback(() => {
        setStep("email")
        otpForm.reset()
    }, [otpForm])

    const currentTitle = useMemo(() => {
        if (step === "otp") {
            return "Enter verification code"
        }
        if (step === "onboarding") {
            return "Complete your profile"
        }
        return "Sign in to Intern3 Chat"
    }, [step])

    return (
        <div className="flex w-full max-w-sm flex-col gap-6">
            <Card className="overflow-hidden bg-card shadow-2xl">
                <CardHeader>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${step}-title`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardTitle className="text-xl">{currentTitle}</CardTitle>
                        </motion.div>
                    </AnimatePresence>
                </CardHeader>

                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === "email" ? (
                            <motion.div
                                key="email-step"
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "-100%", opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 200,
                                    duration: 0.4
                                }}
                            >
                                <CardContent className="grid gap-6 pb-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <Button
                                            variant="outline"
                                            className="h-10 w-full"
                                            onClick={() => socialSignInMutation.mutate("google")}
                                            disabled={socialSignInMutation.isPending}
                                        >
                                            {socialSignInMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <svg
                                                    className="mr-2 h-4 w-4"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                        fill="#4285F4"
                                                    />
                                                    <path
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                        fill="#34A853"
                                                    />
                                                    <path
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                        fill="#FBBC05"
                                                    />
                                                    <path
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                        fill="#EA4335"
                                                    />
                                                </svg>
                                            )}
                                            Continue with Google
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-10 w-full"
                                            onClick={() => socialSignInMutation.mutate("github")}
                                            disabled={socialSignInMutation.isPending}
                                        >
                                            {socialSignInMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <svg
                                                    className="mr-2 h-4 w-4"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                                </svg>
                                            )}
                                            Continue with GitHub
                                        </Button>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15, duration: 0.3 }}
                                        className="relative"
                                    >
                                        <div className="absolute inset-0 flex items-center">
                                            <Separator />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">
                                                Or continue with email
                                            </span>
                                        </div>
                                    </motion.div>

                                    <Form {...emailForm}>
                                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: 0.3 }}
                                            >
                                                <FormField
                                                    control={emailForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="email"
                                                                    placeholder="hello@t3.gg"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25, duration: 0.3 }}
                                                className="mt-3 text-muted-foreground text-sm"
                                            >
                                                We'll send you a 6-digit verification code.
                                            </motion.div>
                                            <motion.div
                                                className="mt-6 w-full"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3, duration: 0.3 }}
                                            >
                                                <Button
                                                    type="submit"
                                                    className="h-10 w-full"
                                                    disabled={sendOTPMutation.isPending}
                                                >
                                                    {sendOTPMutation.isPending
                                                        ? "Sending code..."
                                                        : "Continue with Email"}
                                                </Button>
                                            </motion.div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </motion.div>
                        ) : step === "otp" ? (
                            <motion.div
                                key="otp-step"
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "-100%", opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 200,
                                    duration: 0.4
                                }}
                            >
                                <Form {...otpForm}>
                                    <form onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
                                        <CardContent className="grid gap-6 pb-6">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1, duration: 0.3 }}
                                                className="text-center text-muted-foreground text-sm"
                                            >
                                                We sent a 6-digit code to{" "}
                                                <span className="font-medium text-foreground">
                                                    {email}
                                                </span>
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15, duration: 0.3 }}
                                            >
                                                <FormField
                                                    control={otpForm.control}
                                                    name="otp"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Verification Code</FormLabel>
                                                            <FormControl>
                                                                <div className="flex justify-center">
                                                                    <InputOTP
                                                                        maxLength={6}
                                                                        {...field}
                                                                    >
                                                                        <InputOTPGroup>
                                                                            <InputOTPSlot
                                                                                index={0}
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={1}
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={2}
                                                                            />
                                                                        </InputOTPGroup>
                                                                        <InputOTPSeparator />
                                                                        <InputOTPGroup>
                                                                            <InputOTPSlot
                                                                                index={3}
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={4}
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={5}
                                                                            />
                                                                        </InputOTPGroup>
                                                                    </InputOTP>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </motion.div>
                                        </CardContent>
                                        <CardFooter className="flex flex-col gap-3 pt-0">
                                            <motion.div
                                                className="w-full"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: 0.3 }}
                                            >
                                                <Button
                                                    type="submit"
                                                    className="h-10 w-full"
                                                    disabled={verifyOTPMutation.isPending}
                                                >
                                                    {verifyOTPMutation.isPending
                                                        ? "Verifying..."
                                                        : "Verify & Continue"}
                                                </Button>
                                            </motion.div>
                                            <motion.div
                                                className="w-full"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25, duration: 0.3 }}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-10 w-full"
                                                    onClick={onBackToEmail}
                                                >
                                                    Back to email
                                                </Button>
                                            </motion.div>
                                        </CardFooter>
                                    </form>
                                </Form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="onboarding-step"
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "-100%", opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 200,
                                    duration: 0.4
                                }}
                            >
                                <Form {...nameForm}>
                                    <form onSubmit={nameForm.handleSubmit(onNameSubmit)}>
                                        <CardContent className="grid gap-6 pb-6">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1, duration: 0.3 }}
                                                className="text-center text-muted-foreground text-sm"
                                            >
                                                Welcome! Let's get to know you better.
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15, duration: 0.3 }}
                                            >
                                                <FormField
                                                    control={nameForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Your Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Theo Browne"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </motion.div>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <motion.div
                                                className="w-full"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: 0.3 }}
                                            >
                                                <Button
                                                    type="submit"
                                                    className="h-10 w-full"
                                                    disabled={updateNameMutation.isPending}
                                                >
                                                    {updateNameMutation.isPending
                                                        ? "Saving..."
                                                        : "Complete Setup"}
                                                </Button>
                                            </motion.div>
                                        </CardFooter>
                                    </form>
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    )
}
