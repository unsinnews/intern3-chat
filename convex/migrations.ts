// Migration setup - will be implemented when ready to migrate
import { Migrations } from "@convex-dev/migrations"
import { components, internal } from "./_generated/api.js"
import type { DataModel } from "./_generated/dataModel.js"
import { aggregrateThreadsByFolder } from "./aggregates.js"

export const migrations = new Migrations<DataModel>(components.migrations)

export const backfillUserThreadsAggregatesMigration = migrations.define({
    table: "threads",
    migrateOne: async (ctx, doc) => {
        await aggregrateThreadsByFolder.insertIfDoesNotExist(ctx, doc)
    }
})

export const runAggregateBackfill = migrations.runner([
    internal.migrations.backfillUserThreadsAggregatesMigration
])
