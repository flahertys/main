import {
    getUserEncryptedVault,
    updateUserEncryptedVault,
} from "@/lib/intelligence/user-encrypted-vault";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

function toAccountUserId(token: Awaited<ReturnType<typeof getToken>>) {
  const tokenRecord = token && typeof token === "object" ? (token as Record<string, unknown>) : null;
  const sub = typeof tokenRecord?.sub === "string" ? tokenRecord.sub.trim() : "";
  const email = typeof tokenRecord?.email === "string" ? tokenRecord.email.trim() : "";
  const base = sub || email;
  if (!base) return "";

  const clean = sanitizePlainText(base.toLowerCase(), 96).replace(/[^a-z0-9_:@.-]/g, "");
  if (!clean) return "";
  return clean.startsWith("acct_") ? clean : `acct_${clean}`;
}

async function requireSessionUserId(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });

  const userId = toAccountUserId(token);
  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 },
      ),
    };
  }

  return {
    userId,
    response: null,
  };
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  const limit = enforceRateLimit(request, {
    keyPrefix: "account:profile:get",
    max: 80,
    windowMs: 60_000,
  });
  if (!limit.allowed) return limit.response;

  const sessionUser = await requireSessionUserId(request);
  if (sessionUser.response) return sessionUser.response;

  const vault = await getUserEncryptedVault(sessionUser.userId || "");

  return NextResponse.json(
    {
      ok: true,
      userId: vault.userId,
      profile: vault,
      privacy: {
        encryptedAtRest: true,
        policy: "Data is used only for user-enabled personalization/training workflows and never sold.",
      },
    },
    { headers: limit.headers },
  );
}

export async function PUT(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const limit = enforceRateLimit(request, {
    keyPrefix: "account:profile:put",
    max: 45,
    windowMs: 60_000,
  });
  if (!limit.allowed) return limit.response;

  const sessionUser = await requireSessionUserId(request);
  if (sessionUser.response) return sessionUser.response;

  const body = (await request.json()) as {
    displayName?: string;
    profileNotes?: string;
    favoriteSymbols?: string[];
    preferredTimeframes?: string[];
    macroInterests?: string[];
    llmContext?: string;
    consent?: {
      allowLlmTraining?: boolean;
      allowPersonalization?: boolean;
    };
  };

  const profile = await updateUserEncryptedVault(sessionUser.userId || "", {
    displayName: body.displayName,
    profileNotes: body.profileNotes,
    favoriteSymbols: body.favoriteSymbols,
    preferredTimeframes: body.preferredTimeframes,
    macroInterests: body.macroInterests,
    llmContext: body.llmContext,
    consent: {
      allowLlmTraining: body.consent?.allowLlmTraining,
      allowPersonalization: body.consent?.allowPersonalization,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      userId: profile.userId,
      profile,
      privacy: {
        encryptedAtRest: true,
        policy: "Data is used only for user-enabled personalization/training workflows and never sold.",
      },
    },
    { headers: limit.headers },
  );
}
