import { corsRouter } from "convex-helpers/server/cors";
import { httpRouter } from "convex/server";
import { chat } from "./chat";

const http = httpRouter();
const cors = corsRouter(http, {
  allowedOrigins: [
    "http://localhost:3000",
    "https://intern3.vercel.app",
    "https://intern3.chat",
  ],
  allowedHeaders: ["Content-Type", "Authorization"],
  allowCredentials: true,
});

cors.route({
  path: "/chat",
  method: "POST",
  handler: chat,
});

export default http;
