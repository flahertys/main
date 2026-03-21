/**
 * Unified Health Check Endpoint
 * Verifies XAI Grok-4, Supabase, and all domain configurations
 *
 * Features:
 * - Grok-4 API connectivity check
 * - Supabase multi-domain verification
 * - Environment variable validation
 * - Performance metrics
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAllSupabaseConnections, getAllSupabaseConfigs, getDomainFromRequest } from "./lib/supabase-multi-domain.js";
import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";

// Cache for health check results to avoid hammering external APIs
let lastHealthCheck: { timestamp: number; result: any } | null = null;
const HEALTH_CHECK_CACHE_MS = 30000; // Cache for 30 seconds

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  domain: string;
  checks: {
    grok: { available: boolean; latencyMs: number; error?: string };
    supabase: {
      configured: boolean;
      domainInstances: Record<string, boolean>;
      error?: string;
    };
    environment: {
      xaiApiKeyConfigured: boolean;
      supabaseUrlConfigured: boolean;
      supabaseServiceKeyConfigured: boolean;
    };
  };
  metrics: {
    responseTimeMs: number;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed. Use GET." });
    return;
  }

  const startTime = Date.now();
  const domain = getDomainFromRequest(req);

  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    domain,
    checks: {
      grok: { available: false, latencyMs: 0 },
      supabase: { configured: false, domainInstances: {} },
      environment: {
        xaiApiKeyConfigured: !!process.env.XAI_API_KEY,
        supabaseUrlConfigured: !!process.env.SUPABASE_URL,
        supabaseServiceKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
    metrics: {
      responseTimeMs: 0,
    },
  };

  try {
    // Check Grok-4 API availability
    const grokStartTime = Date.now();
    try {
      const { text, usage } = await generateText({
        model: xai("grok-4"),
        prompt: "Respond with: OK",
        maxTokens: 10,
      });

      result.checks.grok.available = text.includes("OK");
      result.checks.grok.latencyMs = Date.now() - grokStartTime;
    } catch (error) {
      result.checks.grok.available = false;
      result.checks.grok.latencyMs = Date.now() - grokStartTime;
      result.checks.grok.error = error instanceof Error ? error.message : String(error);
      result.status = "degraded";
    }

    // Check Supabase multi-domain configuration
    try {
      const configs = getAllSupabaseConfigs();
      result.checks.supabase.configured = configs.length > 0;

      const supabaseStatus = await verifyAllSupabaseConnections();
      result.checks.supabase.domainInstances = supabaseStatus;

      const allHealthy = Object.values(supabaseStatus).every((healthy) => healthy);
      if (!allHealthy) {
        result.status = result.status === "healthy" ? "degraded" : "unhealthy";
      }
    } catch (error) {
      result.checks.supabase.configured = false;
      result.checks.supabase.error = error instanceof Error ? error.message : String(error);
      result.status = "unhealthy";
    }

    // Determine overall health status
    if (!result.checks.environment.xaiApiKeyConfigured ||
        !result.checks.environment.supabaseUrlConfigured) {
      result.status = "unhealthy";
    }

    result.metrics.responseTimeMs = Date.now() - startTime;

    // Return appropriate status code
    const statusCode =
      result.status === "healthy" ? 200 :
      result.status === "degraded" ? 207 :
      503;

    res.status(statusCode).json(result);
  } catch (error) {
    result.status = "unhealthy";
    result.metrics.responseTimeMs = Date.now() - startTime;

    res.status(503).json({
      ...result,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

