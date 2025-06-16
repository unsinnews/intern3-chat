import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatePresence, motion } from "motion/react"

export function BetterAuthCard() {
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
                                    <CardContent className="grid gap-6 pb-6">
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1, duration: 0.3 }}
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15, duration: 0.3 }}
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2, duration: 0.3 }}
                                        >
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="deeznerds"
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
                                            <Button className="h-10 w-full">
                                                Create an account
                                            </Button>
                                        </motion.div>
                                    </CardFooter>
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
                                    <CardContent className="grid gap-6 pb-6">
                                        <motion.div
                                            className="grid gap-3"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1, duration: 0.3 }}
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15, duration: 0.3 }}
                                        >
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="deeznerds"
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
                                            <Button className="h-10 w-full">Sign in</Button>
                                        </motion.div>
                                    </CardFooter>
                                </motion.div>
                            </TabsContent>
                        </AnimatePresence>
                    </div>
                </Card>
            </Tabs>
        </div>
    )
}
