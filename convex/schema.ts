import { defineSchema, defineTable } from "convex/server";
import { Message } from "./schema/message";
import { Thread, SharedThread } from "./schema/thread";
import { ResumableStream } from "./schema/streams";
import { ApiKey } from "./schema/apikey";

export { Thread, Message, SharedThread, ApiKey };

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
});
