import r2 from "@convex-dev/r2/convex.config"
// convex/convex.config.ts
import { defineApp } from "convex/server"

const app = defineApp()

// Configure R2 component with environment variables
app.use(r2, {
    // R2 configuration will read from these environment variables:
    // R2_TOKEN
    // R2_ACCESS_KEY_ID
    // R2_SECRET_ACCESS_KEY
    // R2_ENDPOINT
    // R2_BUCKET
})

export default app
