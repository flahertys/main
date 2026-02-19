import crypto from "node:crypto";
import { NextResponse } from "next/server";

type AdminMode = "admin_key" | "superuser_code" | "dev_fallback";

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
