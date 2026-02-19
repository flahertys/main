import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import crypto from "node:crypto";
import { resolveAdminAccess } from "@/lib/admin-access";

function sanitizeUserId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

function safeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return sanitizeUserId(trimmed);
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getAnonId(request: Request) {
  const ip = getRequestIp(request);
  const agent = request.headers.get("user-agent") ?? "unknown-agent";
  const acceptLang = request.headers.get("accept-language") ?? "unknown-lang";
  const seed = `${ip}|${agent}|${acceptLang}`;
  const hashed = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 16);
  return `anon_${hashed}`;
}

function shouldTrustDirectUserId(request: NextRequest) {
  if (process.env.TRADEHAX_ALLOW_CLIENT_USER_ID_OVERRIDE === "true") {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return resolveAdminAccess(request).allowed;
}

export async function resolveRequestUserId(
  request: NextRequest,
  candidateUserId?: unknown,
) {
  const direct =
    safeString(candidateUserId) ??
    safeString(request.headers.get("x-tradehax-user-id")) ??
    safeString(request.headers.get("x-user-id"));

  if (direct && shouldTrustDirectUserId(request)) {
    return direct;
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
    });

    if (typeof token?.sub === "string" && token.sub.trim().length > 0) {
      return `acct_${sanitizeUserId(token.sub)}`;
    }

    if (typeof token?.email === "string" && token.email.trim().length > 0) {
      return `acct_${sanitizeUserId(token.email)}`;
    }
  } catch {
    // Fallback to anonymous identifier.
  }

  return getAnonId(request);
}
