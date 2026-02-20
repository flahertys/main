"use client";

import { Database, Loader2, RefreshCw, Shield, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

type AcademyStorageStatus = {
  mode: "memory" | "supabase";
  configured: boolean;
  progressTable: string;
  auditTable: string;
  replayTable: string;
  generatedAt: string;
  fallbackActive: boolean;
  lastError?: string;
};

type AcademyProgressSample = {
  userId: string;
  completedModuleIds: string[];
  streakDays: number;
  bonusXp: number;
  bonusHax: number;
  dailyQuestCompleted: boolean;
  updatedAt: string;
};

type AcademyAdminAuditEntry = {
  id: string;
  action: string;
  targetUserId: string | null;
  adminMode: string;
  requestIp: string;
  note: string;
  createdAt: string;
};

type AcademyReplayHealthStats = {
  mode: "memory" | "supabase";
  activeCount: number;
  expiredCount: number;
  totalCount: number;
  lastPurgeAt: string | null;
  sampledAt: string;
};

type AcademyReplayPurgeEvent = {
  id: string;
  createdAt: string;
  adminMode: string;
  deletedCount: number;
  source: "cron" | "manual" | "unknown";
  note: string;
};

type AcademyReplaySloStatus = {
  level: "ok" | "warn" | "critical";
  reasons: string[];
  evaluatedAt: string;
};

type AcademyReplayAutoRemediationResult = {
  enabled: boolean;
  triggered: boolean;
  cooldownMinutes: number;
  reason: string;
  lastTriggeredAt: string | null;
  result?: {
    mode: "memory" | "supabase";
    deletedCount: number;
    deletedMemoryCount: number;
    purgedAt: string;
  };
};

type AcademyReadinessItem = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type AcademyReplayReadinessChecklist = {
  ready: boolean;
  score: number;
  maxScore: number;
  items: AcademyReadinessItem[];
  evaluatedAt: string;
};

type AcademyEnablementGuideStep = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "verify" | "done";
  detail: string;
  actionHint?: string;
};

type AcademyReplayEnablementGuide = {
  readyToEnable: boolean;
  blockers: number;
  warnings: number;
  summary: string;
  steps: AcademyEnablementGuideStep[];
  generatedAt: string;
};

type AcademySeasonPayoutHistoryEntry = {
  id: string;
  createdAt: string;
  adminMode: string;
  season: "daily" | "weekly";
  dryRun: boolean;
  creditedCount: number;
  alreadyCreditedCount: number;
  totalCreditedHax: number;
  note: string;
};

type AcademySeasonPayoutOutcomeSummary = {
  hasRun: boolean;
  lastRun?: {
    id: string;
    createdAt: string;
    season: "daily" | "weekly";
    mode: "dry-run" | "execute";
    creditedCount: number;
    alreadyCreditedCount: number;
    totalCreditedHax: number;
    adminMode: string;
  };
  health: "ok" | "warn" | "stale" | "never_run";
  hoursAgo?: number;
  nextRecommendedSeason?: "daily" | "weekly";
  message: string;
};

type OverviewPayload = {
  ok: boolean;
  status?: AcademyStorageStatus;
  samples?: AcademyProgressSample[];
  auditLogs?: AcademyAdminAuditEntry[];
  replayStats?: AcademyReplayHealthStats;
  replayPurges?: AcademyReplayPurgeEvent[];
  payoutHistory?: AcademySeasonPayoutHistoryEntry[];
  payoutSummary?: AcademySeasonPayoutOutcomeSummary;
  replaySlo?: AcademyReplaySloStatus;
  replayAutoRemediation?: AcademyReplayAutoRemediationResult;
  replayReadiness?: AcademyReplayReadinessChecklist;
  replayEnablement?: AcademyReplayEnablementGuide;
  adminMode?: string;
  error?: string;
};

function replaySloClasses(level: AcademyReplaySloStatus["level"]) {
  if (level === "critical") {
    return "border-rose-400/45 bg-rose-500/10 text-rose-100";
  }
  if (level === "warn") {
    return "border-amber-400/45 bg-amber-500/10 text-amber-100";
  }
  return "border-emerald-400/45 bg-emerald-500/10 text-emerald-100";
}

function renderTextBars(value: number, max: number) {
  if (max <= 0 || value <= 0) {
    return "░░░░░░░░";
  }
  const normalized = Math.max(1, Math.min(8, Math.round((value / max) * 8)));
  return `${"█".repeat(normalized)}${"░".repeat(8 - normalized)}`;
}

export function InvestorAcademyAdminPanel() {
  const [adminKey, setAdminKey] = useState("");
  const [superuserCode, setSuperuserCode] = useState("");
  const [status, setStatus] = useState<AcademyStorageStatus | null>(null);
  const [samples, setSamples] = useState<AcademyProgressSample[]>([]);
  const [auditLogs, setAuditLogs] = useState<AcademyAdminAuditEntry[]>([]);
  const [replayStats, setReplayStats] = useState<AcademyReplayHealthStats | null>(null);
  const [replayPurges, setReplayPurges] = useState<AcademyReplayPurgeEvent[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<AcademySeasonPayoutHistoryEntry[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<AcademySeasonPayoutOutcomeSummary | null>(null);
  const [replaySlo, setReplaySlo] = useState<AcademyReplaySloStatus | null>(null);
  const [replayAutoRemediation, setReplayAutoRemediation] = useState<AcademyReplayAutoRemediationResult | null>(null);
  const [replayReadiness, setReplayReadiness] = useState<AcademyReplayReadinessChecklist | null>(null);
  const [replayEnablement, setReplayEnablement] = useState<AcademyReplayEnablementGuide | null>(null);
  const [adminMode, setAdminMode] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const [actionUserId, setActionUserId] = useState("");
  const [payoutSeason, setPayoutSeason] = useState<"daily" | "weekly">("weekly");
  const [payoutDryRun, setPayoutDryRun] = useState(true);

  async function copySnippet(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => {
        setCopied("");
      }, 1600);
    } catch {
      setMessage("Unable to copy snippet to clipboard.");
    }
  }

  async function refresh(customAdminKey?: string, customSuperuserCode?: string) {
    setLoading(true);
    setMessage("");

    const headers: Record<string, string> = {};
    const key = customAdminKey ?? adminKey;
    const superCode = customSuperuserCode ?? superuserCode;
    if (key.trim()) {
      headers["x-tradehax-admin-key"] = key.trim();
    }
    if (superCode.trim()) {
      headers["x-tradehax-superuser-code"] = superCode.trim();
    }

    try {
      const response = await fetch("/api/investor-academy/admin/overview?limit=12", {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const payload = (await response.json()) as OverviewPayload;
      if (!response.ok || !payload.ok || !payload.status) {
        setStatus(null);
        setSamples([]);
        setAuditLogs([]);
        setReplayStats(null);
        setReplayPurges([]);
        setReplaySlo(null);
        setPayoutHistory([]);
        setReplayAutoRemediation(null);
        setReplayReadiness(null);
        setReplayEnablement(null);
        setAdminMode("");
        setMessage(payload.error ?? "Unable to load academy diagnostics.");
        return;
      }

      setStatus(payload.status);
      setSamples(payload.samples ?? []);
      setAuditLogs(payload.auditLogs ?? []);
      setReplayStats(payload.replayStats ?? null);
      setReplayPurges(payload.replayPurges ?? []);
      setPayoutHistory(payload.payoutHistory ?? []);
      setPayoutSummary(payload.payoutSummary ?? null);
      setReplaySlo(payload.replaySlo ?? null);
      setReplayAutoRemediation(payload.replayAutoRemediation ?? null);
      setReplayReadiness(payload.replayReadiness ?? null);
      setReplayEnablement(payload.replayEnablement ?? null);
      setAdminMode(payload.adminMode ?? "");
    } catch (error) {
      console.error(error);
      setStatus(null);
      setSamples([]);
      setAuditLogs([]);
      setReplayStats(null);
      setReplayPurges([]);
      setPayoutHistory([]);
      setReplaySlo(null);
      setReplayAutoRemediation(null);
      setReplayReadiness(null);
      setReplayEnablement(null);
      setAdminMode("");
      setMessage("Academy diagnostics request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runAdminAction(
    action:
      | "reset-quest"
      | "recompute-streak"
      | "clear-memory"
      | "purge-replay-expired"
      | "simulate-critical-drill"
      | "prepare-enablement"
      | "run-season-payout",
  ) {
    setActionBusy(true);
    setMessage("");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (adminKey.trim()) {
      headers["x-tradehax-admin-key"] = adminKey.trim();
    }
    if (superuserCode.trim()) {
      headers["x-tradehax-superuser-code"] = superuserCode.trim();
    }

    try {
      const response = await fetch("/api/investor-academy/admin/actions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action,
          userId: actionUserId.trim() || undefined,
          season: action === "run-season-payout" ? payoutSeason : undefined,
          dryRun: action === "run-season-payout" ? payoutDryRun : undefined,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Admin action failed.");
        return;
      }

      setMessage(payload.message ?? `Action ${action} completed.`);
      await refresh();
    } catch (error) {
      console.error(error);
      setMessage("Admin action request failed.");
    } finally {
      setActionBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <section className="theme-panel p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">Admin Key</label>
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="x-tradehax-admin-key"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">Superuser Code</label>
            <input
              value={superuserCode}
              onChange={(event) => setSuperuserCode(event.target.value)}
              placeholder="x-tradehax-superuser-code"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => refresh()} className="theme-cta theme-cta--secondary" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Academy Diagnostics
          </button>
          {adminMode ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              Admin mode: {adminMode}
            </span>
          ) : null}
        </div>
        {message ? (
          <p className="mt-3 rounded-xl border border-amber-300/35 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{message}</p>
        ) : null}
      </section>

      <section className="theme-panel p-6">
        <h2 className="text-lg font-semibold text-white">Quick API Verification</h2>
        <p className="mt-2 text-sm text-[#9ab3c6]">
          Use these snippets to validate admin-protected diagnostics endpoints outside the UI.
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#8fb0c4]">PowerShell (Windows)</p>
            <pre className="whitespace-pre-wrap overflow-x-auto text-xs text-[#d7e5f7]">{`$headers = @{
  "x-tradehax-admin-key" = "<ADMIN_KEY>"
}
Invoke-WebRequest -Uri "https://www.tradehax.net/api/investor-academy/admin/overview?limit=12" -Headers $headers`}</pre>
            <button
              type="button"
              onClick={() =>
                copySnippet(
                  "$headers = @{\n  \"x-tradehax-admin-key\" = \"<ADMIN_KEY>\"\n}\nInvoke-WebRequest -Uri \"https://www.tradehax.net/api/investor-academy/admin/overview?limit=12\" -Headers $headers",
                  "pwsh",
                )
              }
              className="mt-3 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20"
            >
              {copied === "pwsh" ? "Copied" : "Copy PowerShell Snippet"}
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#8fb0c4]">cURL (macOS/Linux)</p>
            <pre className="whitespace-pre-wrap overflow-x-auto text-xs text-[#d7e5f7]">{`curl -sS \
  -H "x-tradehax-admin-key: <ADMIN_KEY>" \
  "https://www.tradehax.net/api/investor-academy/admin/overview?limit=12"`}</pre>
            <button
              type="button"
              onClick={() =>
                copySnippet(
                  "curl -sS \\\n  -H \"x-tradehax-admin-key: <ADMIN_KEY>\" \\\n  \"https://www.tradehax.net/api/investor-academy/admin/overview?limit=12\"",
                  "curl",
                )
              }
              className="mt-3 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20"
            >
              {copied === "curl" ? "Copied" : "Copy cURL Snippet"}
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-[#b9cee4]">
            Endpoint notes:
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <code>/api/investor-academy/admin/overview</code> requires admin headers and returns status + samples.
              </li>
              <li>
                <code>/api/investor-academy/status</code> is non-admin and returns storage mode/fallback diagnostics.
              </li>
              <li>
                <code>/api/investor-academy/progress</code> supports GET/POST for user progress synchronization.
              </li>
              <li>
                <code>x-idempotency-key</code> can be sent to <code>/api/investor-academy/admin/actions</code> to replay duplicate requests safely.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {payoutSummary ? (
        <section
          className={`theme-panel p-4 border ${
            payoutSummary.health === "ok"
              ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-100"
              : payoutSummary.health === "warn"
                ? "border-amber-400/45 bg-amber-500/10 text-amber-100"
                : payoutSummary.health === "stale"
                  ? "border-rose-400/45 bg-rose-500/10 text-rose-100"
                  : "border-slate-400/30 bg-slate-500/5 text-slate-200"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Season Payout Health</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs uppercase font-mono tracking-wide ${
                payoutSummary.health === "ok"
                  ? "bg-emerald-400/20 text-emerald-200"
                  : payoutSummary.health === "warn"
                    ? "bg-amber-400/20 text-amber-200"
                    : payoutSummary.health === "stale"
                      ? "bg-rose-400/20 text-rose-200"
                      : "bg-slate-400/10 text-slate-300"
              }`}
            >
              {payoutSummary.health}
            </span>
          </div>
          <p className="mt-2 text-sm">{payoutSummary.message}</p>
          {payoutSummary.lastRun ? (
            <>
              <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                <div>
                  <span className="opacity-80">Season:</span> <span className="ml-1 font-mono uppercase">{payoutSummary.lastRun.season}</span>
                </div>
                <div>
                  <span className="opacity-80">Mode:</span> <span className="ml-1 font-mono">{payoutSummary.lastRun.mode}</span>
                </div>
                <div>
                  <span className="opacity-80">Age:</span> <span className="ml-1 font-mono">{payoutSummary.hoursAgo}h ago</span>
                </div>
              </div>
              <div className="mt-2 grid gap-2 text-xs md:grid-cols-3">
                <div>
                  <span className="opacity-80">Credited:</span> <span className="ml-1 font-mono font-bold">{payoutSummary.lastRun.creditedCount}</span>
                </div>
                <div>
                  <span className="opacity-80">Already paid:</span> <span className="ml-1 font-mono">{payoutSummary.lastRun.alreadyCreditedCount}</span>
                </div>
                <div>
                  <span className="opacity-80">Total HAX:</span> <span className="ml-1 font-mono font-bold">${payoutSummary.lastRun.totalCreditedHax}</span>
                </div>
              </div>
            </>
          ) : null}
          {payoutSummary.nextRecommendedSeason ? (
            <p className="mt-2 text-xs opacity-90">
              Suggested next run: <span className="font-mono uppercase font-semibold">{payoutSummary.nextRecommendedSeason}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="theme-panel p-6">
        <h2 className="text-lg font-semibold text-white">Admin Actions</h2>
        <p className="mt-2 text-sm text-[#9ab3c6]">Operational actions for quest/streak repair and in-memory cache cleanup.</p>

        <div className="mt-4">
          <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">
            Target User ID (required for quest/streak actions)
          </label>
          <input
            value={actionUserId}
            onChange={(event) => setActionUserId(event.target.value)}
            placeholder="acct_user123 or anon_xxxxx"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => runAdminAction("reset-quest")}
            disabled={actionBusy}
            className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1.5 text-xs text-fuchsia-200 hover:bg-fuchsia-500/20 disabled:opacity-60"
          >
            Reset Daily Quest
          </button>
          <button
            type="button"
            onClick={() => runAdminAction("recompute-streak")}
            disabled={actionBusy}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
          >
            Recompute Streak
          </button>
          <button
            type="button"
            onClick={() => runAdminAction("clear-memory")}
            disabled={actionBusy}
            className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
          >
            Clear Memory Cache
          </button>
          <button
            type="button"
            onClick={() => runAdminAction("purge-replay-expired")}
            disabled={actionBusy}
            className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
          >
            Purge Expired Replay Keys
          </button>
          <button
            type="button"
            onClick={() => runAdminAction("simulate-critical-drill")}
            disabled={actionBusy}
            className="rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20 disabled:opacity-60"
          >
            Simulate Critical Drill (Dry Run)
          </button>
          <button
            type="button"
            onClick={() => runAdminAction("prepare-enablement")}
            disabled={actionBusy}
            className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-60"
          >
            Prepare Enablement (Dry Run)
          </button>
          <button
            type="button"
            onClick={() => runAdminAction("run-season-payout")}
            disabled={actionBusy}
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {payoutDryRun ? "Run Season Payout (Dry Run)" : "Run Season Payout (Execute)"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">Payout Season</label>
            <select
              title="Payout season"
              value={payoutSeason}
              onChange={(event) => setPayoutSeason(event.target.value === "daily" ? "daily" : "weekly")}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-[#d7e5f7]">
              <input
                type="checkbox"
                checked={payoutDryRun}
                onChange={(event) => setPayoutDryRun(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black"
              />
              Dry run mode
            </label>
          </div>
          <p className="text-xs text-[#9ab3c6] md:col-span-3">
            Season payouts reward top leaderboard ranks in $HAX. Dry run previews recipients and idempotency behavior without writing credits.
          </p>
        </div>
      </section>

      {loading ? (
        <section className="theme-panel flex items-center gap-3 p-6 text-[#9ab3c6]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading academy diagnostics...
        </section>
      ) : null}

      {!loading && status ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="theme-grid-card">
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <Database className="h-4 w-4" /> Storage Mode
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{status.mode}</p>
              <p className="text-xs text-[#8fa9bc]">Progress: {status.progressTable}</p>
              <p className="text-xs text-[#8fa9bc]">Audit: {status.auditTable}</p>
              <p className="text-xs text-[#8fa9bc]">Replay: {status.replayTable}</p>
            </article>
            <article className="theme-grid-card">
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <Shield className="h-4 w-4" /> Configuration
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{status.configured ? "Configured" : "Missing"}</p>
              <p className="text-xs text-[#8fa9bc]">Fallback active: {status.fallbackActive ? "yes" : "no"}</p>
            </article>
            <article className="theme-grid-card">
              <div className="flex items-center gap-2 text-sm text-fuchsia-300">
                <Trophy className="h-4 w-4" /> Last Error
              </div>
              <p className="mt-2 break-words text-xs text-[#d7e5f7]">{status.lastError || "None"}</p>
            </article>
          </section>

          {replayStats ? (
            <section className="grid gap-4 md:grid-cols-3">
              <article className="theme-grid-card">
                <div className="flex items-center gap-2 text-sm text-rose-300">
                  <Database className="h-4 w-4" /> Replay Active
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{replayStats.activeCount}</p>
                <p className="text-xs text-[#8fa9bc]">Mode: {replayStats.mode}</p>
              </article>
              <article className="theme-grid-card">
                <div className="flex items-center gap-2 text-sm text-amber-300">
                  <Shield className="h-4 w-4" /> Replay Expired
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{replayStats.expiredCount}</p>
                <p className="text-xs text-[#8fa9bc]">Total tracked: {replayStats.totalCount}</p>
              </article>
              <article className="theme-grid-card">
                <div className="flex items-center gap-2 text-sm text-cyan-300">
                  <RefreshCw className="h-4 w-4" /> Last Replay Purge
                </div>
                <p className="mt-2 text-xs text-[#d7e5f7]">
                  {replayStats.lastPurgeAt ? new Date(replayStats.lastPurgeAt).toLocaleString() : "Never"}
                </p>
                <p className="text-xs text-[#8fa9bc]">Sampled: {new Date(replayStats.sampledAt).toLocaleString()}</p>
              </article>
            </section>
          ) : null}

          {replaySlo ? (
            <section className={`theme-panel p-4 border ${replaySloClasses(replaySlo.level)}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Replay SLO: {replaySlo.level}</h3>
                <span className="text-xs opacity-80">Evaluated {new Date(replaySlo.evaluatedAt).toLocaleString()}</span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                {replaySlo.reasons.map((reason, index) => (
                  <li key={`${reason}-${index}`}>{reason}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {replayAutoRemediation ? (
            <section className="theme-panel p-4 border border-white/15 bg-black/35">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d7e5f7]">
                  Replay Auto-Remediation
                </h3>
                <span className="text-xs text-[#8fa9bc]">
                  Cooldown: {replayAutoRemediation.cooldownMinutes}m
                </span>
              </div>
              <p className="mt-2 text-sm text-[#c4d7e9]">{replayAutoRemediation.reason}</p>
              <p className="mt-1 text-xs text-[#8fa9bc]">
                Last triggered: {replayAutoRemediation.lastTriggeredAt ? new Date(replayAutoRemediation.lastTriggeredAt).toLocaleString() : "Never"}
              </p>
              {replayAutoRemediation.result ? (
                <p className="mt-1 text-xs text-[#8fa9bc]">
                  Last purge result: deleted {replayAutoRemediation.result.deletedCount} ({replayAutoRemediation.result.mode})
                </p>
              ) : null}
            </section>
          ) : null}

          {replayReadiness ? (
            <section className="theme-panel p-4 border border-white/15 bg-black/35">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d7e5f7]">
                  Remediation Readiness Checklist
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    replayReadiness.ready ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {replayReadiness.ready ? "READY" : "ATTENTION"} · {replayReadiness.score}/{replayReadiness.maxScore}
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {replayReadiness.items.map((item) => (
                  <li key={item.key} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                        item.status === "pass"
                          ? "bg-emerald-400"
                          : item.status === "warn"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                      }`}
                    />
                    <span className="text-[#d7e5f7]">
                      <span className="font-medium">{item.label}:</span> <span className="text-[#9ab3c6]">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[#8fa9bc]">Evaluated {new Date(replayReadiness.evaluatedAt).toLocaleString()}</p>
            </section>
          ) : null}

          {replayEnablement ? (
            <section className="theme-panel p-4 border border-white/15 bg-black/35">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d7e5f7]">
                  Enablement Assistant
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    replayEnablement.readyToEnable ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
                  }`}
                >
                  {replayEnablement.readyToEnable ? "READY TO ENABLE" : "NOT READY"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#c4d7e9]">{replayEnablement.summary}</p>
              <p className="mt-1 text-xs text-[#8fa9bc]">
                Blockers: {replayEnablement.blockers} · Warnings: {replayEnablement.warnings}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {replayEnablement.steps.map((step) => (
                  <li key={step.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                          step.priority === "high"
                            ? "bg-rose-500/20 text-rose-200"
                            : step.priority === "medium"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-cyan-500/20 text-cyan-200"
                        }`}
                      >
                        {step.priority}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                          step.status === "todo"
                            ? "bg-rose-500/20 text-rose-200"
                            : step.status === "verify"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {step.status}
                      </span>
                      <span className="font-medium text-[#d7e5f7]">{step.title}</span>
                    </div>
                    <p className="mt-1 text-[#9ab3c6]">{step.detail}</p>
                    {step.actionHint ? <p className="mt-1 text-xs text-cyan-200">Action: {step.actionHint}</p> : null}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[#8fa9bc]">Generated {new Date(replayEnablement.generatedAt).toLocaleString()}</p>
            </section>
          ) : null}

          <section className="theme-panel p-6">
            <h2 className="text-lg font-semibold text-white">Replay Cleanup History</h2>
            {replayPurges.length === 0 ? (
              <p className="mt-3 text-sm text-[#9ab3c6]">No replay cleanup events recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8fb0c4]">
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Deleted</th>
                      <th className="px-3 py-2">Trend</th>
                      <th className="px-3 py-2">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const maxDeleted = replayPurges.reduce((max, item) => Math.max(max, item.deletedCount), 0);
                      return replayPurges.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/5 text-[#d7e5f7]">
                          <td className="px-3 py-2 text-xs">{new Date(entry.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2">{entry.source}</td>
                          <td className="px-3 py-2">{entry.deletedCount}</td>
                          <td className="px-3 py-2 font-mono text-xs">{renderTextBars(entry.deletedCount, maxDeleted)}</td>
                          <td className="px-3 py-2">{entry.adminMode}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="theme-panel p-6">
            <h2 className="text-lg font-semibold text-white">Season Payout History</h2>
            {payoutHistory.length === 0 ? (
              <p className="mt-3 text-sm text-[#9ab3c6]">No season payout runs recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8fb0c4]">
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Season</th>
                      <th className="px-3 py-2">Mode</th>
                      <th className="px-3 py-2">Credited</th>
                      <th className="px-3 py-2">Already</th>
                      <th className="px-3 py-2">Total HAX</th>
                      <th className="px-3 py-2">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutHistory.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 text-[#d7e5f7]">
                        <td className="px-3 py-2 text-xs">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2 uppercase">{entry.season}</td>
                        <td className="px-3 py-2">{entry.dryRun ? "dry-run" : "execute"}</td>
                        <td className="px-3 py-2">{entry.creditedCount}</td>
                        <td className="px-3 py-2">{entry.alreadyCreditedCount}</td>
                        <td className="px-3 py-2">{entry.totalCreditedHax}</td>
                        <td className="px-3 py-2">{entry.adminMode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="theme-panel p-6">
            <h2 className="text-lg font-semibold text-white">Recent Academy Progress Samples</h2>
            {samples.length === 0 ? (
              <p className="mt-3 text-sm text-[#9ab3c6]">No academy records yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8fb0c4]">
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Modules</th>
                      <th className="px-3 py-2">Streak</th>
                      <th className="px-3 py-2">Bonus XP</th>
                      <th className="px-3 py-2">Bonus HAX</th>
                      <th className="px-3 py-2">Quest</th>
                      <th className="px-3 py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map((sample) => (
                      <tr key={`${sample.userId}-${sample.updatedAt}`} className="border-b border-white/5 text-[#d7e5f7]">
                        <td className="px-3 py-2 font-mono text-xs">{sample.userId}</td>
                        <td className="px-3 py-2">{sample.completedModuleIds.length}</td>
                        <td className="px-3 py-2">{sample.streakDays}</td>
                        <td className="px-3 py-2">{sample.bonusXp}</td>
                        <td className="px-3 py-2">{sample.bonusHax}</td>
                        <td className="px-3 py-2">{sample.dailyQuestCompleted ? "done" : "active"}</td>
                        <td className="px-3 py-2 text-xs">{new Date(sample.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="theme-panel p-6">
            <h2 className="text-lg font-semibold text-white">Recent Admin Actions</h2>
            {auditLogs.length === 0 ? (
              <p className="mt-3 text-sm text-[#9ab3c6]">No admin actions recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8fb0c4]">
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Target</th>
                      <th className="px-3 py-2">Mode</th>
                      <th className="px-3 py-2">IP</th>
                      <th className="px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 text-[#d7e5f7]">
                        <td className="px-3 py-2 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">{log.action}</td>
                        <td className="px-3 py-2 font-mono text-xs">{log.targetUserId || "-"}</td>
                        <td className="px-3 py-2">{log.adminMode}</td>
                        <td className="px-3 py-2 font-mono text-xs">{log.requestIp}</td>
                        <td className="px-3 py-2">{log.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
