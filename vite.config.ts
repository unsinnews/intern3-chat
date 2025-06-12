// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@/convex": path.resolve(__dirname, "./convex"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tanstackStart({ target: "vercel" }),

    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    svgr({ include: "**/*.svg" }),
  ],
});
