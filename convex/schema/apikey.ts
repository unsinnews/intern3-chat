import { type Infer, v } from "convex/values";

export const providerSchema = v.union(
  v.literal("openai"),
  v.literal("anthropic"),
  v.literal("google")
);

export const ApiKey = v.object({
  userId: v.string(),
  provider: providerSchema,
  encryptedKey: v.string(),
  name: v.optional(v.string()), // Optional name for the key
  createdAt: v.number(),
  updatedAt: v.number(),
  isActive: v.boolean(),
});

export type ApiKey = Infer<typeof ApiKey>;
export type Provider = ApiKey["provider"];
