import { v } from "convex/values";
import { mutation, internalQuery } from "./_generated/server";
import { getUserIdentity } from "./lib/identity";
import { encrypt, decrypt } from "./lib/encryption";
import { providerSchema, type Provider } from "./schema/apikey";

export const storeApiKey = mutation({
  args: {
    provider: providerSchema,
    apiKey: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx.auth, { allowAnons: false });
    if ("error" in user) {
      throw new Error("Unauthorized");
    }

    // Deactivate any existing keys for this provider
    const existingKeys = await ctx.db
      .query("apiKeys")
      .withIndex("byUserProvider", (q) =>
        q.eq("userId", user.id).eq("provider", args.provider)
      )
      .collect();

    for (const key of existingKeys) {
      await ctx.db.patch(key._id, { isActive: false, updatedAt: Date.now() });
    }

    // Encrypt the API key
    const encryptedKey = await encrypt(args.apiKey);

    // Store the new key
    return await ctx.db.insert("apiKeys", {
      userId: user.id,
      provider: args.provider,
      encryptedKey,
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });
  },
});

export const deleteApiKey = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const user = await getUserIdentity(ctx.auth, { allowAnons: false });
    if ("error" in user) {
      throw new Error("Unauthorized");
    }

    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== user.id) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.patch(args.keyId, { isActive: false, updatedAt: Date.now() });
  },
});

export const getDecryptedApiKey = internalQuery({
  args: {
    userId: v.string(),
    provider: providerSchema,
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("byUserProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!apiKey) {
      return null;
    }

    try {
      const decryptedKey = await decrypt(apiKey.encryptedKey);
      return decryptedKey;
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return null;
    }
  },
});
