"use client";

import { AlertCircle, GaugeCircle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

type RiskStance = "guarded" | "balanced" | "aggressive";
type MarketRegime = "BULLISH" | "BEARISH" | "MIXED";

type HubConvictionCalibrationEngineProps = {
  focusSymbol: string;
  riskStance: RiskStance;
  marketRegime: MarketRegime;
  onInjectBrief: (brief: string) => void;
  onStoreBrief: (brief: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HubConvictionCalibrationEngine({
  focusSymbol,
  riskStance,
  marketRegime,
  onInjectBrief,
  onStoreBrief,
}: HubConvictionCalibrationEngineProps) {
  const [selfRatedConfidencePct, setSelfRatedConfidencePct] = useState("82");
  const [evidenceStrengthPct, setEvidenceStrengthPct] = useState("59");
  const [narrativeBiasPct, setNarrativeBiasPct] = useState("48");
  const [recentPredictionErrorPct, setRecentPredictionErrorPct] = useState("37");

  const calibration = useMemo(() => {
    const confidence = Number(selfRatedConfidencePct || "0");
    const evidence = Number(evidenceStrengthPct || "0");
    const bias = Number(narrativeBiasPct || "0");
    const error = Number(recentPredictionErrorPct || "0");

    const overconfidenceGap = confidence - evidence;
    const miscalibrationRaw =
      Math.max(0, overconfidenceGap) * 0.9 +
      bias * 0.45 +
      error * 0.4 +
      (riskStance === "aggressive" ? 7 : 0) +
      (marketRegime === "MIXED" ? 4 : 0);

    const miscalibrationIndex = clamp(Math.round(miscalibrationRaw), 0, 100);

    const calibrationState =
      miscalibrationIndex >= 70
        ? "HIGH_MISMATCH"
        : miscalibrationIndex >= 45
          ? "MODERATE_MISMATCH"
          : "CALIBRATED";

    const protocol =
      calibrationState === "HIGH_MISMATCH"
        ? [
            "Force confidence down to evidence-aligned sizing.",
            "Require disconfirming evidence before entry.",
            "Reduce size by 50% until error trend improves.",
          ]
        : calibrationState === "MODERATE_MISMATCH"
          ? [
              "Apply conservative confidence haircut.",
              "Collect one additional confirming signal.",
              "Cap exposure at 0.7x baseline for this setup.",
            ]
          : [
              "Confidence and evidence are aligned.",
              "Proceed with standard sizing controls.",
              "Continue post-trade calibration tracking.",
            ];

    return {
      confidence,
      evidence,
      bias,
      error,
      overconfidenceGap,
      miscalibrationIndex,
      calibrationState,
      protocol,
    };
  }, [selfRatedConfidencePct, evidenceStrengthPct, narrativeBiasPct, recentPredictionErrorPct, riskStance, marketRegime]);

  const buildBrief = () => {
    const lines = [
      "CONVICTION_CALIBRATION_ENGINE_BRIEF",
      `SYMBOL: ${focusSymbol || "N/A"}`,
      `REGIME: ${marketRegime}`,
      `RISK_STANCE: ${riskStance.toUpperCase()}`,
      `SELF_RATED_CONFIDENCE_PERCENT: ${calibration.confidence}%`,
      `EVIDENCE_STRENGTH_PERCENT: ${calibration.evidence}%`,
      `NARRATIVE_BIAS_PERCENT: ${calibration.bias}%`,
      `RECENT_PREDICTION_ERROR_PERCENT: ${calibration.error}%`,
      `OVERCONFIDENCE_GAP: ${calibration.overconfidenceGap.toFixed(0)}pts`,
      `MISCALIBRATION_INDEX_0_TO_100: ${calibration.miscalibrationIndex}`,
      `CALIBRATION_STATE: ${calibration.calibrationState}`,
      "CALIBRATION_PROTOCOL:",
      ...calibration.protocol.map((step, index) => `${index + 1}. ${step}`),
      "UNMET_DEMAND_COVERAGE: Confidence-evidence mismatch detection + anti-overconfidence sizing control + bias-aware execution gating.",
    ];

    return lines.join("\n");
  };

  return (
    <div className="rounded-xl border border-violet-400/20 bg-[rgba(16,10,24,0.82)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-violet-200">Conviction Calibration Engine</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Miscal {calibration.miscalibrationIndex}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Calibrates conviction against evidence strength to reduce overconfidence and narrative-driven mistakes.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={selfRatedConfidencePct}
          onChange={(event) => setSelfRatedConfidencePct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-violet-300/60"
          placeholder="Self confidence %"
        />
        <input
          value={evidenceStrengthPct}
          onChange={(event) => setEvidenceStrengthPct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-violet-300/60"
          placeholder="Evidence strength %"
        />
        <input
          value={narrativeBiasPct}
          onChange={(event) => setNarrativeBiasPct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-violet-300/60"
          placeholder="Narrative bias %"
        />
        <input
          value={recentPredictionErrorPct}
          onChange={(event) => setRecentPredictionErrorPct(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-violet-300/60"
          placeholder="Prediction error %"
        />
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <GaugeCircle className="h-3.5 w-3.5 text-violet-300" />
          <span>State: {calibration.calibrationState}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-amber-300" />
          <span>Overconfidence gap: {calibration.overconfidenceGap.toFixed(0)}pts</span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
          <ul className="space-y-0.5 text-zinc-200">
            {calibration.protocol.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInjectBrief(buildBrief())}
          className="rounded-full border border-violet-300/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-violet-100"
        >
          Insert Calibration Brief
        </button>
        <button
          type="button"
          onClick={() => onStoreBrief(buildBrief())}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save Calibration Memory
        </button>
      </div>
    </div>
  );
}
