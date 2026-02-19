/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import { requireAdminAccess } from "@/lib/admin-access";
import { buildSiteNavigationDatasetRows, exportSiteNavigationDatasetJsonl } from "@/lib/ai/site-dataset";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:site-dataset",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  const format = request.nextUrl.searchParams.get("format") === "jsonl" ? "jsonl" : "json";
  const rows = buildSiteNavigationDatasetRows();
  const generatedAt = new Date().toISOString();

  if (format === "jsonl") {
    const jsonl = exportSiteNavigationDatasetJsonl();
    return new NextResponse(jsonl, {
      status: 200,
      headers: {
        ...rateLimit.headers,
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": "attachment; filename=tradehax-site-navigation.jsonl",
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      generatedAt,
      rows: rows.length,
      dataset: rows,
    },
    {
      headers: rateLimit.headers,
    },
  );
}
