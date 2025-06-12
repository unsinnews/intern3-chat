import { z } from "zod";

export const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(["openai", "anthropic", "google"]),
});

export const getAllModels = (): z.infer<typeof modelSchema>[] => {
  return [
    {
      id: "gpt-4o",
      name: "GPT 4o",
      provider: "openai",
    },
    {
      id: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
    },
  ];
};
