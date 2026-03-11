"use client";

import { ConfidenceMeter, ProbabilitySplitMeter } from "@/components/performance/SignalMeters";
import { formatDateTime } from "@/lib/intelligence/format";
import type { ProbabilityCalibrationSummary } from "@/lib/intelligence/probability-calibration";
import type { ProbabilityPolicyProfile, ProbabilityScenario } from "@/lib/intelligence/probability-engine";
import { useEffect, useMemo, useState } from "react";

type TopResponse = {
  ok: boolean;
  mode: "top_setups";
  items: ProbabilityScenario[];
  count: number;
  generatedAt: string;
};

type SingleResponse = {
  ok: boolean;
  mode: "single_symbol";
  scenario: ProbabilityScenario;
  generatedAt: string;
};

type CalibrationResponse = {
  ok: boolean;
  calibration: ProbabilityCalibrationSummary;
};

type PolicyAnalyticsResponse = {
  ok: boolean;
  analytics: {
    profileKey: string;
    preference: {
      policy: "conservative" | "balanced" | "aggressive";
      updatedAt: string;
    } | null;
    totals: {
      decisions: number;
    };
    appliedMix: Array<{
      policy: "conservative" | "balanced" | "aggressive";
      count: number;
    }>;
    attribution: {
      matchedOutcomes: number;
      byAppliedPolicy: Array<{
        policy: "conservative" | "balanced" | "aggressive";
        decisions: number;
        matchedOutcomes: number;
        hitRate: number;
        avgRealizedReturnPct: number;
        score: number;
      }>;
      byAppliedPolicyAndHorizon: Array<{
        horizon: "scalp" | "intraday" | "swing";
        policy: "conservative" | "balanced" | "aggressive";
        decisions: number;
        matchedOutcomes: number;
        hitRate: number;
        avgRealizedReturnPct: number;
        score: number;
      }>;
      leaderboard: Array<{
        policy: "conservative" | "balanced" | "aggressive";
        matchedOutcomes: number;
        hitRate: number;
        avgRealizedReturnPct: number;
        score: number;
      }>;
    };
    autoSelectorStates: Array<{
      horizon: "scalp" | "intraday" | "swing";
      policy: "conservative" | "balanced" | "aggressive";
      updatedAt: string;
      holdUntil: string;
      holdSecondsRemaining: number;
      switchCount: number;
      lastBasis: "attribution" | "health";
      lastConfidence: number;
      lastScoreEdge: number;
      warmupActive: boolean;
      warmupMinMatches: number;
      warmupMatchesGained: number;
      warmupMatchesRemaining: number;
    }>;
  };
};

type PolicySwitchesResponse = {
  ok: boolean;
  profileKey: string;
  horizon: "scalp" | "intraday" | "swing" | "all";
  config?: {
    profileKey: string;
    horizon: "scalp" | "intraday" | "swing";
    preset: "balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
    holdMinutes: number;
    minSwitchEdge: number;
    minSwitchConfidence: number;
    warmupMinMatches: number;
    updatedAt: string;
  };
  recommendation?: {
    profileKey: string;
    horizon: "scalp" | "intraday" | "swing";
    recommendedPreset: "balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
    rawRecommendedPreset: "balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
    confidence: number;
    rawConfidence: number;
    stabilized: boolean;
    locked: boolean;
    lockSecondsRemaining: number;
    switched: boolean;
    switchedCount: number;
    minConfidenceEdge: number;
    overrideActive: boolean;
    overrideSecondsRemaining: number;
    reason: string;
    metrics: {
      matchedOutcomes: number;
      volatility: number;
      hitRateDispersion: number;
      warmupActive: boolean;
      warmupMatchesRemaining: number;
    };
  };
  integrity?: {
    profileKey: string;
    horizon: "scalp" | "intraday" | "swing" | "all";
    generatedAt: string;
    status: "healthy" | "watch" | "critical";
    summary: {
      selectorStates: number;
      switchEvents: number;
      selectorConfigs: number;
      recommendationStates: number;
      recommendationOverrides: number;
      staleOverrides: number;
      invalidStateTimestamps: number;
      highChurnEvents24h: number;
    };
    issues: Array<{
      id: string;
      severity: "warning" | "critical";
      detail: string;
    }>;
  };

  integrityTrend?: {
    profileKey: string;
    horizon: "scalp" | "intraday" | "swing" | "all";
    windowHours: number;
    generatedAt: string;
    points: Array<{
      bucketStart: string;
      switchEvents: number;
      highImpactEvents: number;
      overrideEvents: number;
      score: number;
      status: "healthy" | "watch" | "critical";
    }>;
  };
  events: Array<{
    id: string;
    profileKey: string;
    horizon: "scalp" | "intraday" | "swing";
    decision: "initialize" | "stay" | "hold" | "warmup" | "reject" | "switch" | "override_set" | "override_clear" | "override_expire";
    previousPolicy?: "conservative" | "balanced" | "aggressive" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
    recommendedPolicy: "conservative" | "balanced" | "aggressive" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
    appliedPolicy: "conservative" | "balanced" | "aggressive" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
    basis: "attribution" | "health";
    confidence: number;
    scoreEdge: number;
    minSwitchEdge: number;
    minSwitchConfidence: number;
    volatility: number;
    hitRateDispersion: number;
    warmupActive: boolean;
    warmupMinMatches: number;
    warmupMatchesGained: number;
    warmupMatchesRemaining: number;
    reason: string;
    occurredAt: string;
  }>;
};

type TimelineDecision = PolicySwitchesResponse["events"][number]["decision"];

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function polarityClass(polarity: "bullish" | "bearish" | "neutral") {
  if (polarity === "bullish") {
    return "text-emerald-200 bg-emerald-500/20";
  }
  if (polarity === "bearish") {
    return "text-rose-200 bg-rose-500/20";
  }
  return "text-slate-200 bg-slate-500/20";
}

function qualityClass(qualityBand: "elite" | "strong" | "watch") {
  if (qualityBand === "elite") {
    return "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40";
  }
  if (qualityBand === "strong") {
    return "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40";
  }
  return "bg-amber-500/20 text-amber-100 border border-amber-300/40";
}

function healthClass(status: "healthy" | "watch" | "critical") {
  if (status === "healthy") {
    return "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40";
  }
  if (status === "watch") {
    return "bg-amber-500/20 text-amber-100 border border-amber-300/40";
  }
  return "bg-rose-500/20 text-rose-200 border border-rose-400/40";
}

function alertSeverityClass(severity: "info" | "warning" | "critical") {
  if (severity === "critical") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (severity === "warning") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-100";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function recommendationPriorityClass(priority: "low" | "medium" | "high") {
  if (priority === "high") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (priority === "medium") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-100";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

const decisionLegend: Array<{
  decision: TimelineDecision;
  label: string;
  detail: string;
}> = [
    { decision: "initialize", label: "Initialize", detail: "Bootstraps selector memory for the horizon." },
    { decision: "stay", label: "Stay", detail: "Recommendation confirms current policy state." },
    { decision: "hold", label: "Hold", detail: "Lock window active; switch deferred." },
    { decision: "warmup", label: "Warm-up", detail: "Awaiting enough matched outcomes before switching." },
    { decision: "reject", label: "Reject", detail: "Candidate failed edge/confidence thresholds." },
    { decision: "switch", label: "Switch", detail: "Policy changed to a new profile." },
    { decision: "override_set", label: "Override Set", detail: "Manual recommendation lock was enabled." },
    { decision: "override_clear", label: "Override Clear", detail: "Manual recommendation lock was removed." },
    { decision: "override_expire", label: "Override Expire", detail: "Manual recommendation lock expired naturally." },
  ];

const allTimelineDecisions = decisionLegend.map((row) => row.decision);

function decisionChipClass(decision: TimelineDecision) {
  if (decision === "switch") return "border-cyan-300/30 bg-cyan-500/10 text-cyan-100";
  if (decision === "reject" || decision === "hold") return "border-amber-300/30 bg-amber-500/10 text-amber-100";
  if (decision.startsWith("override")) return "border-violet-300/30 bg-violet-500/10 text-violet-100";
  if (decision === "warmup") return "border-sky-300/30 bg-sky-500/10 text-sky-100";
  return "border-white/20 bg-white/10 text-white/85";
}
export function ProbabilityPanel() {
  const [symbol, setSymbol] = useState("NVDA");
  const [horizon, setHorizon] = useState<"scalp" | "intraday" | "swing">("intraday");
  const [assetType, setAssetType] = useState<"" | "equity" | "crypto">("");
  const [policy, setPolicy] = useState<ProbabilityPolicyProfile>("auto");
  const [policyProfileKey, setPolicyProfileKey] = useState("default");
  const [persistPolicy, setPersistPolicy] = useState(true);

  const [single, setSingle] = useState<ProbabilityScenario | null>(null);
  const [top, setTop] = useState<ProbabilityScenario[]>([]);
  const [calibration, setCalibration] = useState<ProbabilityCalibrationSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [policyAnalytics, setPolicyAnalytics] = useState<PolicyAnalyticsResponse["analytics"] | null>(null);
  const [switchEvents, setSwitchEvents] = useState<PolicySwitchesResponse["events"]>([]);
  const [resetting, setResetting] = useState(false);
  const [presetting, setPresetting] = useState(false);
  const [preset, setPreset] = useState<"balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable">("balanced");
  const [presetScope, setPresetScope] = useState<"global" | "scalp" | "intraday" | "swing">("global");
  const [lockRecommendation, setLockRecommendation] = useState(true);
  const [overrideMinutes, setOverrideMinutes] = useState(90);
  const [activeConfig, setActiveConfig] = useState<PolicySwitchesResponse["config"] | null>(null);
  const [presetRecommendation, setPresetRecommendation] = useState<PolicySwitchesResponse["recommendation"] | null>(null);
  const [integrity, setIntegrity] = useState<PolicySwitchesResponse["integrity"] | null>(null);
  const [integrityTrend, setIntegrityTrend] = useState<PolicySwitchesResponse["integrityTrend"] | null>(null);
  const [remediating, setRemediating] = useState(false);
  const [timelineDecisionFilters, setTimelineDecisionFilters] = useState<TimelineDecision[]>(allTimelineDecisions);

  const singleQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (symbol.trim()) params.set("symbol", symbol.trim().toUpperCase());
    params.set("horizon", horizon);
    if (assetType) params.set("assetType", assetType);
    params.set("policy", policy);
    params.set("policyProfile", policyProfileKey);
    if (persistPolicy) params.set("persistPolicy", "1");
    return params.toString();
  }, [symbol, horizon, assetType, policy, policyProfileKey, persistPolicy]);

  const topQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("top", "1");
    params.set("horizon", horizon);
    params.set("limit", "6");
    params.set("policy", policy);
    params.set("policyProfile", policyProfileKey);
    if (persistPolicy) params.set("persistPolicy", "1");
    return params.toString();
  }, [horizon, policy, policyProfileKey, persistPolicy]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [singleResp, topResp] = await Promise.all([
        fetch(`/api/intelligence/probability?${singleQuery}`, { cache: "no-store" }),
        fetch(`/api/intelligence/probability?${topQuery}`, { cache: "no-store" }),
      ]);
      const calibrationResp = await fetch(`/api/intelligence/probability/calibration`, { cache: "no-store" });
      const policyResp = await fetch(
        `/api/intelligence/probability/policy?profileKey=${encodeURIComponent(policyProfileKey)}`,
        { cache: "no-store" },
      );
      const switchesResp = await fetch(
        `/api/intelligence/probability/policy/switches?profileKey=${encodeURIComponent(policyProfileKey)}&horizon=${horizon}&limit=18`,
        { cache: "no-store" },
      );

      const singlePayload = (await singleResp.json()) as SingleResponse & { error?: string };
      const topPayload = (await topResp.json()) as TopResponse & { error?: string };
      const calibrationPayload = (await calibrationResp.json()) as CalibrationResponse & { error?: string };
      const policyPayload = (await policyResp.json()) as PolicyAnalyticsResponse & { error?: string };
      const switchesPayload = (await switchesResp.json()) as PolicySwitchesResponse & { error?: string };

      if (!singleResp.ok || !singlePayload.ok) {
        throw new Error(singlePayload.error || "Unable to load symbol probability.");
      }
      if (!topResp.ok || !topPayload.ok) {
        throw new Error(topPayload.error || "Unable to load top setups.");
      }
      if (!calibrationResp.ok || !calibrationPayload.ok) {
        throw new Error(calibrationPayload.error || "Unable to load calibration diagnostics.");
      }
      if (!policyResp.ok || !policyPayload.ok) {
        throw new Error(policyPayload.error || "Unable to load policy analytics.");
      }
      if (!switchesResp.ok || !switchesPayload.ok) {
        throw new Error(switchesPayload.error || "Unable to load policy switch events.");
      }

      setSingle(singlePayload.scenario);
      setTop(topPayload.items || []);
      setCalibration(calibrationPayload.calibration || null);
      setPolicyAnalytics(policyPayload.analytics || null);
      setSwitchEvents(switchesPayload.events || []);
      setActiveConfig(switchesPayload.config || null);
      setPresetRecommendation(switchesPayload.recommendation || null);
      setIntegrity(switchesPayload.integrity || null);
      setIntegrityTrend(switchesPayload.integrityTrend || null);
      setGeneratedAt(singlePayload.generatedAt || topPayload.generatedAt || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load probability data.");
    } finally {
      setLoading(false);
    }
  };

  const runAutoRemediation = async () => {
    setRemediating(true);
    setError("");
    try {
      const response = await fetch(`/api/intelligence/probability/policy/switches`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "remediate",
          profileKey: policyProfileKey,
          horizon,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to run auto-remediation.");
      }

      await load();
    } catch (remediationError) {
      setError(remediationError instanceof Error ? remediationError.message : "Unable to run auto-remediation.");
    } finally {
      setRemediating(false);
    }
  };

  const timelineDecisionCounts = useMemo(() => {
    const counts = new Map<TimelineDecision, number>();
    for (const event of switchEvents) {
      counts.set(event.decision, (counts.get(event.decision) || 0) + 1);
    }
    return counts;
  }, [switchEvents]);

  const filteredSwitchEvents = useMemo(
    () => switchEvents.filter((event) => timelineDecisionFilters.includes(event.decision)),
    [switchEvents, timelineDecisionFilters],
  );

  const integritySparkline = useMemo(() => {
    const points = integrityTrend?.points || [];
    if (points.length === 0) {
      return {
        polyline: "",
        maxScore: 100,
        minScore: 0,
        latest: 0,
      };
    }

    const width = 100;
    const height = 28;
    const scores = points.map((point) => point.score);
    const maxScore = Math.max(...scores, 100);
    const minScore = Math.min(...scores, 0);
    const range = Math.max(1, maxScore - minScore);

    const polyline = points
      .map((point, index) => {
        const x = points.length === 1 ? width : (index / (points.length - 1)) * width;
        const y = height - ((point.score - minScore) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    return {
      polyline,
      maxScore,
      minScore,
      latest: points[points.length - 1]?.score || 0,
    };
  }, [integrityTrend]);

  const toggleTimelineDecisionFilter = (decision: TimelineDecision) => {
    setTimelineDecisionFilters((current) => {
      if (current.includes(decision)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== decision);
      }
      return [...current, decision];
    });
  };
  const resetSelector = async (clearEvents: boolean) => {
    setResetting(true);
    setError("");
    try {
      const response = await fetch(`/api/intelligence/probability/policy/switches`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "reset",
          profileKey: policyProfileKey,
          horizon,
          clearEvents,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to reset selector state.");
      }

      await load();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset selector state.");
    } finally {
      setResetting(false);
    }
  };

  const applyPreset = async (
    clearPreset: boolean,
    override?: {
      preset?: "balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
      scope?: "global" | "scalp" | "intraday" | "swing";
      clearRecommendationOverride?: boolean;
    },
  ) => {
    setPresetting(true);
    setError("");
    try {
      const payloadBody: {
        action: "preset";
        profileKey: string;
        horizon: "global" | "scalp" | "intraday" | "swing";
        clearPreset: boolean;
        lockRecommendation: boolean;
        overrideMinutes: number;
        clearRecommendationOverride: boolean;
        preset?: "balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable";
      } = {
        action: "preset",
        profileKey: policyProfileKey,
        horizon: override?.scope || presetScope,
        clearPreset,
        lockRecommendation,
        overrideMinutes,
        clearRecommendationOverride: Boolean(override?.clearRecommendationOverride),
      };

      if (!(override?.clearRecommendationOverride && !clearPreset && !override?.preset)) {
        payloadBody.preset = override?.preset || preset;
      }

      const response = await fetch(`/api/intelligence/probability/policy/switches`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payloadBody),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to apply selector preset.");
      }

      await load();
    } catch (presetError) {
      setError(presetError instanceof Error ? presetError.message : "Unable to apply selector preset.");
    } finally {
      setPresetting(false);
    }
  };

  useEffect(() => {
    void load();
  }, [singleQuery, topQuery]);

  return (
    <section className="theme-panel p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Symbol
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="NVDA"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          />
        </label>

        <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Horizon
          <select
            value={horizon}
            onChange={(event) => setHorizon(event.target.value as "scalp" | "intraday" | "swing")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          >
            <option value="scalp">Scalp</option>
            <option value="intraday">Intraday</option>
            <option value="swing">Swing</option>
          </select>
        </label>

        <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Asset Type
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as "" | "equity" | "crypto")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          >
            <option value="">Auto</option>
            <option value="equity">Equity</option>
            <option value="crypto">Crypto</option>
          </select>
        </label>

        <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Policy
          <select
            value={policy}
            onChange={(event) => setPolicy(event.target.value as ProbabilityPolicyProfile)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          >
            <option value="auto">Auto</option>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>

        <label className="text-xs font-mono uppercase tracking-[0.2em] text-[#8ea8be]">
          Policy Profile
          <input
            value={policyProfileKey}
            onChange={(event) => setPolicyProfileKey(event.target.value || "default")}
            placeholder="default"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          />
        </label>

        <div className="flex items-end">
          <button type="button" onClick={load} className="theme-cta theme-cta--loud w-full">
            {loading ? "Computing..." : "Refresh Probability"}
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#8ea8be]">
        {generatedAt ? `Generated ${formatDateTime(generatedAt)}` : ""}
      </div>

      <label className="mt-2 flex items-center gap-2 text-xs text-[#8ea8be]">
        <input
          type="checkbox"
          checked={persistPolicy}
          onChange={(event) => setPersistPolicy(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/40"
        />
        Persist explicit policy for this profile key
      </label>

      {calibration ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8ea8be]">Brier Score</p>
            <p className="mt-1 text-xl font-semibold text-white">{calibration.metrics.brierScore.toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8ea8be]">Log Loss</p>
            <p className="mt-1 text-xl font-semibold text-white">{calibration.metrics.logLoss.toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8ea8be]">Directional Hit Rate</p>
            <p className="mt-1 text-xl font-semibold text-white">{toPercent(calibration.metrics.directionalHitRate)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8ea8be]">Signal Half-Life</p>
            <p className="mt-1 text-xl font-semibold text-white">{calibration.decay.estimatedHalfLifeMinutes || 0}m</p>
          </div>
        </div>
      ) : null}

      {policyAnalytics ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-[#b9cadd]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Profile: <span className="font-mono text-white/90">{policyAnalytics.profileKey}</span>
            </span>
            <span>
              Stored: <span className="text-white/90">{policyAnalytics.preference?.policy?.toUpperCase() || "NONE"}</span>
            </span>
            <span>Audited Decisions: {policyAnalytics.totals.decisions}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {policyAnalytics.appliedMix.map((row) => (
              <span key={row.policy} className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/85">
                {row.policy}: {row.count}
              </span>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8ea8be]">Policy Attribution</p>
            <p className="mt-1 text-[11px] text-white/80">Matched Outcomes: {policyAnalytics.attribution.matchedOutcomes}</p>
            <div className="mt-2 grid gap-1">
              {policyAnalytics.attribution.byAppliedPolicy.map((row) => (
                <div key={row.policy} className="flex flex-wrap items-center gap-2 text-[11px] text-white/85">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase">{row.policy}</span>
                  <span>decisions {row.decisions}</span>
                  <span>matched {row.matchedOutcomes}</span>
                  <span>hit {toPercent(row.hitRate)}</span>
                  <span>ret {row.avgRealizedReturnPct.toFixed(3)}%</span>
                  <span>score {row.score.toFixed(3)}</span>
                </div>
              ))}
            </div>
            {policyAnalytics.attribution.leaderboard.length > 0 ? (
              <div className="mt-2 text-[11px] text-white/80">
                Auto Leaderboard: {policyAnalytics.attribution.leaderboard.map((row) => `${row.policy}(${row.score.toFixed(3)})`).join(" · ")}
              </div>
            ) : null}
          </div>
          {policyAnalytics.autoSelectorStates.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8ea8be]">Selector Locks</p>
              <div className="mt-1 grid gap-1">
                {policyAnalytics.autoSelectorStates.map((state) => (
                  <div key={state.horizon} className="text-[11px] text-white/85">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase mr-2">{state.horizon}</span>
                    <span>{state.policy}</span>
                    <span className="ml-2">lock {state.holdSecondsRemaining}s</span>
                    <span className="ml-2">switches {state.switchCount}</span>
                    <span className="ml-2">basis {state.lastBasis}</span>
                    <span className="ml-2">conf {toPercent(state.lastConfidence)}</span>
                    <span className="ml-2">warmup {state.warmupActive ? `${state.warmupMatchesRemaining} left` : "done"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void resetSelector(false)}
                  disabled={resetting || loading}
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] text-white/85 disabled:opacity-60"
                >
                  {resetting ? "Resetting..." : "Reset Selector (Horizon)"}
                </button>
                <button
                  type="button"
                  onClick={() => void resetSelector(true)}
                  disabled={resetting || loading}
                  className="rounded-full border border-amber-300/25 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100 disabled:opacity-60"
                >
                  {resetting ? "Resetting..." : "Reset + Clear Timeline"}
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="text-[11px] text-[#8ea8be]">
                  Preset
                  <select
                    value={preset}
                    onChange={(event) => setPreset(event.target.value as "balanced" | "stabilize" | "discovery" | "scalp_tight" | "swing_stable")}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="stabilize">Stabilize</option>
                    <option value="discovery">Discovery</option>
                    <option value="scalp_tight">Scalp Tight</option>
                    <option value="swing_stable">Swing Stable</option>
                  </select>
                </label>
                <label className="text-[11px] text-[#8ea8be]">
                  Scope
                  <select
                    value={presetScope}
                    onChange={(event) => setPresetScope(event.target.value as "global" | "scalp" | "intraday" | "swing")}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                  >
                    <option value="global">Global</option>
                    <option value="scalp">Scalp</option>
                    <option value="intraday">Intraday</option>
                    <option value="swing">Swing</option>
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => void applyPreset(false)}
                    disabled={presetting || loading}
                    className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100 disabled:opacity-60"
                  >
                    {presetting ? "Applying..." : "Apply Preset"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void applyPreset(true)}
                    disabled={presetting || loading}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] text-white/85 disabled:opacity-60"
                  >
                    {presetting ? "Clearing..." : "Clear Preset"}
                  </button>
                </div>
                <label className="text-[11px] text-[#8ea8be] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lockRecommendation}
                    onChange={(event) => setLockRecommendation(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40"
                  />
                  Lock recommendation after apply
                </label>
                <label className="text-[11px] text-[#8ea8be]">
                  Override Minutes
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={overrideMinutes}
                    onChange={(event) => setOverrideMinutes(Math.max(5, Math.min(1440, Number.parseInt(event.target.value || "90", 10) || 90)))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                  />
                </label>
              </div>
              {activeConfig ? (
                <p className="mt-2 text-[11px] text-white/75">
                  Active preset <span className="uppercase">{activeConfig.preset}</span> · hold {activeConfig.holdMinutes}m · edge {activeConfig.minSwitchEdge.toFixed(3)} · conf {toPercent(activeConfig.minSwitchConfidence)} · warmup {activeConfig.warmupMinMatches}
                </p>
              ) : null}
              {integrity ? (
                <div className="mt-2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-[11px] text-white/85">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase">Integrity {integrity.status}</span>
                    <span>states {integrity.summary.selectorStates}</span>
                    <span>events {integrity.summary.switchEvents}</span>
                    <span>overrides {integrity.summary.recommendationOverrides}</span>
                    <span>stale {integrity.summary.staleOverrides}</span>
                    <span>churn24h {integrity.summary.highChurnEvents24h}</span>
                    <button
                      type="button"
                      onClick={() => void runAutoRemediation()}
                      disabled={remediating || loading || presetting || resetting}
                      className="ml-auto rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] text-emerald-100 disabled:opacity-60"
                    >
                      {remediating ? "Remediating..." : "Auto-Remediate"}
                    </button>
                  </div>
                  {integrityTrend && integrityTrend.points.length > 0 ? (
                    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2">
                      <div className="flex items-center justify-between gap-2 text-[10px] text-[#9bb2c7]">
                        <span>Integrity Trend (24h)</span>
                        <span>latest {integritySparkline.latest.toFixed(0)}</span>
                      </div>
                      <svg viewBox="0 0 100 28" className="mt-1 h-9 w-full">
                        <polyline
                          fill="none"
                          stroke="rgba(34,211,238,0.85)"
                          strokeWidth="1.8"
                          points={integritySparkline.polyline}
                        />
                      </svg>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-[#8ea8be]">
                        <span>min {integritySparkline.minScore.toFixed(0)}</span>
                        <span>max {integritySparkline.maxScore.toFixed(0)}</span>
                      </div>
                    </div>
                  ) : null}
                  {integrity.issues.length > 0 ? (
                    <ul className="mt-1 list-disc pl-4 text-[11px] text-white/80">
                      {integrity.issues.map((issue) => (
                        <li key={issue.id}>
                          [{issue.severity}] {issue.detail}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px] text-emerald-200/90">No integrity issues detected.</p>
                  )}
                </div>
              ) : null}
              {presetRecommendation ? (
                <div className="mt-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 uppercase">Suggested {presetRecommendation.recommendedPreset}</span>
                    <span>conf {toPercent(presetRecommendation.confidence)}</span>
                    <span>n {presetRecommendation.metrics.matchedOutcomes}</span>
                    <span>vol {presetRecommendation.metrics.volatility.toFixed(3)}</span>
                    <span>hitσ {presetRecommendation.metrics.hitRateDispersion.toFixed(3)}</span>
                    <span>{presetRecommendation.stabilized ? "stable" : "raw"}</span>
                    <span>{presetRecommendation.locked ? `lock ${presetRecommendation.lockSecondsRemaining}s` : "lock open"}</span>
                    <span>{presetRecommendation.overrideActive ? `override ${presetRecommendation.overrideSecondsRemaining}s` : "no override"}</span>
                    <span>switches {presetRecommendation.switchedCount}</span>
                    {presetRecommendation.recommendedPreset !== presetRecommendation.rawRecommendedPreset ? (
                      <span>candidate {presetRecommendation.rawRecommendedPreset}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        void applyPreset(false, {
                          preset: presetRecommendation.recommendedPreset,
                          scope: presetRecommendation.horizon,
                        })
                      }
                      disabled={presetting || loading}
                      className="ml-auto rounded-full border border-cyan-300/35 bg-cyan-400/20 px-2.5 py-0.5 text-[11px] text-cyan-50 disabled:opacity-60"
                    >
                      Apply Suggested
                    </button>
                    {presetRecommendation.overrideActive ? (
                      <button
                        type="button"
                        onClick={() =>
                          void applyPreset(false, {
                            scope: presetRecommendation.horizon,
                            clearRecommendationOverride: true,
                          })
                        }
                        disabled={presetting || loading}
                        className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] text-white/90 disabled:opacity-60"
                      >
                        Clear Override
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-cyan-100/85">{presetRecommendation.reason}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {calibration ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.16em] ${healthClass(calibration.health.status)}`}>
            Calibration {calibration.health.status}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/85">
            Health Score: {calibration.health.score}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">
            Alerts: {calibration.health.alerts.length}
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      {single ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{single.symbol} Probability Scenario</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${qualityClass(single.qualityBand)}`}>
              {single.qualityBand.toUpperCase()}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
              Bias: {single.bias.toUpperCase()}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
              Mode: {single.providerMode}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ProbabilitySplitMeter
              longProbability={single.longProbability}
              shortProbability={single.shortProbability}
              confidence={single.confidence}
            />
            <ConfidenceMeter
              label="Long Probability"
              value={single.longProbability}
              tone="emerald"
              subtitle={`Bias ${single.bias.toUpperCase()} · ${single.providerMode}`}
            />
            <ConfidenceMeter
              label="Short Probability"
              value={single.shortProbability}
              tone="rose"
              subtitle={`Forecast ${single.forecastId}`}
            />
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-[#b9cadd]">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Forecast ID: <span className="font-mono text-white/90">{single.forecastId}</span>
              </span>
              <span>
                Calibration: {single.calibration.applied ? "applied" : "raw"} ({single.calibration.reason})
              </span>
              <span>
                Delta: {single.calibration.delta >= 0 ? "+" : ""}
                {toPercent(Math.abs(single.calibration.delta))}
              </span>
              <span>Samples: {single.calibration.sampleCount}</span>
              <span>
                Adaptive: {single.adaptation.promotedCount}↑ / {single.adaptation.demotedCount}↓ ({toPercent(Math.abs(single.adaptation.netLongDelta))}
                {single.adaptation.netLongDelta >= 0 ? " long" : " short"})
              </span>
              <span>
                Decay HL: {single.adaptation.halfLifeMinutes}m · Cooldown HL: {single.adaptation.cooldownHalfLifeMinutes}m
              </span>
              <span>
                Policy: {single.policy.applied.toUpperCase()} (req: {single.policy.requested.toUpperCase()}, Δ {toPercent(Math.abs(single.policy.impactDelta))}
                {single.policy.impactDelta >= 0 ? " long" : " short"})
              </span>
              <span>
                Selector: {single.policy.selectionBasis.toUpperCase()} · conf {toPercent(single.policy.selectorConfidence)} · n {single.policy.selectorSampleCount}
                {single.policy.selectorScoreEdge > 0 ? ` · edge ${single.policy.selectorScoreEdge.toFixed(3)}` : ""}
              </span>
              <span>
                Hysteresis: {single.policy.hysteresisLocked ? `LOCK ${single.policy.hysteresisHoldSecondsRemaining}s` : "open"}
                {single.policy.hysteresisSwitched && single.policy.previousAutoPolicy
                  ? ` · switched ${single.policy.previousAutoPolicy}→${single.policy.applied}`
                  : ""}
              </span>
              <span>
                Dynamic Thresholds: edge {single.policy.dynamicMinSwitchEdge.toFixed(3)} · conf {toPercent(single.policy.dynamicMinSwitchConfidence)}
                {single.policy.selectorVolatility > 0 || single.policy.selectorHitRateDispersion > 0
                  ? ` · vol ${single.policy.selectorVolatility.toFixed(3)} · hitσ ${single.policy.selectorHitRateDispersion.toFixed(3)}`
                  : ""}
              </span>
              <span>
                Warm-up: {single.policy.warmupActive
                  ? `${single.policy.warmupMatchesRemaining} remaining (${single.policy.warmupMatchesGained}/${single.policy.warmupMinMatches})`
                  : "complete"}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#9bb2c7]">{single.policy.rationale}</p>
          </div>

          <div className="mt-4 grid gap-2">
            {single.drivers.map((driver) => (
              <div key={driver.label} className="rounded-xl border border-white/10 bg-black/35 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{driver.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${polarityClass(driver.polarity)}`}>
                    {driver.polarity}
                  </span>
                  <span className="text-xs text-[#8ea8be]">{toPercent(driver.value)}</span>
                </div>
                <p className="mt-1 text-xs text-[#b9cadd]">{driver.detail}</p>
              </div>
            ))}
          </div>

          {single.patterns.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8ea8be]">Detected Patterns</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {single.patterns.map((pattern) => (
                  <div key={pattern.id} className="rounded-xl border border-white/10 bg-black/35 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{pattern.title}</p>
                      <span className="text-xs text-[#8ea8be]">{toPercent(pattern.strength)}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#b9cadd]">{pattern.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ea8be]">Top Setups</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#8ea8be] border-b border-white/10">
                <th className="py-2 pr-4">Symbol</th>
                <th className="py-2 pr-4">Bias</th>
                <th className="py-2 pr-4">Long</th>
                <th className="py-2 pr-4">Short</th>
                <th className="py-2 pr-4">Confidence</th>
                <th className="py-2 pr-4">Band</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => (
                <tr key={`${row.symbol}:${row.horizon}:${row.generatedAt}`} className="border-b border-white/5 text-white">
                  <td className="py-2 pr-4 font-semibold">{row.symbol}</td>
                  <td className="py-2 pr-4">{row.bias.toUpperCase()}</td>
                  <td className="py-2 pr-4">{toPercent(row.longProbability)}</td>
                  <td className="py-2 pr-4">{toPercent(row.shortProbability)}</td>
                  <td className="py-2 pr-4">{toPercent(row.confidence)}</td>
                  <td className="py-2 pr-4 uppercase text-xs">{row.qualityBand}</td>
                </tr>
              ))}
              {top.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-[#8ea8be]">
                    No setups currently available from live/simulated feeds.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {calibration && calibration.patternPerformance.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ea8be]">Pattern Backtest Performance</h4>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[#8ea8be]">
                  <th className="py-2 pr-4">Pattern</th>
                  <th className="py-2 pr-4">Occurrences</th>
                  <th className="py-2 pr-4">Hit Rate</th>
                  <th className="py-2 pr-4">Avg Strength</th>
                  <th className="py-2 pr-4">Expectancy</th>
                </tr>
              </thead>
              <tbody>
                {calibration.patternPerformance.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 text-white">
                    <td className="py-2 pr-4 font-medium">{row.title}</td>
                    <td className="py-2 pr-4">{row.occurrences}</td>
                    <td className="py-2 pr-4">{toPercent(row.hitRate)}</td>
                    <td className="py-2 pr-4">{toPercent(row.avgStrength)}</td>
                    <td className="py-2 pr-4">{row.expectancy.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {calibration && calibration.health.alerts.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ea8be]">Calibration Alerts</h4>
          <div className="mt-2 grid gap-2">
            {calibration.health.alerts.map((alert) => (
              <div key={alert.id} className={`rounded-xl border px-3 py-2 text-xs ${alertSeverityClass(alert.severity)}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-[0.14em]">{alert.title}</span>
                  <span className="opacity-80">{alert.severity}</span>
                </div>
                <p className="mt-1 opacity-95">{alert.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {calibration && calibration.health.recommendations.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ea8be]">Recommended Actions</h4>
          <div className="mt-2 grid gap-2">
            {calibration.health.recommendations.map((rec) => (
              <div key={rec.id} className={`rounded-xl border px-3 py-2 text-xs ${recommendationPriorityClass(rec.priority)}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-[0.14em]">{rec.action}</span>
                  <span className="opacity-80">{rec.priority}</span>
                </div>
                <p className="mt-1 opacity-95">{rec.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {switchEvents.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ea8be]">Auto Policy Switch Timeline</h4>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-2 text-[11px]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8ea8be]">Filter Decisions</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {decisionLegend.map((entry) => {
                const active = timelineDecisionFilters.includes(entry.decision);
                const count = timelineDecisionCounts.get(entry.decision) || 0;
                return (
                  <button
                    key={entry.decision}
                    type="button"
                    onClick={() => toggleTimelineDecisionFilter(entry.decision)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] transition ${decisionChipClass(entry.decision)} ${active ? "opacity-100" : "opacity-45"}`}
                    title={entry.detail}
                  >
                    {entry.label} ({count})
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setTimelineDecisionFilters(allTimelineDecisions)}
                className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white/90"
              >
                Show All
              </button>
            </div>
            <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {decisionLegend.map((entry) => (
                <div key={`legend-${entry.decision}`} className="flex items-start gap-2 text-[10px] text-[#9bb2c7]">
                  <span className={`mt-0.5 inline-block h-2.5 w-2.5 rounded-full ${decisionChipClass(entry.decision).includes("cyan") ? "bg-cyan-300" : decisionChipClass(entry.decision).includes("amber") ? "bg-amber-300" : decisionChipClass(entry.decision).includes("violet") ? "bg-violet-300" : decisionChipClass(entry.decision).includes("sky") ? "bg-sky-300" : "bg-slate-300"}`} />
                  <span>
                    <span className="font-semibold text-white/90">{entry.label}:</span> {entry.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 grid gap-2">
            {filteredSwitchEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/85">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase">{event.horizon}</span>
                  <span className={`rounded-full border px-2 py-0.5 uppercase ${decisionChipClass(event.decision)}`}>{event.decision}</span>
                  <span>{event.previousPolicy ? `${event.previousPolicy} → ` : ""}{event.appliedPolicy}</span>
                  <span>rec {event.recommendedPolicy}</span>
                  <span>basis {event.basis}</span>
                  <span>conf {toPercent(event.confidence)}</span>
                  <span>edge {event.scoreEdge.toFixed(3)}</span>
                  <span>req edge {event.minSwitchEdge.toFixed(3)}</span>
                  <span>req conf {toPercent(event.minSwitchConfidence)}</span>
                  <span>warmup {event.warmupActive ? `${event.warmupMatchesRemaining} left` : "done"}</span>
                  <span>{formatDateTime(event.occurredAt)}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#9bb2c7]">{event.reason}</p>
              </div>
            ))}
            {filteredSwitchEvents.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#9bb2c7]">
                No timeline events match the selected decision chips.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
