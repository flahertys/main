"use client";

type HubSitewideNeuralSmartnessProps = {
  neuralVaultCount: number;
  datasetName: string;
  onDatasetNameChange: (value: string) => void;
  datasetRows: string;
  onDatasetRowsChange: (value: string) => void;
  datasetNotes: string;
  onDatasetNotesChange: (value: string) => void;
  onSaveDataset: () => Promise<void>;
  behaviorLabel: string;
  onBehaviorLabelChange: (value: string) => void;
  behaviorObservation: string;
  onBehaviorObservationChange: (value: string) => void;
  onSaveBehavior: () => Promise<void>;
  tickerBehaviorSymbol: string;
  onTickerBehaviorSymbolChange: (value: string) => void;
  tickerBehaviorPattern: string;
  onTickerBehaviorPatternChange: (value: string) => void;
  onSaveTickerPattern: () => Promise<void>;
  learningEnvironmentName: string;
  onLearningEnvironmentNameChange: (value: string) => void;
  learningEnvironmentHypothesis: string;
  onLearningEnvironmentHypothesisChange: (value: string) => void;
  onSaveEnvironment: () => Promise<void>;
  onExportNeuralVault: () => void;
};

export function HubSitewideNeuralSmartness({
  neuralVaultCount,
  datasetName,
  onDatasetNameChange,
  datasetRows,
  onDatasetRowsChange,
  datasetNotes,
  onDatasetNotesChange,
  onSaveDataset,
  behaviorLabel,
  onBehaviorLabelChange,
  behaviorObservation,
  onBehaviorObservationChange,
  onSaveBehavior,
  tickerBehaviorSymbol,
  onTickerBehaviorSymbolChange,
  tickerBehaviorPattern,
  onTickerBehaviorPatternChange,
  onSaveTickerPattern,
  learningEnvironmentName,
  onLearningEnvironmentNameChange,
  learningEnvironmentHypothesis,
  onLearningEnvironmentHypothesisChange,
  onSaveEnvironment,
  onExportNeuralVault,
}: HubSitewideNeuralSmartnessProps) {
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-[rgba(8,16,14,0.84)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-200">Phase 6 · Sitewide Neural Smartness</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Vault {neuralVaultCount}
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Save datasets, user patterns, ticker behavior, and learning environments in one reusable neural memory layer ready for sitewide integration.
      </p>

      <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Dataset Artifact</p>
        <div className="grid gap-2 md:grid-cols-[1.2fr_120px]">
          <input
            value={datasetName}
            onChange={(event) => onDatasetNameChange(event.target.value.slice(0, 80))}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
            placeholder="Dataset name"
          />
          <input
            value={datasetRows}
            onChange={(event) => onDatasetRowsChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
            placeholder="Rows"
          />
        </div>
        <input
          value={datasetNotes}
          onChange={(event) => onDatasetNotesChange(event.target.value.slice(0, 220))}
          className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Optional dataset note"
        />
        <button
          type="button"
          onClick={() => {
            void onSaveDataset();
          }}
          className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100"
        >
          Save Dataset
        </button>
      </div>

      <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">User Behavior Pattern</p>
        <input
          value={behaviorLabel}
          onChange={(event) => onBehaviorLabelChange(event.target.value.slice(0, 100))}
          className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Behavior label"
        />
        <input
          value={behaviorObservation}
          onChange={(event) => onBehaviorObservationChange(event.target.value.slice(0, 240))}
          className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Observed behavior"
        />
        <button
          type="button"
          onClick={() => {
            void onSaveBehavior();
          }}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          Save Behavior
        </button>
      </div>

      <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Ticker Behavior Pattern</p>
        <div className="grid gap-2 md:grid-cols-[120px_1fr]">
          <input
            value={tickerBehaviorSymbol}
            onChange={(event) => onTickerBehaviorSymbolChange(event.target.value.slice(0, 20).toUpperCase())}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
            placeholder="Ticker"
          />
          <input
            value={tickerBehaviorPattern}
            onChange={(event) => onTickerBehaviorPatternChange(event.target.value.slice(0, 240))}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
            placeholder="Pattern and context"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            void onSaveTickerPattern();
          }}
          className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-fuchsia-100"
        >
          Save Ticker Pattern
        </button>
      </div>

      <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Learning Environment</p>
        <input
          value={learningEnvironmentName}
          onChange={(event) => onLearningEnvironmentNameChange(event.target.value.slice(0, 120))}
          className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Environment name"
        />
        <input
          value={learningEnvironmentHypothesis}
          onChange={(event) => onLearningEnvironmentHypothesisChange(event.target.value.slice(0, 260))}
          className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="Hypothesis / learning note"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void onSaveEnvironment();
            }}
            className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-amber-100"
          >
            Save Environment
          </button>
          <button
            type="button"
            onClick={onExportNeuralVault}
            className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100"
          >
            Export Neural Vault
          </button>
        </div>
      </div>
    </div>
  );
}
