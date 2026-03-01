type ContextSignalPanelProps = {
  objective: string;
  xQuery: string;
  predictionDomain?: string;
  predictionConfidence?: number;
};

export function ContextSignalPanel({
  objective,
  xQuery,
  predictionDomain,
  predictionConfidence,
}: ContextSignalPanelProps) {
  const hasObjective = objective.trim().length > 0;
  const hasXQuery = xQuery.trim().length > 0;

  return (
    <div className="mb-3 grid gap-2 sm:grid-cols-3">
      <div className="rounded-lg border border-emerald-500/20 bg-black/30 px-3 py-2 text-xs text-emerald-100/85">
        <p className="text-[10px] uppercase tracking-wider text-emerald-300/70">Objective signal</p>
        <p className="mt-1 font-semibold truncate">{hasObjective ? objective : "Not set"}</p>
      </div>
      <div className="rounded-lg border border-cyan-500/20 bg-black/30 px-3 py-2 text-xs text-cyan-100/85">
        <p className="text-[10px] uppercase tracking-wider text-cyan-300/70">X context</p>
        <p className="mt-1 font-semibold truncate">{hasXQuery ? `"${xQuery}"` : "Disabled"}</p>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-black/30 px-3 py-2 text-xs text-amber-100/85">
        <p className="text-[10px] uppercase tracking-wider text-amber-300/70">Predicted domain</p>
        <p className="mt-1 font-semibold">{predictionDomain || "general"}</p>
        <p className="text-[11px] opacity-80">{Math.round(predictionConfidence || 0)}% confidence</p>
      </div>
    </div>
  );
}
