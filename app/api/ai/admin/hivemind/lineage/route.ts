import { requireAdminAccess } from "@/lib/admin-access";
import {
  approveLineageTransferProposal,
  createLineageTransferProposal,
  finalizeLineageTransferProposal,
  getLineageTransferStatus,
  listLineageTransferProposals,
  type LineageApprovalDecision,
  type LineageTransferStatus,
} from "@/lib/ai/hivemind-lineage";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type LineageMutationRequest = {
  action?: "propose" | "approve" | "finalize";
  fromAccountId?: string;
  toAccountId?: string;
  reason?: string;
  requiredApprovals?: number;
  expiresInMinutes?: number;
  proposalId?: string;
  actor?: string;
  decision?: LineageApprovalDecision;
  timestamp?: string;
  signature?: string;
  note?: string;
};

function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseStatus(value: string | null) {
  if (!value) return undefined;
  const normalized = sanitizePlainText(value, 20).toLowerCase();
  const allowed: LineageTransferStatus[] = ["proposed", "approved", "rejected", "executed", "expired"];
  return allowed.includes(normalized as LineageTransferStatus)
    ? (normalized as LineageTransferStatus)
    : undefined;
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:hivemind:lineage:get",
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

  const search = request.nextUrl.searchParams;
  const limit = parseInteger(search.get("limit"), 100, 1, 500);
  const status = parseStatus(search.get("status"));
  const proposals = listLineageTransferProposals({ limit, status });

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      status: getLineageTransferStatus(),
      proposals,
    },
    {
      headers: {
        ...rateLimit.headers,
        "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
      },
    },
  );
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
    keyPrefix: "ai:admin:hivemind:lineage:post",
    max: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  try {
    const body = (await request.json()) as LineageMutationRequest;
    const action = body.action || "propose";

    if (action === "approve") {
      const proposalId = sanitizePlainText(String(body.proposalId || ""), 80);
      const actor = sanitizePlainText(String(body.actor || ""), 80);
      const decision = body.decision === "reject" ? "reject" : "approve";
      const timestamp = sanitizePlainText(
        String(body.timestamp || request.headers.get("x-tradehax-lineage-ts") || ""),
        80,
      );
      const signature = sanitizePlainText(
        String(body.signature || request.headers.get("x-tradehax-lineage-signature") || ""),
        256,
      );

      if (!proposalId || !actor || !timestamp || !signature) {
        return NextResponse.json(
          {
            ok: false,
            error: "proposalId, actor, timestamp, and signature are required for action=approve.",
          },
          {
            status: 400,
            headers: rateLimit.headers,
          },
        );
      }

      const proposal = approveLineageTransferProposal({
        proposalId,
        actor,
        decision,
        timestamp,
        signature,
        note: body.note,
      });

      return NextResponse.json(
        {
          ok: true,
          action,
          proposal,
          status: getLineageTransferStatus(),
        },
        {
          headers: {
            ...rateLimit.headers,
            "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
          },
        },
      );
    }

    if (action === "finalize") {
      const proposalId = sanitizePlainText(String(body.proposalId || ""), 80);
      if (!proposalId) {
        return NextResponse.json(
          {
            ok: false,
            error: "proposalId is required for action=finalize.",
          },
          {
            status: 400,
            headers: rateLimit.headers,
          },
        );
      }

      const proposal = finalizeLineageTransferProposal(proposalId);
      return NextResponse.json(
        {
          ok: true,
          action,
          proposal,
          status: getLineageTransferStatus(),
        },
        {
          headers: {
            ...rateLimit.headers,
            "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
          },
        },
      );
    }

    const fromAccountId = sanitizePlainText(String(body.fromAccountId || ""), 120);
    const toAccountId = sanitizePlainText(String(body.toAccountId || ""), 120);
    const reason = sanitizePlainText(String(body.reason || ""), 320);

    if (!fromAccountId || !toAccountId || !reason) {
      return NextResponse.json(
        {
          ok: false,
          error: "fromAccountId, toAccountId, and reason are required for action=propose.",
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    const proposal = createLineageTransferProposal({
      fromAccountId,
      toAccountId,
      reason,
      requiredApprovals: typeof body.requiredApprovals === "number" ? body.requiredApprovals : undefined,
      expiresInMinutes: typeof body.expiresInMinutes === "number" ? body.expiresInMinutes : undefined,
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        proposal,
        status: getLineageTransferStatus(),
      },
      {
        headers: {
          ...rateLimit.headers,
          "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process lineage mutation.",
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
