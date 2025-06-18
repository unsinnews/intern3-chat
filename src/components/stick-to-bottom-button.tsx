import { ChevronDown } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "./ui/button"

export const StickToBottomButton = ({
    isAtBottom,
    scrollToBottom
}: { isAtBottom: boolean; scrollToBottom: () => void }) => {
    return (
        <AnimatePresence>
            {!isAtBottom && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                >
                    <Button
                        onClick={() => scrollToBottom()}
                        size="sm"
                        variant="secondary"
                        className="rounded-full border bg-background/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-background/90"
                    >
                        <ChevronDown className="h-4 w-4" />
                        <span>Scroll to bottom</span>
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
