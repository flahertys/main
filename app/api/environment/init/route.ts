/**
 * POST /api/environment/init
 * Initialize smart environment for user session
 */

import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

interface EnvironmentInitRequest {
  userId?: string;
  walletAddress?: string;
  preferences?: {
    riskTolerance?: "conservative" | "moderate" | "aggressive";
    tradingExperience?: "beginner" | "intermediate" | "expert";
  };
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "environment:init:post",
    max: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: EnvironmentInitRequest = await request.json();
    const userId = await resolveRequestUserId(request, body.userId);
    const walletAddress = sanitizePlainText(String(body.walletAddress || ""), 96);
    const riskTolerance =
      body.preferences?.riskTolerance === "conservative" ||
      body.preferences?.riskTolerance === "moderate" ||
      body.preferences?.riskTolerance === "aggressive"
        ? body.preferences.riskTolerance
        : "moderate";
    const tradingExperience =
      body.preferences?.tradingExperience === "beginner" ||
      body.preferences?.tradingExperience === "intermediate" ||
      body.preferences?.tradingExperience === "expert"
        ? body.preferences.tradingExperience
        : "intermediate";

    // TODO: Import SmartEnvironment when ready
    // const { SmartEnvironment } = await import("@/lib/ai/smart-environment");
    // const env = new SmartEnvironment(userId);

    const environment = {
      userId,
      walletAddress: walletAddress || null,
      preferences: {
        riskTolerance,
        tradingExperience,
        theme: "dark",
        language: "en",
      },
      sessionId: `session-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      status: "initialized",
    };

    return NextResponse.json({
      ok: true,
      environment,
      message: "Smart environment initialized",
      capabilities: [
        "AI Chat with market context",
        "Trading bot management",
        "Portfolio tracking",
        "Market alerts",
        "Image generation",
      ],
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Environment init error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Initialization failed",
      },
      { status: 500 },
    );
  }
}
