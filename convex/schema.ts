import { defineSchema, defineTable } from "convex/server"
import { Message } from "./schema/message"
import { UserSettings } from "./schema/settings"
import { ResumableStream } from "./schema/streams"
import { SharedThread, Thread } from "./schema/thread"
import { UsageEvent } from "./schema/usage"

export { Thread, Message, SharedThread, UsageEvent, UserSettings }

export default defineSchema({
    threads: defineTable(Thread)
        .index("byAuthor", ["authorId", "createdAt"])
        .index("byAuthorTitle", ["title"])
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["authorId"]
        }),

    messages: defineTable(Message)
        .index("byThreadId", ["threadId"])
        .index("byMessageId", ["messageId"]),

    sharedThreads: defineTable(SharedThread).index("byAuthorId", ["authorId"]),
    streams: defineTable(ResumableStream).index("byThreadId", ["threadId"]),
    // apiKeys: defineTable(ApiKey)
    //     .index("byUser", ["userId"])
    //     .index("byUserProvider", ["userId", "provider"]),
    settings: defineTable(UserSettings).index("byUser", ["userId"]),

    usageEvents: defineTable(UsageEvent).index("byUserDay", ["userId", "daysSinceEpoch"])
})
