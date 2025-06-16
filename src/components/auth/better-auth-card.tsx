import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatePresence, motion } from "motion/react"

export function BetterAuthCard() {
    return (
        <div className="flex w-full max-w-sm flex-col gap-6">
            {/* SVG Filter for Gooey Effect */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                            result="gooey"
                        />
                        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <Tabs defaultValue="sign-up">
                <TabsContent value="sign-up">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="sign-up"
                            initial={{ opacity: 0, scale: 0.8, filter: "url(#gooey-filter)" }}
                            animate={{ opacity: 1, scale: 1, filter: "url(#gooey-filter)" }}
                            exit={{ opacity: 0, scale: 0.8, filter: "url(#gooey-filter)" }}
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 0.46, 0.45, 0.94],
                                scale: {
                                    type: "spring",
                                    damping: 15,
                                    stiffness: 100
                                }
                            }}
                            style={{ filter: "url(#gooey-filter)" }}
                            className="relative"
                        >
                            <motion.div
                                initial={{ borderRadius: "50%" }}
                                animate={{ borderRadius: "12px" }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: 0.1
                                }}
                            >
                                <Card className="overflow-hidden bg-card shadow-2xl">
                                    <CardHeader>
                                        <TabsList className="mb-4 dark:bg-background/70">
                                            <TabsTrigger value="sign-up">Sign up</TabsTrigger>
                                            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
                                        </TabsList>
                                        <CardTitle className="text-xl">Create an account</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.2,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="Theo Browne"
                                            />
                                        </motion.div>
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.3,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="hello@t3.gg"
                                            />
                                        </motion.div>
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.4,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="deeznerds"
                                            />
                                        </motion.div>
                                    </CardContent>
                                    <CardFooter>
                                        <motion.div
                                            className="w-full"
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.5,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Button className="h-10 w-full">
                                                Create an account
                                            </Button>
                                        </motion.div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>
                <TabsContent value="sign-in">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="sign-in"
                            initial={{ opacity: 0, scale: 0.8, filter: "url(#gooey-filter)" }}
                            animate={{ opacity: 1, scale: 1, filter: "url(#gooey-filter)" }}
                            exit={{ opacity: 0, scale: 0.8, filter: "url(#gooey-filter)" }}
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 0.46, 0.45, 0.94],
                                scale: {
                                    type: "spring",
                                    damping: 15,
                                    stiffness: 100
                                }
                            }}
                            style={{ filter: "url(#gooey-filter)" }}
                            className="relative"
                        >
                            <motion.div
                                initial={{ borderRadius: "50%" }}
                                animate={{ borderRadius: "12px" }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: 0.1
                                }}
                            >
                                <Card className="overflow-hidden bg-card shadow-2xl">
                                    <CardHeader>
                                        <TabsList className="mb-4 dark:bg-background/70">
                                            <TabsTrigger value="sign-up">Sign up</TabsTrigger>
                                            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
                                        </TabsList>
                                        <CardTitle className="text-xl">Sign In</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.2,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="hello@t3.gg"
                                            />
                                        </motion.div>
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.3,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="deeznerds"
                                            />
                                        </motion.div>
                                    </CardContent>
                                    <CardFooter>
                                        <motion.div
                                            className="w-full"
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                delay: 0.4,
                                                duration: 0.4,
                                                type: "spring",
                                                damping: 10
                                            }}
                                        >
                                            <Button className="h-10 w-full">Sign in</Button>
                                        </motion.div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>
            </Tabs>
        </div>
    )
}
