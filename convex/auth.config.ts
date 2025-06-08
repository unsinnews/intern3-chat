export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "intern3",
      issuer: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      jwks: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/jwks`,
      algorithm: "RS256",
    },
  ],
};
