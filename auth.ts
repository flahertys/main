import {
    getAdminLoginUsername,
    getAdminPasswordHash,
    getAdminPasswordPlaintext,
    getAdminRole,
    getOwnerUserId,
} from "@/lib/admin-config";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import crypto from "node:crypto";

function safeEquals(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyScryptPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const n = Number.parseInt(nRaw, 10);
  const r = Number.parseInt(rRaw, 10);
  const p = Number.parseInt(pRaw, 10);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (salt.length < 8 || expected.length < 16) return false;

  const derived = crypto.scryptSync(password, salt, expected.length, {
    N: n,
    r,
    p,
  });
  return safeEquals(derived.toString("base64"), expected.toString("base64"));
}

function verifyConfiguredLoginPassword(password: string) {
  const passwordHash = getAdminPasswordHash();
  if (passwordHash) {
    try {
      return verifyScryptPassword(password, passwordHash);
    } catch {
      return false;
    }
  }

  const plain = getAdminPasswordPlaintext();
  if (!plain) {
    return false;
  }

  return safeEquals(password, plain);
}

function extractUserRole(user: unknown) {
  if (!user || typeof user !== "object") return undefined;
  const maybeRole = (user as { role?: unknown }).role;
  return typeof maybeRole === "string" ? maybeRole : undefined;
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "tradehax-credentials",
    name: "TradeHax Login",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const configuredUsername = getAdminLoginUsername();

      const username = typeof credentials?.username === "string" ? credentials.username.trim() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";

      if (!username || !password) {
        return null;
      }

      if (username !== configuredUsername || !verifyConfiguredLoginPassword(password)) {
        return null;
      }

      return {
        id: getOwnerUserId(),
        name: configuredUsername,
        email: `${configuredUsername}@tradehax.local`,
        role: getAdminRole(),
      };
    },
  }),
  CredentialsProvider({
    id: "guest-profile",
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

const xClientId =
  process.env.X_CLIENT_ID ||
  process.env.TWITTER_CLIENT_ID ||
  process.env.TWITTER_ID ||
  "";
const xClientSecret =
  process.env.X_CLIENT_SECRET ||
  process.env.TWITTER_CLIENT_SECRET ||
  process.env.TWITTER_SECRET ||
  "";

if (xClientId && xClientSecret) {
  providers.push(
    TwitterProvider({
      clientId: xClientId,
      clientSecret: xClientSecret,
      version: "2.0",
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
    const derivedFallback = crypto
      .createHash("sha256")
      .update(
        [
          process.env.NEXTAUTH_URL,
          process.env.VERCEL_URL,
          process.env.VERCEL_GIT_COMMIT_SHA,
          process.env.NODE_ENV,
          "tradehax-auth-fallback-v2",
        ]
          .filter(Boolean)
          .join("|"),
      )
      .digest("hex");
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "NEXTAUTH_SECRET/JWT_SECRET missing or too short; using derived fallback secret. Configure NEXTAUTH_SECRET (>=32 chars).",
      );
    }
    return derivedFallback;
  })(),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider) {
        (token as Record<string, unknown>).provider = account.provider;
      }
      const role = extractUserRole(user);
      if (role) {
        (token as Record<string, unknown>).role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { provider?: string }).provider =
          typeof (token as Record<string, unknown>).provider === "string"
            ? ((token as Record<string, unknown>).provider as string)
            : "guest";
        (session.user as { role?: string }).role =
          typeof (token as Record<string, unknown>).role === "string"
            ? ((token as Record<string, unknown>).role as string)
            : "user";
      }
      return session;
    },
  },
};
