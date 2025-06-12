import { query } from "./_generated/server";
import { getAllModels } from "./lib/models";

export const getModels = query({
  args: {},
  handler: async () => {
    return getAllModels();
  },
});
