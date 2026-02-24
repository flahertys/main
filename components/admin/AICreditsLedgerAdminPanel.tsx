"use client";

import { AlertTriangle, CheckCircle2, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LedgerEntry = {
  id: string;
  userId: string;
  eventType: "purchase" | "spend";
  tier?: string;
  packId?: string;
  credits?: number;
  priceUsd?: number;
  provider?: string;
  balanceAfter?: number;
  createdAt: string;
};

type LedgerPayload = {
  ok: boolean;
  error?: string;
  adminMode?: string;
  summary?: {
    total: number;
    purchases: number;
    spends: number;
    creditsPurchased: number;
    creditsSpent: number;
  };
  entries?: LedgerEntry[];
};

type CopyToastState = {
  text: string;
  tone: "success" | "error";
};

export function AICreditsLedgerAdminPanel() {
  const [adminKey, setAdminKey] = useState("");
  const [superuserCode, setSuperuserCode] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [limit, setLimit] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [adminMode, setAdminMode] = useState("");
  const [summary, setSummary] = useState<LedgerPayload["summary"]>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [copyStatus, setCopyStatus] = useState<CopyToastState | null>(null);

  function showCopyToast(state: CopyToastState, durationMs: number) {
    setCopyStatus(state);
    window.setTimeout(() => setCopyStatus(null), durationMs);
  }

  function escapeCsvCell(value: unknown) {
    if (value === null || value === undefined) {
      return "";
    }
    const raw = String(value);
    if (/[",\n\r]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  }

  function exportEntriesCsv() {
    if (entries.length === 0) {
      return;
    }

    const header = [
      "id",
      "createdAt",
      "userId",
      "eventType",
      "credits",
      "tier",
      "packId",
      "priceUsd",
      "provider",
      "balanceAfter",
    ];

    const lines = [
      header.join(","),
      ...entries.map((entry) =>
        [
          entry.id,
          entry.createdAt,
          entry.userId,
          entry.eventType,
          entry.credits ?? "",
          entry.tier ?? "",
          entry.packId ?? "",
          typeof entry.priceUsd === "number" ? entry.priceUsd.toFixed(2) : "",
          entry.provider ?? "",
          entry.balanceAfter ?? "",
        ]
          .map(escapeCsvCell)
          .join(","),
      ),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const filterSuffix = userIdFilter.trim() ? `_${userIdFilter.trim()}` : "_all-users";
    const fileName = `ai-credit-ledger${filterSuffix}_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;

    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function getDelimitedRows(delimiter: "," | "\t") {
    const header = [
      "id",
      "createdAt",
      "userId",
      "eventType",
      "credits",
      "tier",
      "packId",
      "priceUsd",
      "provider",
      "balanceAfter",
    ];

    const lines = [
      header.join(delimiter),
      ...entries.map((entry) =>
        [
          entry.id,
          entry.createdAt,
          entry.userId,
          entry.eventType,
          entry.credits ?? "",
          entry.tier ?? "",
          entry.packId ?? "",
          typeof entry.priceUsd === "number" ? entry.priceUsd.toFixed(2) : "",
          entry.provider ?? "",
          entry.balanceAfter ?? "",
        ]
          .map(escapeCsvCell)
          .join(delimiter),
      ),
    ];

    return lines.join("\n");
  }

  async function copyEntriesTsv() {
    if (entries.length === 0) {
      return;
    }

    const tsv = getDelimitedRows("\t");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(tsv);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = tsv;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showCopyToast({ text: `Copied ${entries.length} rows as TSV.`, tone: "success" }, 2_000);
    } catch {
      showCopyToast({ text: "Unable to copy TSV. Try Export CSV instead.", tone: "error" }, 3_000);
    }
  }

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (userIdFilter.trim()) {
      params.set("userId", userIdFilter.trim());
    }
    return params.toString();
  }, [limit, userIdFilter]);

  async function refresh(customKey?: string, customSuperCode?: string) {
    setLoading(true);
    setMessage("");

    const headers: Record<string, string> = {};
    const key = customKey ?? adminKey;
    const superCode = customSuperCode ?? superuserCode;
    if (key.trim()) {
      headers["x-tradehax-admin-key"] = key.trim();
    }
    if (superCode.trim()) {
      headers["x-tradehax-superuser-code"] = superCode.trim();
    }

    try {
      const response = await fetch(`/api/monetization/admin/ai-credits-ledger?${query}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const payload = (await response.json()) as LedgerPayload;
      if (!response.ok || !payload.ok) {
        setSummary(null);
        setEntries([]);
        setAdminMode("");
        setMessage(payload.error ?? "Unable to load AI credits ledger.");
        return;
      }

      setSummary(payload.summary ?? null);
      setEntries(payload.entries ?? []);
      setAdminMode(payload.adminMode ?? "");
    } catch (error) {
      console.error(error);
      setSummary(null);
      setEntries([]);
      setAdminMode("");
      setMessage("AI credits ledger request failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [query]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const id = window.setInterval(() => {
      refresh();
    }, 10_000);

    return () => {
      window.clearInterval(id);
    };
  }, [autoRefresh, query, adminKey, superuserCode]);

  return (
    <div className="space-y-6">
      <section className="theme-panel p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="ai-credits-admin-key" className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">Admin Key</label>
            <input
              id="ai-credits-admin-key"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="x-tradehax-admin-key"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label htmlFor="ai-credits-superuser-code" className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">Superuser Code</label>
            <input
              id="ai-credits-superuser-code"
              value={superuserCode}
              onChange={(event) => setSuperuserCode(event.target.value)}
              placeholder="x-tradehax-superuser-code"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="ai-credits-user-filter" className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">User Filter</label>
            <input
              id="ai-credits-user-filter"
              value={userIdFilter}
              onChange={(event) => setUserIdFilter(event.target.value)}
              placeholder="acct_user123"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label htmlFor="ai-credits-rows" className="text-xs font-mono uppercase tracking-[0.2em] text-[#8fb0c4]">Rows</label>
            <input
              id="ai-credits-rows"
              type="number"
              min={1}
              max={500}
              title="Rows"
              value={limit}
              onChange={(event) => setLimit(Math.max(1, Math.min(500, Number(event.target.value) || 100)))}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => refresh()} className="theme-cta theme-cta--secondary" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Ledger
            </button>
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-[#d7e5f7]">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black"
              />
              Auto 10s
            </label>
          </div>
        </div>

        {adminMode ? (
          <p className="mt-3 text-xs text-emerald-200">Admin mode: {adminMode}</p>
        ) : null}

        {message ? (
          <p className="mt-3 rounded-xl border border-amber-300/35 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{message}</p>
        ) : null}
      </section>

      {summary ? (
        <section className="grid gap-4 md:grid-cols-5">
          <article className="theme-grid-card">
            <p className="text-xs text-[#99b2c6]">Total Events</p>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </article>
          <article className="theme-grid-card">
            <p className="text-xs text-[#99b2c6]">Purchases</p>
            <p className="text-2xl font-bold text-white">{summary.purchases}</p>
          </article>
          <article className="theme-grid-card">
            <p className="text-xs text-[#99b2c6]">Spends</p>
            <p className="text-2xl font-bold text-white">{summary.spends}</p>
          </article>
          <article className="theme-grid-card">
            <p className="text-xs text-[#99b2c6]">Credits Purchased</p>
            <p className="text-2xl font-bold text-emerald-200">{summary.creditsPurchased}</p>
          </article>
          <article className="theme-grid-card">
            <p className="text-xs text-[#99b2c6]">Credits Spent</p>
            <p className="text-2xl font-bold text-rose-200">{summary.creditsSpent}</p>
          </article>
        </section>
      ) : null}

      <section className="theme-panel p-6">
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Per-User Credit Ledger</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={copyEntriesTsv}
              disabled={loading || entries.length === 0}
              className="theme-cta theme-cta--secondary"
              title="Copy current ledger rows as TSV"
            >
              <Copy className="h-4 w-4" />
              Copy TSV
            </button>
            <button
              onClick={exportEntriesCsv}
              disabled={loading || entries.length === 0}
              className="theme-cta theme-cta--secondary"
              title="Export current ledger rows as CSV"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
          {copyStatus ? (
            <div
              className={`pointer-events-none absolute -top-2 right-0 z-10 rounded-full px-3 py-1 text-[11px] font-medium shadow-[0_8px_24px_rgba(6,182,212,0.2)] backdrop-blur-sm ${
                copyStatus.tone === "success"
                  ? "border border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                  : "border border-rose-300/35 bg-rose-500/20 text-rose-100"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {copyStatus.tone === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <span>{copyStatus.text}</span>
              </span>
            </div>
          ) : null}
        </div>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#9ab3c6]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events...
          </div>
        ) : null}

        {!loading && entries.length === 0 ? (
          <p className="mt-3 text-sm text-[#9ab3c6]">No ledger entries found for current filters.</p>
        ) : null}

        {!loading && entries.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#8fb0c4]">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Credits</th>
                  <th className="px-3 py-2">Tier/Pack</th>
                  <th className="px-3 py-2">USD</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5 text-[#d7e5f7]">
                    <td className="px-3 py-2 text-xs">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-xs">{entry.userId}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          entry.eventType === "purchase"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {entry.eventType}
                      </span>
                    </td>
                    <td className="px-3 py-2">{entry.credits ?? "-"}</td>
                    <td className="px-3 py-2">{entry.tier || entry.packId || "-"}</td>
                    <td className="px-3 py-2">{typeof entry.priceUsd === "number" ? `$${entry.priceUsd.toFixed(2)}` : "-"}</td>
                    <td className="px-3 py-2">{entry.provider || "-"}</td>
                    <td className="px-3 py-2">{typeof entry.balanceAfter === "number" ? entry.balanceAfter : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
