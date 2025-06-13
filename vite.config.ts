import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"
import tsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    resolve: {
        alias: {
            "@/convex": path.resolve(__dirname, "./convex"),
            "@": path.resolve(__dirname, "./src")
        }
    },
    plugins: [
        tanstackStart({
            target: "vercel", react: {
                babel: {
                    plugins: [["babel-plugin-react-compiler", {}]],
                }
            }
        }),

        tsConfigPaths({
            projects: ["./tsconfig.json"]
        }),
        tailwindcss(),
        svgr({ include: "**/*.svg" })
    ]
})
