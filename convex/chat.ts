import { httpAction, query } from "./_generated/server";
import { getUserIdentity } from "./lib/identity";

export const chat = httpAction(async (ctx, req) => {
  const { message } = await req.json();

  return new Response(JSON.stringify({ message: "Hello, world!" }));
});

export const demo = query(async (ctx) => {
  const user = await getUserIdentity(ctx.auth, { allowAnons: true });
  if ("error" in user) {
    return "Unauthorized";
  }
  return user.id;
});
