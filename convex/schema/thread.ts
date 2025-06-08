import { v } from "convex/values";
import { AIMessage } from "./message";

export const Thread = v.object({
  authorId: v.string(),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const SharedThread = v.object({
  originalThreadId: v.id("threads"),
  authorId: v.string(),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  messages: v.array(AIMessage),
  includeAttachments: v.boolean(),
});
