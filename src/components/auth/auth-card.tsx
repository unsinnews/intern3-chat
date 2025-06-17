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
import { GithubIcon, GoogleIcon, TwitchIcon } from "../brand-icons"

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
        mutationFn: async (provider: "google" | "github" | "twitch") => {
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
                                <CardContent className="grid gap-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <Button
                                            variant="outline"
                                            className="h-10 w-full gap-2"
                                            onClick={() => socialSignInMutation.mutate("google")}
                                            disabled={socialSignInMutation.isPending}
                                        >
                                            {socialSignInMutation.isPending ? (
                                                <Loader2 className="size-4 shrink-0 animate-spin" />
                                            ) : (
                                                <GoogleIcon className="size-4 shrink-0" />
                                            )}
                                            Continue with Google
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-10 w-full gap-2"
                                            onClick={() => socialSignInMutation.mutate("github")}
                                            disabled={socialSignInMutation.isPending}
                                        >
                                            {socialSignInMutation.isPending ? (
                                                <Loader2 className="size-4 shrink-0 animate-spin" />
                                            ) : (
                                                <GithubIcon className="size-5 shrink-0" />
                                            )}
                                            Continue with GitHub
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-10 w-full gap-2"
                                            onClick={() => socialSignInMutation.mutate("twitch")}
                                            disabled={socialSignInMutation.isPending}
                                        >
                                            {socialSignInMutation.isPending ? (
                                                <Loader2 className="size-4 shrink-0 animate-spin" />
                                            ) : (
                                                <TwitchIcon className="size-5 shrink-0" />
                                            )}
                                            Continue with Twitch
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
                                        <CardContent className="grid gap-6">
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
                                        <CardContent className="flex flex-col gap-6">
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
