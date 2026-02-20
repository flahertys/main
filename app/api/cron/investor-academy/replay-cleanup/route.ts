import { purgeExpiredAcademyAdminReplay, recordAcademyAdminAudit } from "@/lib/investor-academy/store";
import { NextRequest, NextResponse } from "next/server";

function isAuthorizedCronRequest(request: NextRequest) {
  const expected = String(process.env.TRADEHAX_CRON_SECRET || "").trim();
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const vercelCron = request.headers.get("x-vercel-cron");

  if (expected && bearer === expected) {
    return true;
  }
  if (vercelCron === "1") {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized cron request.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const result = await purgeExpiredAcademyAdminReplay();
    await recordAcademyAdminAudit({
      action: "purge-replay-expired",
      targetUserId: null,
      adminMode: "cron",
      requestIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "cron",
      note: `cron purge deleted=${result.deletedCount} mode=${result.mode}`,
    });

    return NextResponse.json({
      ok: true,
      route: "/api/cron/investor-academy/replay-cleanup",
      trigger: request.headers.get("x-vercel-cron") === "1" ? "vercel_cron" : "bearer",
      result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("investor academy replay cleanup cron error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to run investor academy replay cleanup.",
      },
      {
        status: 500,
      },
    );
  }
}
