import { sanitizePlainText } from "@/lib/security";
import crypto from "node:crypto";

export type LineageTransferStatus = "proposed" | "approved" | "rejected" | "executed" | "expired";

export type LineageApprovalDecision = "approve" | "reject";

export type LineageTransferApproval = {
  actor: string;
  decision: LineageApprovalDecision;
  note?: string;
  timestamp: string;
  signatureHash: string;
};

export type LineageTransferProposal = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  reason: string;
  status: LineageTransferStatus;
  requiredApprovals: number;
  approvals: LineageTransferApproval[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  executedAt?: string;
};

type LineageStore = {
  proposals: Map<string, LineageTransferProposal>;
};

function nowIso() {
  return new Date().toISOString();
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_HIVEMIND_LINEAGE_STORE__?: LineageStore;
  };

  if (!globalRef.__TRADEHAX_HIVEMIND_LINEAGE_STORE__) {
    globalRef.__TRADEHAX_HIVEMIND_LINEAGE_STORE__ = {
      proposals: new Map<string, LineageTransferProposal>(),
    };
  }

  return globalRef.__TRADEHAX_HIVEMIND_LINEAGE_STORE__;
}

function normalizeId(value: unknown, fallback: string) {
  return sanitizePlainText(String(value || fallback), 120).toLowerCase() || fallback;
}

function lineageSecret() {
  return String(process.env.TRADEHAX_HIVEMIND_LINEAGE_SECRET || "").trim();
}

function buildSigningPayload(input: {
  proposalId: string;
  actor: string;
  decision: LineageApprovalDecision;
  timestamp: string;
}) {
  return `${input.proposalId}:${input.actor}:${input.decision}:${input.timestamp}`;
}

function hashSignature(signature: string) {
  return crypto.createHash("sha256").update(signature).digest("hex");
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function parseTimestamp(value: string) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : NaN;
}

function isExpired(proposal: LineageTransferProposal) {
  const expiresAt = Date.parse(proposal.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    return false;
  }
  return Date.now() > expiresAt;
}

function computeStatus(proposal: LineageTransferProposal): LineageTransferStatus {
  if (proposal.status === "executed") return "executed";
  if (isExpired(proposal)) return "expired";
  if (proposal.approvals.some((item) => item.decision === "reject")) return "rejected";

  const approvals = proposal.approvals.filter((item) => item.decision === "approve").length;
  if (approvals >= proposal.requiredApprovals) {
    return "approved";
  }

  return "proposed";
}

function validateSignature(input: {
  proposalId: string;
  actor: string;
  decision: LineageApprovalDecision;
  timestamp: string;
  signature: string;
}) {
  const secret = lineageSecret();
  const parsedTs = parseTimestamp(input.timestamp);

  if (!Number.isFinite(parsedTs)) {
    return { ok: false, reason: "invalid_timestamp" as const };
  }

  const maxSkewMs = 10 * 60_000;
  if (Math.abs(Date.now() - parsedTs) > maxSkewMs) {
    return { ok: false, reason: "timestamp_out_of_window" as const };
  }

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true, reason: "dev_signature_bypass" as const };
    }
    return { ok: false, reason: "secret_missing" as const };
  }

  const payload = buildSigningPayload(input);
  const expected = signPayload(payload, secret);
  const provided = sanitizePlainText(input.signature, 256).toLowerCase();
  if (!provided || !secureEquals(expected, provided)) {
    return { ok: false, reason: "signature_mismatch" as const };
  }

  return { ok: true, reason: "verified" as const };
}

export function createLineageTransferProposal(input: {
  fromAccountId: string;
  toAccountId: string;
  reason: string;
  requiredApprovals?: number;
  expiresInMinutes?: number;
}) {
  const fromAccountId = normalizeId(input.fromAccountId, "legacy-root");
  const toAccountId = normalizeId(input.toAccountId, "legacy-next");
  const reason = sanitizePlainText(String(input.reason || ""), 320);

  if (!reason) {
    throw new Error("Transfer reason is required.");
  }
  if (fromAccountId === toAccountId) {
    throw new Error("fromAccountId and toAccountId must be different.");
  }

  const requiredApprovals = Math.min(5, Math.max(1, Math.floor(input.requiredApprovals || 2)));
  const expiresInMinutes = Math.min(30 * 24 * 60, Math.max(10, Math.floor(input.expiresInMinutes || 1_440)));
  const now = nowIso();

  const proposal: LineageTransferProposal = {
    id: `lgt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    fromAccountId,
    toAccountId,
    reason,
    status: "proposed",
    requiredApprovals,
    approvals: [],
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60_000).toISOString(),
  };

  getStore().proposals.set(proposal.id, proposal);
  return proposal;
}

export function approveLineageTransferProposal(input: {
  proposalId: string;
  actor: string;
  decision: LineageApprovalDecision;
  timestamp: string;
  signature: string;
  note?: string;
}) {
  const proposalId = normalizeId(input.proposalId, "");
  const actor = normalizeId(input.actor, "unknown-actor");
  const decision: LineageApprovalDecision = input.decision === "reject" ? "reject" : "approve";
  const timestamp = sanitizePlainText(String(input.timestamp || ""), 80);
  const signature = sanitizePlainText(String(input.signature || ""), 256);

  const store = getStore();
  const proposal = store.proposals.get(proposalId);
  if (!proposal) {
    throw new Error("Transfer proposal not found.");
  }

  if (proposal.status === "executed") {
    throw new Error("Transfer already executed.");
  }
  if (isExpired(proposal)) {
    proposal.status = "expired";
    proposal.updatedAt = nowIso();
    store.proposals.set(proposal.id, proposal);
    throw new Error("Transfer proposal has expired.");
  }

  const verification = validateSignature({
    proposalId,
    actor,
    decision,
    timestamp,
    signature,
  });

  if (!verification.ok) {
    throw new Error(`Signature verification failed: ${verification.reason}`);
  }

  const deduped = proposal.approvals.filter((item) => item.actor !== actor);
  deduped.push({
    actor,
    decision,
    timestamp,
    note: input.note ? sanitizePlainText(input.note, 200) : undefined,
    signatureHash: hashSignature(signature || `${actor}:${timestamp}:${decision}`),
  });

  proposal.approvals = deduped;
  proposal.status = computeStatus(proposal);
  proposal.updatedAt = nowIso();
  store.proposals.set(proposal.id, proposal);
  return proposal;
}

export function finalizeLineageTransferProposal(proposalIdInput: string) {
  const proposalId = normalizeId(proposalIdInput, "");
  const store = getStore();
  const proposal = store.proposals.get(proposalId);
  if (!proposal) {
    throw new Error("Transfer proposal not found.");
  }

  proposal.status = computeStatus(proposal);
  if (proposal.status !== "approved") {
    throw new Error("Transfer is not approved for execution.");
  }

  proposal.status = "executed";
  proposal.executedAt = nowIso();
  proposal.updatedAt = proposal.executedAt;
  store.proposals.set(proposal.id, proposal);
  return proposal;
}

export function listLineageTransferProposals(input?: {
  status?: LineageTransferStatus;
  limit?: number;
}) {
  const status = input?.status;
  const limit = Math.min(500, Math.max(1, Math.floor(input?.limit || 100)));

  const rows = Array.from(getStore().proposals.values())
    .map((proposal) => {
      const computed = computeStatus(proposal);
      if (proposal.status !== "executed" && proposal.status !== computed) {
        proposal.status = computed;
        proposal.updatedAt = nowIso();
      }
      return proposal;
    })
    .filter((proposal) => (status ? proposal.status === status : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);

  return rows;
}

export function getLineageTransferStatus() {
  const all = listLineageTransferProposals({ limit: 2_000 });
  const byStatus = all.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: nowIso(),
    total: all.length,
    pending: all.filter((item) => item.status === "proposed").length,
    approved: all.filter((item) => item.status === "approved").length,
    executed: all.filter((item) => item.status === "executed").length,
    rejected: all.filter((item) => item.status === "rejected").length,
    expired: all.filter((item) => item.status === "expired").length,
    byStatus,
    signatureRequired: Boolean(lineageSecret()) || process.env.NODE_ENV === "production",
  };
}
