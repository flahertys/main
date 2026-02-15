import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import crypto from "node:crypto";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Guest",
    credentials: {
      displayName: { label: "Display name", type: "text" },
    },
    async authorize(credentials) {
      const input =
        typeof credentials?.displayName === "string" ? credentials.displayName.trim() : "";
      const name = input.length > 0 ? input.slice(0, 32) : "Guest Player";
      return {
        id: `guest-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: (() => {
    const configuredSecret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
    if (configuredSecret && configuredSecret.length >= 32) {
      return configuredSecret;
    }
    const isProductionRuntime =
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build";
    if (isProductionRuntime) {
      throw new Error(
        "Missing NEXTAUTH_SECRET/JWT_SECRET with minimum 32 chars in production.",
      );
    }
    return crypto.randomBytes(32).toString("hex");
  })(),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider) {
        (token as Record<string, unknown>).provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { provider?: string }).provider =
          typeof (token as Record<string, unknown>).provider === "string"
            ? ((token as Record<string, unknown>).provider as string)
            : "guest";
      }
      return session;
    },
  },
};
