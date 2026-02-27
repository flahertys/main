import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

type AdminMode = "admin_key" | "superuser_code" | "dev_fallback" | "session_admin";

export type AdminAccessResult = {
  allowed: boolean;
  mode?: AdminMode;
  reason?: string;
};

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getHeaderValue(request: Request, name: string) {
  const value = request.headers.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function resolveAdminAccess(request: Request): AdminAccessResult {
  const configuredAdminKey = process.env.TRADEHAX_ADMIN_KEY?.trim() || "";
  const configuredSuperuserCode = process.env.TRADEHAX_SUPERUSER_CODE?.trim() || "";
  const providedAdminKey = getHeaderValue(request, "x-tradehax-admin-key");
  const providedSuperuserCode = getHeaderValue(request, "x-tradehax-superuser-code");

  if (configuredAdminKey && providedAdminKey && secureEquals(configuredAdminKey, providedAdminKey)) {
    return { allowed: true, mode: "admin_key" };
  }

  if (
    configuredSuperuserCode &&
    providedSuperuserCode &&
    secureEquals(configuredSuperuserCode, providedSuperuserCode)
  ) {
    return { allowed: true, mode: "superuser_code" };
  }

  if (!configuredAdminKey && !configuredSuperuserCode && process.env.NODE_ENV !== "production") {
    return { allowed: true, mode: "dev_fallback" };
  }

  return {
    allowed: false,
    reason: "Unauthorized admin access.",
  };
}

export function requireAdminAccess(
  request: Request,
  headers?: HeadersInit,
) {
  const access = resolveAdminAccess(request);
  if (access.allowed) {
    return {
      access,
      response: null,
    };
  }

  return {
    access,
    response: NextResponse.json(
      {
        ok: false,
        error: access.reason || "Unauthorized.",
      },
      {
        status: 403,
        headers,
      },
    ),
  };
}

export async function resolveAdminAccessWithSession(request: NextRequest): Promise<AdminAccessResult> {
  const direct = resolveAdminAccess(request);
  if (direct.allowed) {
    return direct;
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
    });

    const role = typeof token?.role === "string" ? token.role : "";
    const sub = typeof token?.sub === "string" ? token.sub : "";

    if (role === "admin_owner" || sub === "acct_tradehax_owner") {
      return { allowed: true, mode: "session_admin" };
    }
  } catch {
    // ignore and return denied
  }

  return {
    allowed: false,
    reason: "Unauthorized admin access.",
  };
}

export async function requireAdminAccessWithSession(
  request: NextRequest,
  headers?: HeadersInit,
) {
  const access = await resolveAdminAccessWithSession(request);
  if (access.allowed) {
    return {
      access,
      response: null,
    };
  }

  return {
    access,
    response: NextResponse.json(
      {
        ok: false,
        error: access.reason || "Unauthorized.",
      },
      {
        status: 403,
        headers,
      },
    ),
  };
}
