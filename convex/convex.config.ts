import aggregate from "@convex-dev/aggregate/convex.config"
import migrations from "@convex-dev/migrations/convex.config"
import r2 from "@convex-dev/r2/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()

app.use(r2, {})
app.use(aggregate, { name: "aggregateFolderThreads" })
app.use(migrations)

export default app
