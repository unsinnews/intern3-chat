import { Loader } from "@/components/ui/loader"
import { MODELS_SHARED } from "@/convex/lib/models"
import { browserEnv } from "@/lib/browser-env"
import type { ToolInvocation } from "ai"
import { AlertCircle, Download } from "lucide-react"
import { memo, useMemo, useState } from "react"
import { Button } from "../ui/button"

export const ImageGenerationToolRenderer = memo(
    ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
        if (toolInvocation.toolName !== "image_generation") return null

        const isLoading = toolInvocation.state === "partial-call" || toolInvocation.state === "call"
        const hasResult = toolInvocation.state === "result" && toolInvocation.result
        const hasError = hasResult && "error" in toolInvocation.result

        // Extract aspect ratio from args to determine container dimensions
        const aspectRatio = toolInvocation.args?.imageSize || "1:1"

        // Convert aspect ratio to CSS aspect-ratio value
        const cssAspectRatio = useMemo(() => {
            if (aspectRatio.includes("x")) {
                // Handle resolution format (1024x1024 -> 1/1)
                const [width, height] = aspectRatio.split("x").map(Number)
                return `${width}/${height}`
            }
            if (aspectRatio.includes(":")) {
                // Handle aspect ratio format (16:9 -> 16/9, 1:1-hd -> 1/1)
                const baseRatio = aspectRatio.replace("-hd", "")
                return baseRatio.replace(":", "/")
            }
            return "1/1" // fallback
        }, [aspectRatio])

        // Format aspect ratio for display
        const displayAspectRatio = useMemo(() => {
            if (aspectRatio.includes("x")) {
                const [width, height] = aspectRatio.split("x").map(Number)
                const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
                const divisor = gcd(width, height)
                return `${width / divisor}:${height / divisor}`
            }
            return aspectRatio.replace("-hd", " (HD)")
        }, [aspectRatio])

        if (isLoading) {
            return (
                <div
                    className="flex w-full max-w-md items-center justify-center rounded-lg border bg-muted/50"
                    style={{ aspectRatio: cssAspectRatio }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Loader variant="circular" size="lg" />
                        <p className="text-muted-foreground text-sm">Creating your image...</p>
                    </div>
                </div>
            )
        }

        if (hasError) {
            return (
                <div
                    className="flex w-full max-w-md flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10"
                    style={{ aspectRatio: cssAspectRatio }}
                >
                    <AlertCircle className="mx-auto mb-2 size-8 text-destructive/70" />
                    <p className="text-destructive text-sm">
                        {toolInvocation.result.error || "Failed to generate image"}
                    </p>
                </div>
            )
        }

        if (hasResult && toolInvocation.result.assets) {
            const assets = toolInvocation.result.assets
            const prompt = toolInvocation.result.prompt || toolInvocation.args?.prompt

            const modelName = toolInvocation.result.modelId
                ? MODELS_SHARED.find((m) => m.id === toolInvocation.result.modelId)?.name
                : toolInvocation.result.modelId

            return assets.map((asset, index) => (
                <ImageWithErrorHandler
                    key={index}
                    asset={asset}
                    prompt={prompt}
                    modelName={modelName}
                    cssAspectRatio={cssAspectRatio}
                />
            ))
        }

        return null
    }
)

ImageGenerationToolRenderer.displayName = "ImageGenerationToolRenderer"

const ImageWithErrorHandler = memo(
    ({
        asset,
        prompt,
        modelName,
        cssAspectRatio
    }: { asset: any; prompt: string; modelName: string; cssAspectRatio: string }) => {
        const [isError, setIsError] = useState(false)

        if (isError) {
            return (
                <div
                    className="flex w-full max-w-md items-center justify-center rounded-lg border bg-muted/50"
                    style={{ aspectRatio: cssAspectRatio }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="mx-auto mb-2 size-8 text-destructive/70" />
                        <p className="text-destructive text-sm">Failed to load image</p>
                    </div>
                </div>
            )
        }
        return (
            <div
                className="not-prose group relative w-full max-w-md overflow-hidden"
                style={{ aspectRatio: cssAspectRatio }}
            >
                <img
                    src={`${browserEnv("VITE_CONVEX_API_URL")}/r2?key=${asset.imageUrl}`}
                    alt={prompt || "Generated image"}
                    className="absolute inset-0 w-full max-w-md border bg-background object-cover"
                    style={{ aspectRatio: cssAspectRatio }}
                    onError={(e) => {
                        // const target = e.target as HTMLImageElement
                        // target.style.display = "none"
                        // const errorDiv = target.nextElementSibling as HTMLElement
                        // if (errorDiv) errorDiv.style.display = "flex"
                        setIsError(true)
                    }}
                />

                <div className="absolute inset-0 z-10 flex h-full w-full items-end justify-start bg-black/30 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex w-full items-center gap-2">
                        <p className="flex h-8 items-center justify-center rounded-md bg-secondary px-2.5 text-xs">
                            {modelName}
                        </p>
                        <div className="flex-grow" />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                const url = `${browserEnv("VITE_CONVEX_API_URL")}/r2?key=${asset.imageUrl}`
                                window.open(url, "_blank")
                            }}
                            className="hover:bg-primary hover:text-primary-foreground"
                        >
                            <Download className="size-4" />
                            Download
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
)
