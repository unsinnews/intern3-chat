import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/database/db";
import * as schema from "@/database/schema";
import { jwt } from "better-auth/plugins/jwt";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt({
      jwt: {
        audience: "intern3",
        expirationTime: "6h",
      },
      jwks: {
        keyPairConfig: {
          alg: "RS256",
          modulusLength: 2048,
          // @ts-expect-error required for convex
          extractable: true,
        },
      },
    }),
  ],
});
