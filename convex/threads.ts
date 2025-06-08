import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ChatError } from "@/lib/errors";
import { HTTPAIMessage } from "./schema/message";
import { nanoid } from "nanoid";
import { getUserIdentity } from "./lib/identity";

export const getThreadById = internalQuery({
  args: { threadId: v.id("threads") },
  handler: async ({ db }, { threadId }) => {
    const thread = await db.get(threadId);
    if (!thread) return null;
    return thread;
  },
});

export const createThreadOrInsertMessages = internalMutation({
  args: {
    threadId: v.optional(v.string()),
    authorId: v.string(),
    userMessage: v.optional(HTTPAIMessage),
    proposedNewAssistantId: v.string(),
  },
  handler: async (
    { db },
    { threadId, authorId, userMessage, proposedNewAssistantId }
  ) => {
    if (!userMessage) return new ChatError("bad_request:chat");

    if (!threadId) {
      const userMessageId_new = userMessage.messageId || nanoid();
      const newUserMessage_new = {
        messageId: userMessageId_new,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        parts: userMessage.parts,
        role: userMessage.role,
      };
      const newAssistantMessage_new = {
        messageId: proposedNewAssistantId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        parts: [],
        role: "assistant" as const,
      };

      const newId = await db.insert("threads", {
        authorId,
        title: "New Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await db.insert("messages", {
        threadId: newId,
        ...newUserMessage_new,
      });
      const assistantMessageConvexId = await db.insert("messages", {
        threadId: newId,
        ...newAssistantMessage_new,
      });

      return {
        threadId: newId,
        userMessageId: userMessageId_new,
        assistantMessageId: proposedNewAssistantId,
        assistantMessageConvexId,
      };
    }

    // new thread flow
    const thread = await db.get(threadId as Id<"threads">);
    if (!thread) {
      console.error(
        "[cvx][createThreadOrInsertMessages] Thread not found",
        threadId
      );
      return undefined;
    }

    const userMessageId_existing = userMessage.messageId || nanoid();
    const newUserMessage_existing = {
      messageId: userMessageId_existing,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
      parts: userMessage.parts,
      role: userMessage.role,
    };
    const newAssistantMessage_existing = {
      messageId: proposedNewAssistantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
      parts: [],
      role: "assistant" as const,
    };

    await db.insert("messages", {
      threadId: threadId as Id<"threads">,
      ...newUserMessage_existing,
    });
    const assistantMessageConvexId = await db.insert("messages", {
      threadId: threadId as Id<"threads">,
      ...newAssistantMessage_existing,
    });

    return {
      threadId: threadId as Id<"threads">,
      userMessageId: userMessageId_existing,
      assistantMessageId: proposedNewAssistantId,
      assistantMessageConvexId,
    };
  },
});

// New query to fetch all messages for a thread (public)
export const getThreadMessages = query({
  args: { threadId: v.id("threads") },
  handler: async ({ db, auth }, { threadId }) => {
    const user = await getUserIdentity(auth, {
      allowAnons: true,
    });

    if ("error" in user) return { error: user.error };

    const thread = await db.get(threadId);
    if (!thread || thread.authorId !== user.id)
      return { error: "Unauthorized" };

    const messages = await db
      .query("messages")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .collect();

    return messages;
  },
});
