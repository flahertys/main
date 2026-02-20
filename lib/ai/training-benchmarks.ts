import { sanitizePlainText } from "@/lib/security";

export type TrainingBenchmarkStageId =
  | "dataset_quality"
  | "regime_coverage"
  | "response_quality"
  | "execution_safety"
  | "personalization_lift"
  | "web5_game_integration"
  | "live_chart_readiness";

export type TrainingBenchmarkStage = {
  id: TrainingBenchmarkStageId;
  title: string;
  description: string;
  targetScore: number;
  score: number;
  status: "not_started" | "in_progress" | "passing";
  metrics: {
    name: string;
    value: number;
    target: number;
  }[];
  updatedAt: string;
  notes?: string;
};

export type TrainingBenchmarkSnapshot = {
  generatedAt: string;
  overallScore: number;
  stages: TrainingBenchmarkStage[];
};

type BenchmarkStore = {
  stages: Map<TrainingBenchmarkStageId, TrainingBenchmarkStage>;
};

const DEFAULT_STAGES: Omit<TrainingBenchmarkStage, "score" | "status" | "updatedAt">[] = [
  {
    id: "dataset_quality",
    title: "Stage 1 · Dataset quality",
    description: "Validate dataset cleanliness, consent eligibility, and schema consistency.",
    targetScore: 0.9,
    metrics: [
      { name: "schema_validity", value: 0, target: 0.98 },
      { name: "consent_coverage", value: 0, target: 0.9 },
      { name: "redaction_integrity", value: 0, target: 0.99 },
    ],
  },
  {
    id: "regime_coverage",
    title: "Stage 2 · Market regime coverage",
    description: "Balance examples across bull, bear, sideways, and macro-shock conditions.",
    targetScore: 0.85,
    metrics: [
      { name: "bull_examples", value: 0, target: 0.25 },
      { name: "bear_examples", value: 0, target: 0.25 },
      { name: "sideways_examples", value: 0, target: 0.2 },
      { name: "macro_shock_examples", value: 0, target: 0.1 },
    ],
  },
  {
    id: "response_quality",
    title: "Stage 3 · Response quality",
    description: "Evaluate clarity, actionable steps, and technical indicator interpretation quality.",
    targetScore: 0.88,
    metrics: [
      { name: "grounded_responses", value: 0, target: 0.9 },
      { name: "indicator_accuracy", value: 0, target: 0.86 },
      { name: "hallucination_guard", value: 0, target: 0.95 },
    ],
  },
  {
    id: "execution_safety",
    title: "Stage 4 · Execution safety",
    description: "Measure risk controls, sizing discipline, and volatility-aware recommendations.",
    targetScore: 0.9,
    metrics: [
      { name: "risk_bound_compliance", value: 0, target: 0.95 },
      { name: "max_drawdown_guard", value: 0, target: 0.9 },
      { name: "position_sizing_consistency", value: 0, target: 0.9 },
    ],
  },
  {
    id: "personalization_lift",
    title: "Stage 5 · Personalization lift",
    description: "Track user-specific win-rate and confidence lift from personalized recommendations.",
    targetScore: 0.82,
    metrics: [
      { name: "profile_adoption", value: 0, target: 0.75 },
      { name: "user_lift", value: 0, target: 0.12 },
      { name: "feedback_match", value: 0, target: 0.8 },
    ],
  },
  {
    id: "web5_game_integration",
    title: "Stage 6 · Web5 game integration",
    description: "Validate educational tokenized game signal loop integration and user behavior sync.",
    targetScore: 0.8,
    metrics: [
      { name: "game_signal_capture", value: 0, target: 0.85 },
      { name: "reward_feedback_link", value: 0, target: 0.8 },
      { name: "cross_session_memory", value: 0, target: 0.9 },
    ],
  },
  {
    id: "live_chart_readiness",
    title: "Stage 7 · Live chart readiness",
    description: "Prepare for live TradingView chart context ingestion and decision augmentation.",
    targetScore: 0.78,
    metrics: [
      { name: "chart_context_latency", value: 0, target: 0.8 },
      { name: "signal_alignment", value: 0, target: 0.82 },
      { name: "fallback_reliability", value: 0, target: 0.92 },
    ],
  },
];

function nowIso() {
  return new Date().toISOString();
}

function getStore(): BenchmarkStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_BENCHMARK_STORE__?: BenchmarkStore;
  };

  if (!globalRef.__TRADEHAX_BENCHMARK_STORE__) {
    const stages = new Map<TrainingBenchmarkStageId, TrainingBenchmarkStage>();
    const timestamp = nowIso();
    for (const stage of DEFAULT_STAGES) {
      stages.set(stage.id, {
        ...stage,
        score: 0,
        status: "not_started",
        updatedAt: timestamp,
      });
    }

    globalRef.__TRADEHAX_BENCHMARK_STORE__ = { stages };
  }

  return globalRef.__TRADEHAX_BENCHMARK_STORE__;
}

export function composeTrainingBenchmarkSnapshot(stagesInput: TrainingBenchmarkStage[]) {
  const stages = [...stagesInput].sort((left, right) => left.id.localeCompare(right.id));
  const overall =
    stages.length > 0
      ? stages.reduce((acc, stage) => acc + stage.score, 0) / stages.length
      : 0;

  return {
    generatedAt: nowIso(),
    overallScore: Number.parseFloat(overall.toFixed(4)),
    stages,
  } satisfies TrainingBenchmarkSnapshot;
}

function toBoundedScore(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.min(1, Math.max(0, parsed));
}

function deriveStatus(score: number, targetScore: number): TrainingBenchmarkStage["status"] {
  if (score <= 0) {
    return "not_started";
  }
  if (score >= targetScore) {
    return "passing";
  }
  return "in_progress";
}

function computeScoreFromMetrics(metrics: { value: number; target: number }[]) {
  if (metrics.length === 0) {
    return 0;
  }

  const average =
    metrics.reduce((acc, metric) => {
      if (metric.target <= 0) {
        return acc;
      }
      return acc + Math.min(1, metric.value / metric.target);
    }, 0) / metrics.length;

  return Number.parseFloat(average.toFixed(4));
}

export function getTrainingBenchmarkSnapshot(): TrainingBenchmarkSnapshot {
  const stages = Array.from(getStore().stages.values());
  return composeTrainingBenchmarkSnapshot(stages);
}

export function hydrateTrainingBenchmarkStages(stages: TrainingBenchmarkStage[]) {
  const store = getStore();
  for (const stage of stages) {
    if (!stage?.id) {
      continue;
    }
    store.stages.set(stage.id, stage);
  }
  return getTrainingBenchmarkSnapshot();
}

export function upsertTrainingBenchmarkStage(input: {
  stageId: TrainingBenchmarkStageId;
  score?: number;
  metrics?: {
    name: string;
    value: number;
    target?: number;
  }[];
  notes?: string;
}) {
  const store = getStore();
  const existing = store.stages.get(input.stageId);
  if (!existing) {
    return null;
  }

  const sanitizedMetrics = Array.isArray(input.metrics)
    ? input.metrics
        .map((metric) => {
          const name = sanitizePlainText(String(metric.name || ""), 80).toLowerCase();
          const value = toBoundedScore(metric.value);
          const target = toBoundedScore(metric.target ?? 1);
          if (!name || value === null || target === null || target <= 0) {
            return null;
          }
          return {
            name,
            value,
            target,
          };
        })
        .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
        .slice(0, 10)
    : existing.metrics;

  const score =
    toBoundedScore(input.score) ??
    computeScoreFromMetrics(sanitizedMetrics.map((metric) => ({ value: metric.value, target: metric.target })));

  const updated: TrainingBenchmarkStage = {
    ...existing,
    metrics: sanitizedMetrics,
    score,
    status: deriveStatus(score, existing.targetScore),
    updatedAt: nowIso(),
    notes: typeof input.notes === "string" ? sanitizePlainText(input.notes, 320) : existing.notes,
  };

  store.stages.set(input.stageId, updated);
  return updated;
}
