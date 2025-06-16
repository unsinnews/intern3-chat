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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const signUpSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters."
    }),
    email: z.string().email({
        message: "Please enter a valid email address."
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters."
    })
})

const signInSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address."
    }),
    password: z.string().min(1, {
        message: "Password is required."
    })
})

type SignUpFormValues = z.infer<typeof signUpSchema>
type SignInFormValues = z.infer<typeof signInSchema>

export function AuthCard() {
    const router = useRouter()
    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: ""
        }
    })

    const signInForm = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })

    const signUpMutation = useMutation({
        mutationFn: async (values: SignUpFormValues) => {
            return await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: values.name
            })
        },
        onSuccess: () => {
            router.navigate({ to: "/" })
        },
        onError: (error) => {
            toast.error(error.message ?? "There was an error signing up")
        }
    })

    const signInMutation = useMutation({
        mutationFn: async (values: SignInFormValues) => {
            return await authClient.signIn.email({
                email: values.email,
                password: values.password
            })
        },
        onSuccess: () => {
            router.navigate({ to: "/" })
        },
        onError: (error) => {
            toast.error(error.message ?? "There was an error signing in")
        }
    })

    function onSignUpSubmit(values: SignUpFormValues) {
        signUpMutation.mutate(values)
    }

    function onSignInSubmit(values: SignInFormValues) {
        signInMutation.mutate(values)
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-6">
            <Tabs defaultValue="sign-up">
                <Card className="overflow-hidden bg-card shadow-2xl">
                    <CardHeader>
                        <TabsList className="mb-4 dark:bg-background/70">
                            <TabsTrigger value="sign-up">Sign up</TabsTrigger>
                            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
                        </TabsList>
                        <AnimatePresence mode="wait">
                            <TabsContent value="sign-up" className="mt-0">
                                <motion.div
                                    key="sign-up-title"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CardTitle className="text-xl">Create an account</CardTitle>
                                </motion.div>
                            </TabsContent>
                            <TabsContent value="sign-in" className="mt-0">
                                <motion.div
                                    key="sign-in-title"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CardTitle className="text-xl">Sign In</CardTitle>
                                </motion.div>
                            </TabsContent>
                        </AnimatePresence>
                    </CardHeader>

                    <div className="relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <TabsContent value="sign-up" className="m-0">
                                <motion.div
                                    key="sign-up-content"
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
                                    <Form {...signUpForm}>
                                        <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}>
                                            <CardContent className="grid gap-6 pb-6">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1, duration: 0.3 }}
                                                >
                                                    <FormField
                                                        control={signUpForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
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
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.15, duration: 0.3 }}
                                                >
                                                    <FormField
                                                        control={signUpForm.control}
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
                                                    transition={{ delay: 0.2, duration: 0.3 }}
                                                >
                                                    <FormField
                                                        control={signUpForm.control}
                                                        name="password"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Password</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="deeznerds"
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
                                                    transition={{ delay: 0.25, duration: 0.3 }}
                                                >
                                                    <Button
                                                        type="submit"
                                                        className="h-10 w-full"
                                                        disabled={signUpMutation.isPending}
                                                    >
                                                        {signUpMutation.isPending
                                                            ? "Creating account..."
                                                            : "Create an account"}
                                                    </Button>
                                                </motion.div>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="sign-in" className="m-0">
                                <motion.div
                                    key="sign-in-content"
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
                                    <Form {...signInForm}>
                                        <form onSubmit={signInForm.handleSubmit(onSignInSubmit)}>
                                            <CardContent className="grid gap-6 pb-6">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1, duration: 0.3 }}
                                                >
                                                    <FormField
                                                        control={signInForm.control}
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
                                                    transition={{ delay: 0.15, duration: 0.3 }}
                                                >
                                                    <FormField
                                                        control={signInForm.control}
                                                        name="password"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Password</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="deeznerds"
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
                                                        disabled={signInMutation.isPending}
                                                    >
                                                        {signInMutation.isPending
                                                            ? "Signing in..."
                                                            : "Sign in"}
                                                    </Button>
                                                </motion.div>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </motion.div>
                            </TabsContent>
                        </AnimatePresence>
                    </div>
                </Card>
            </Tabs>
        </div>
    )
}
