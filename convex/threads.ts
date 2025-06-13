import { ChatError } from "@/lib/errors";
import { v } from "convex/values";
import { nanoid } from "nanoid";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { getUserIdentity } from "./lib/identity";
import { HTTPAIMessage } from "./schema/message";

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
    targetFromMessageId: v.optional(v.string()),
    targetMode: v.optional(
      v.union(v.literal("normal"), v.literal("edit"), v.literal("retry"))
    ),
  },
  handler: async (
    { db },
    {
      threadId,
      authorId,
      userMessage,
      proposedNewAssistantId,
      targetFromMessageId,
      targetMode,
    }
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

    // Handle edit mode - delete messages after the edited message
    let originalAssistantMessageId = proposedNewAssistantId;
    if (targetFromMessageId) {
      const allMessages = await db
        .query("messages")
        .withIndex("byThreadId", (q) =>
          q.eq("threadId", threadId as Id<"threads">)
        )
        .order("asc")
        .collect();

      // Find the index of the message we're editing from
      const targetMessageIndex = allMessages.findIndex(
        (msg) => msg.messageId === targetFromMessageId
      );

      if (targetMessageIndex !== -1) {
        // Get the original assistant message ID before deleting (to reuse it)
        const messagesAfterTarget = allMessages.slice(targetMessageIndex + 1);
        const originalAssistantMessage = messagesAfterTarget.find(
          (msg) => msg.role === "assistant"
        );
        if (originalAssistantMessage) {
          originalAssistantMessageId = originalAssistantMessage.messageId;
        }

        // Delete all messages after the edited message
        for (const msg of messagesAfterTarget) {
          await db.delete(msg._id);
        }

        if (targetMode === "edit") {
          // Update the edited message with new content
          const editMessage = allMessages[targetMessageIndex];
          if (editMessage) {
            await db.patch(editMessage._id, {
              parts: userMessage.parts,
              updatedAt: Date.now(),
            });
          }
        }
      }

      const newAssistantMessage_edit_or_retry = {
        messageId: originalAssistantMessageId, // Reuse the original assistant message ID
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        parts: [],
        role: "assistant" as const,
      };

      const assistantMessageConvexId = await db.insert("messages", {
        threadId: threadId as Id<"threads">,
        ...newAssistantMessage_edit_or_retry,
      });

      return {
        threadId: threadId as Id<"threads">,
        userMessageId: targetFromMessageId,
        assistantMessageId: originalAssistantMessageId, // Return the reused ID
        assistantMessageConvexId,
      };
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

export const getAllUserThreads = query({
  args: {},
  handler: async ({ db, auth }) => {
    const user = await getUserIdentity(auth, {
      allowAnons: true,
    });

    if ("error" in user) return { error: user.error };

    const threads = await db
      .query("threads")
      .withIndex("byAuthor", (q) => q.eq("authorId", user.id))
      .order("desc")
      .collect();

    return threads;
  },
});

// Public version of getThreadById
export const getThread = query({
  args: { threadId: v.id("threads") },
  handler: async ({ db, auth }, { threadId }) => {
    const user = await getUserIdentity(auth, {
      allowAnons: true,
    });

    if ("error" in user) return null;

    const thread = await db.get(threadId);
    if (!thread || thread.authorId !== user.id) return null;

    return thread;
  },
});

export const updateThreadStreamingState = internalMutation({
  args: {
    threadId: v.id("threads"),
    isLive: v.boolean(),
    streamStartedAt: v.optional(v.number()),
    currentStreamId: v.optional(v.string()),
  },
  handler: async (
    { db },
    { threadId, isLive, streamStartedAt, currentStreamId }
  ) => {
    const thread = await db.get(threadId);
    if (!thread) {
      console.error(
        "[cvx][updateThreadStreamingState] Thread not found",
        threadId
      );
      return;
    }

    await db.patch(threadId, {
      isLive,
      streamStartedAt: isLive ? streamStartedAt : undefined,
      currentStreamId: isLive ? currentStreamId : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const updateThreadName = internalMutation({
  args: {
    threadId: v.id("threads"),
    name: v.string(),
  },
  handler: async ({ db }, { threadId, name }) => {
    await db.patch(threadId, {
      title: name,
    });
  },
});
