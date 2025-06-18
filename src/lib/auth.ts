import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"

import { db } from "@/database/db"
import * as schema from "@/database/schema"
import { jwt } from "better-auth/plugins/jwt"
import { sendOTPEmail } from "./email"

export const auth = betterAuth({
    trustedOrigins: [
        "https://intern3.chat",
        "http://localhost:3000",
        "http://100.109.174.103:3000"
    ],
    baseURL:
        process.env.NODE_ENV === "production" ? "https://intern3.chat" : "http://localhost:3000",
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || ""
        },
        twitch: {
            clientId: process.env.TWITCH_CLIENT_ID as string,
            clientSecret: process.env.TWITCH_CLIENT_SECRET as string
        }
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                await sendOTPEmail({ email, otp, type })
            },
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            allowedAttempts: 3
        }),
        jwt({
            jwt: {
                audience: "intern3",
                expirationTime: "6h"
            },
            jwks: {
                keyPairConfig: {
                    alg: "RS256",
                    modulusLength: 2048,
                    // @ts-expect-error required for convex
                    extractable: true
                }
            }
        })
    ]
})
