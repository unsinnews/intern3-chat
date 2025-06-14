import { defineSchema, defineTable } from "convex/server"
import { ApiKey } from "./schema/apikey"
import { Message } from "./schema/message"
import { ResumableStream } from "./schema/streams"
import { SharedThread, Thread } from "./schema/thread"
import { UsageEvent } from "./schema/usage"

export { Thread, Message, SharedThread, ApiKey, UsageEvent }

export default defineSchema({
    threads: defineTable(Thread)
        .index("byAuthor", ["authorId", "createdAt"])
        .index("byAuthorTitle", ["title"]),

    messages: defineTable(Message)
        .index("byThreadId", ["threadId"])
        .index("byMessageId", ["messageId"]),

    sharedThreads: defineTable(SharedThread).index("byAuthorId", ["authorId"]),
    streams: defineTable(ResumableStream).index("byThreadId", ["threadId"]),
    apiKeys: defineTable(ApiKey)
        .index("byUser", ["userId"])
        .index("byUserProvider", ["userId", "provider"]),

    usageEvents: defineTable(UsageEvent).index("byUserDay", ["userId", "daysSinceEpoch"])
})
