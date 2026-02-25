"use client";

import { useEffect, useMemo, useState } from "react";

type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";
type OverrideMode = "auto" | "stable" | "canary";
type BeginnerSetupMode = "hands_off" | "balanced" | "operator";

const SCOREBOARD_SETUP_STORAGE_KEY = "tradehax.scoreboard.setup.v1";

type ScoreboardResponse = {
  ok: boolean;
  telemetry?: {
    totalRequests: number;
    domains: Array<{
      domain: PredictionDomain;
      requests: number;
      avgConfidence: number;
      fallbackRate: number;
      providers: {
        huggingface: number;
        kernel: number;
      };
      models: Array<{
        model: string;
        requests: number;
      }>;
    }>;
  };
  recommendations?: Record<string, string>;
  governance?: {
    domains: Array<{
      domain: PredictionDomain;
      stableModel: string;
      canaryModel: string | null;
      overrideMode: OverrideMode;
      modeSource: "auto" | "manual_override";
      activeModel: string;
      activeMode: "stable" | "canary";
      rolloutPercent: number;
      canaryRequestShare: number;
      cooldownUntil: string | null;
      decisions: {
        promoted: boolean;
        rolledBack: boolean;
        reason: string;
      };
      gates: {
        minRequests: number;
        minConfidenceGain: number;
        maxFallbackRate: number;
        maxFallbackDelta: number;
        promotionStreak: number;
        rollbackStreak: number;
      };
      memory: {
        promoteStreak: number;
        rollbackStreak: number;
      };
      performance: {
        stable: {
          requests: number;
          avgConfidence: number;
          fallbackRate: number;
        } | null;
        canary: {
          requests: number;
          avgConfidence: number;
          fallbackRate: number;
        } | null;
      };
    }>;
  };
  dataIntegrity?: {
    algorithm?: string;
    trainFileSha256?: string | null;
    externalDatasets?: boolean;
  };
};

export function ModelScoreboardPanel() {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [error, setError] = useState("");
  const [advancedView, setAdvancedView] = useState(false);
  const [explainMode, setExplainMode] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupMode, setSetupMode] = useState<BeginnerSetupMode>("balanced");
  const [showOperatorTools, setShowOperatorTools] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [overridePending, setOverridePending] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/ai/model-scoreboard", { cache: "no-store" });
        const body = (await res.json()) as ScoreboardResponse;
        if (!res.ok || !body.ok) {
          throw new Error("Unable to load model scoreboard.");
        }
        if (!ignore) {
          setData(body);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load model scoreboard");
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(SCOREBOARD_SETUP_STORAGE_KEY);
      if (!existing) {
        setShowSetupWizard(true);
      }
    } catch {
      // ignore storage errors in restricted environments
    }
  }, []);

  const domains = useMemo(() => data?.telemetry?.domains || [], [data]);
  const governance = useMemo(() => data?.governance?.domains || [], [data]);
  const governanceByDomain = useMemo(() => {
    const map = new Map<PredictionDomain, (typeof governance)[number]>();
    for (const entry of governance) {
      map.set(entry.domain, entry);
    }
    return map;
  }, [governance]);

  const overallHealth = useMemo(() => {
    if (domains.length === 0) {
      return {
        label: "Warming up",
        tone: "mid" as const,
        message: "We need a little live traffic before we can grade system health.",
        nextStep: "Send a few AI chat requests and check back in 1-2 minutes.",
      };
    }

    const healthy = domains.filter((entry) => healthLabel(entry.avgConfidence, entry.fallbackRate) === "Healthy").length;
    const needAttention = domains.filter((entry) => healthLabel(entry.avgConfidence, entry.fallbackRate) === "Needs attention").length;

    if (needAttention > 0) {
      return {
        label: "Needs attention",
        tone: "warn" as const,
        message: "Some domains are struggling. Keep users on stable mode until health recovers.",
        nextStep: "Open Advanced view and set struggling domains to stable mode.",
      };
    }

    if (healthy === domains.length) {
      return {
        label: "Healthy",
        tone: "good" as const,
        message: "Everything looks strong. Autopilot can stay on.",
        nextStep: "Keep Simple view on and monitor once per day.",
      };
    }

    return {
      label: "Watch",
      tone: "mid" as const,
      message: "System is mostly good, but a few domains need observation.",
      nextStep: "Check the yellow domains and keep overrides on auto.",
    };
  }, [domains]);

  async function applyOverride(domain: PredictionDomain, mode: OverrideMode) {
    if (!adminKey.trim()) {
      setNotice("Enter admin key to use manual override controls.");
      return;
    }

    setOverridePending(`${domain}:${mode}`);
    setNotice("");
    try {
      const res = await fetch("/api/ai/model-scoreboard/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey.trim()}`,
        },
        body: JSON.stringify({ domain, mode }),
      });

      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.message || "Failed to apply override.");
      }

      const next = await fetch("/api/ai/model-scoreboard", { cache: "no-store" });
      const nextBody = (await next.json()) as ScoreboardResponse;
      if (next.ok && nextBody.ok) {
        setData(nextBody);
      }
      setNotice(`Override updated: ${domain} → ${mode}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update override.");
    } finally {
      setOverridePending("");
    }
  }

  function finishSetup(mode: BeginnerSetupMode) {
    if (mode === "hands_off") {
      setAdvancedView(false);
      setExplainMode(true);
      setShowOperatorTools(false);
    } else if (mode === "balanced") {
      setAdvancedView(false);
      setExplainMode(true);
      setShowOperatorTools(false);
    } else {
      setAdvancedView(true);
      setExplainMode(true);
      setShowOperatorTools(true);
    }

    try {
      window.localStorage.setItem(SCOREBOARD_SETUP_STORAGE_KEY, JSON.stringify({ mode, savedAt: new Date().toISOString() }));
    } catch {
      // ignore storage errors
    }

    setShowSetupWizard(false);
    setSetupStep(1);
    setNotice(`Setup complete: ${mode.replace("_", " ")} mode enabled.`);
  }

  return (
    <div className="theme-panel p-6 sm:p-8 mb-12">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Model Performance Scoreboard</h2>
          <p className="text-xs text-zinc-300 mt-1">
            Cross-domain health for stock, crypto, Kalshi, and general routes.
          </p>
        </div>
        <div className="text-xs text-cyan-200/80 border border-cyan-500/20 rounded px-2 py-1 bg-cyan-600/10">
          Requests: {data?.telemetry?.totalRequests ?? 0}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setAdvancedView(false)}
          className={`rounded px-2 py-1 border ${
            !advancedView
              ? "border-emerald-400/40 bg-emerald-600/20 text-emerald-100"
              : "border-white/20 bg-black/20 text-zinc-300"
          }`}
        >
          Simple view
        </button>
        <button
          type="button"
          onClick={() => setAdvancedView(true)}
          className={`rounded px-2 py-1 border ${
            advancedView
              ? "border-cyan-400/40 bg-cyan-600/20 text-cyan-100"
              : "border-white/20 bg-black/20 text-zinc-300"
          }`}
        >
          Advanced view
        </button>
        <button
          type="button"
          onClick={() => setExplainMode((value) => !value)}
          className="rounded px-2 py-1 border border-white/20 bg-black/20 text-zinc-300"
        >
          {explainMode ? "Hide tips" : "Show tips"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowSetupWizard(true);
            setSetupStep(1);
          }}
          className="rounded px-2 py-1 border border-fuchsia-400/30 bg-fuchsia-600/10 text-fuchsia-100"
        >
          Setup wizard
        </button>
      </div>

      <div className="mb-4 rounded border border-white/15 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Beginner autopilot status</p>
            <p className="text-sm font-semibold text-white mt-1">{overallHealth.label}</p>
          </div>
          <span
            className={`rounded px-2 py-1 text-[11px] border ${
              overallHealth.tone === "good"
                ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                : overallHealth.tone === "warn"
                  ? "border-rose-400/30 bg-rose-500/20 text-rose-100"
                  : "border-amber-400/30 bg-amber-500/20 text-amber-100"
            }`}
          >
            {overallHealth.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-300">{overallHealth.message}</p>
        <p className="mt-1 text-xs text-cyan-100/90">Next best step: {overallHealth.nextStep}</p>
      </div>

      {!advancedView ? (
        <div className="mb-4 rounded border border-cyan-500/20 bg-cyan-600/10 p-3 text-xs text-cyan-100/90">
          <p className="font-semibold">2-minute beginner playbook</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-cyan-100/85">
            <li>Look for red “Needs attention” cards.</li>
            <li>If none are red, do nothing — autopilot is fine.</li>
            <li>If a card is red, switch to Advanced view and use stable mode for that domain.</li>
          </ul>
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-rose-500/30 bg-rose-600/20 px-3 py-2 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        {domains.map((entry) => (
          <div key={entry.domain} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-cyan-100 uppercase tracking-wide text-sm">{entry.domain}</h3>
              <span className="text-[11px] text-zinc-300">{entry.requests} req</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
              <MetricChip label="Health" value={healthLabel(entry.avgConfidence, entry.fallbackRate)} tone={healthTone(entry.avgConfidence, entry.fallbackRate)} />
              <MetricChip label="Current mode" value={governanceByDomain.get(entry.domain)?.activeMode || "stable"} tone="mid" />
              {advancedView ? (
                <>
                  <MetricChip label="Avg confidence" value={`${entry.avgConfidence}%`} tone={entry.avgConfidence >= 70 ? "good" : "mid"} />
                  <MetricChip label="Fallback" value={`${entry.fallbackRate}%`} tone={entry.fallbackRate <= 20 ? "good" : "warn"} />
                </>
              ) : null}
            </div>

            <div className="text-[11px] text-zinc-300 space-y-1">
              <p>
                <span className="text-zinc-400">Recommended model:</span>{" "}
                <span className="text-emerald-200">{data?.recommendations?.[entry.domain] || "n/a"}</span>
              </p>
              <p>
                <span className="text-zinc-400">Top observed model:</span>{" "}
                <span className="text-cyan-200">{entry.models[0]?.model || "no traffic yet"}</span>
              </p>
              {!advancedView ? (
                <p className="text-zinc-400">
                  {humanHint(entry.avgConfidence, entry.fallbackRate)}
                </p>
              ) : null}
              {explainMode ? (
                <p className="text-[11px] text-cyan-100/85">
                  What this means: {friendlyDomainExplanation(entry.avgConfidence, entry.fallbackRate)}
                </p>
              ) : null}
            </div>

            {!advancedView ? (
              <div className="mt-3 rounded border border-white/10 bg-black/20 p-2">
                <p className="text-[11px] text-zinc-300">
                  Suggested action: <span className="text-white">{beginnerAction(entry.avgConfidence, entry.fallbackRate)}</span>
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded border border-emerald-500/20 bg-emerald-600/10 p-3 text-xs text-emerald-100/85">
        <p className="font-semibold">Data Integrity</p>
        <p className="mt-1">
          Algorithm: {data?.dataIntegrity?.algorithm || "n/a"} • External datasets: {data?.dataIntegrity?.externalDatasets ? "enabled" : "disabled"}
        </p>
        <p className="mt-1 break-all text-emerald-100/70">Hash: {data?.dataIntegrity?.trainFileSha256 || "not available"}</p>
      </div>

      {advancedView ? (
        <div className="mt-4 rounded border border-cyan-500/20 bg-cyan-600/10 p-3 text-xs text-cyan-100/90">
          <p className="font-semibold">Canary Governance & Guardrails</p>
          <div className="mt-2 grid md:grid-cols-2 gap-2">
            {governance.map((entry) => (
              <div key={`governance-${entry.domain}`} className="rounded border border-white/15 bg-black/30 p-2">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="uppercase tracking-wide text-cyan-100 font-semibold">{entry.domain}</span>
                  <span className="text-zinc-300">
                    {entry.activeMode === "canary" ? "Canary active" : "Stable active"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300">Source: {entry.modeSource === "manual_override" ? `manual (${entry.overrideMode})` : "auto"}</p>
                <p className="mt-1 text-[11px] text-zinc-300">Active: {entry.activeModel}</p>
                <p className="mt-1 text-[11px] text-zinc-300">Stable: {entry.stableModel}</p>
                <p className="mt-1 text-[11px] text-zinc-300">Canary: {entry.canaryModel || "not configured"}</p>
                <p className="mt-1 text-[11px] text-zinc-300">
                  Rollout: {entry.rolloutPercent}% • Observed share: {entry.canaryRequestShare}%
                </p>
                <p className="mt-1 text-[11px] text-zinc-300">Decision: {entry.decisions.reason}</p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Gates → min req: {entry.gates.minRequests}, conf gain: +{entry.gates.minConfidenceGain}, max fallback: {entry.gates.maxFallbackRate}%
                </p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Memory → promotion streak: {entry.memory.promoteStreak}/{entry.gates.promotionStreak}, rollback streak: {entry.memory.rollbackStreak}/{entry.gates.rollbackStreak}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded border border-amber-500/20 bg-amber-600/10 p-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-amber-100">Operator Override Controls</p>
                <p className="mt-1 text-[11px] text-amber-100/80">
                  Hidden by default for beginners. Unlock only when you need manual control.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOperatorTools((value) => !value)}
                className="rounded border border-amber-300/30 bg-black/20 px-2 py-1 text-[11px] text-amber-100"
              >
                {showOperatorTools ? "Hide controls" : "Unlock controls"}
              </button>
            </div>

            {showOperatorTools ? (
              <>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder="Enter TRADEHAX_ADMIN_KEY"
                  className="mt-2 w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-xs text-white"
                />
                <div className="mt-2 space-y-2">
                  {governance.map((entry) => (
                    <div key={`override-${entry.domain}`} className="rounded border border-white/10 p-2">
                      <p className="text-[11px] text-zinc-200 uppercase tracking-wide mb-1">{entry.domain}</p>
                      <div className="flex flex-wrap gap-1">
                        {(["auto", "stable", "canary"] as OverrideMode[]).map((mode) => {
                          const key = `${entry.domain}:${mode}`;
                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={overridePending === key}
                              onClick={() => applyOverride(entry.domain, mode)}
                              className="rounded border border-white/20 bg-black/30 px-2 py-1 text-[11px] text-zinc-200 disabled:opacity-50"
                            >
                              {overridePending === key ? "Saving..." : mode}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-amber-100/80">Tip: Most users should leave this locked and run on autopilot.</p>
            )}

            {notice ? <p className="mt-2 text-[11px] text-amber-100">{notice}</p> : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded border border-cyan-500/20 bg-cyan-600/10 p-3 text-xs text-cyan-100/90">
          <p className="font-semibold">Simple summary</p>
          <p className="mt-1 text-cyan-100/80">
            Green = healthy and stable. Yellow = watch it. Red = fallback/risk is elevated.
            Use Advanced view for deep routing controls.
          </p>
        </div>
      )}

      {showSetupWizard ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-gray-950 p-5">
            {setupStep === 1 ? (
              <>
                <p className="text-xs uppercase tracking-wide text-fuchsia-200/80">Welcome setup</p>
                <h3 className="mt-2 text-xl font-bold text-white">Let&apos;s set this up in under 30 seconds</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  We&apos;ll pick how much control you want. You can change this later anytime.
                </p>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSetupWizard(false)}
                    className="rounded border border-white/20 px-3 py-1.5 text-sm text-zinc-200"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="rounded border border-fuchsia-400/40 bg-fuchsia-600/20 px-3 py-1.5 text-sm text-fuchsia-100"
                  >
                    Start setup
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-fuchsia-200/80">Choose your style</p>
                <h3 className="mt-2 text-xl font-bold text-white">How hands-on do you want to be?</h3>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupMode("hands_off")}
                    className={`text-left rounded border p-3 ${setupMode === "hands_off" ? "border-emerald-400/40 bg-emerald-600/15" : "border-white/15 bg-black/30"}`}
                  >
                    <p className="text-sm font-semibold text-white">Hands-off (recommended)</p>
                    <p className="text-xs text-zinc-300 mt-1">I just want a clear status and simple next steps.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupMode("balanced")}
                    className={`text-left rounded border p-3 ${setupMode === "balanced" ? "border-cyan-400/40 bg-cyan-600/15" : "border-white/15 bg-black/30"}`}
                  >
                    <p className="text-sm font-semibold text-white">Balanced</p>
                    <p className="text-xs text-zinc-300 mt-1">Simple view first, with occasional tips and advanced access.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupMode("operator")}
                    className={`text-left rounded border p-3 ${setupMode === "operator" ? "border-amber-400/40 bg-amber-600/15" : "border-white/15 bg-black/30"}`}
                  >
                    <p className="text-sm font-semibold text-white">Operator</p>
                    <p className="text-xs text-zinc-300 mt-1">I want advanced controls visible by default.</p>
                  </button>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="rounded border border-white/20 px-3 py-1.5 text-sm text-zinc-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => finishSetup(setupMode)}
                    className="rounded border border-emerald-400/40 bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-100"
                  >
                    Use this setup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function healthLabel(confidence: number, fallbackRate: number) {
  if (confidence >= 72 && fallbackRate <= 18) return "Healthy";
  if (confidence >= 60 && fallbackRate <= 28) return "Watch";
  return "Needs attention";
}

function healthTone(confidence: number, fallbackRate: number): "good" | "mid" | "warn" {
  if (confidence >= 72 && fallbackRate <= 18) return "good";
  if (confidence >= 60 && fallbackRate <= 28) return "mid";
  return "warn";
}

function humanHint(confidence: number, fallbackRate: number) {
  if (confidence >= 72 && fallbackRate <= 18) {
    return "System is performing well for this market.";
  }
  if (confidence >= 60 && fallbackRate <= 28) {
    return "Usable, but monitor quality and fallback behavior.";
  }
  return "Quality risk is elevated—consider stable mode if this affects users.";
}

function friendlyDomainExplanation(confidence: number, fallbackRate: number) {
  if (confidence >= 72 && fallbackRate <= 18) {
    return "Answers are usually accurate and fallback events are low.";
  }
  if (confidence >= 60 && fallbackRate <= 28) {
    return "Answers are generally okay, but quality may vary during busy periods.";
  }
  return "The system is missing quality targets in this domain and should be handled conservatively.";
}

function beginnerAction(confidence: number, fallbackRate: number) {
  if (confidence >= 72 && fallbackRate <= 18) {
    return "No action needed. Keep autopilot on.";
  }
  if (confidence >= 60 && fallbackRate <= 28) {
    return "Watch this domain. Re-check later before forcing an override.";
  }
  return "Switch this domain to stable mode in Advanced view to protect user experience.";
}

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "mid" | "warn";
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
      : tone === "warn"
        ? "border-rose-400/30 bg-rose-500/20 text-rose-100"
        : "border-cyan-400/30 bg-cyan-500/20 text-cyan-100";

  return (
    <div className={`rounded border px-2 py-1 ${toneClasses}`}>
      <div className="opacity-80">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
