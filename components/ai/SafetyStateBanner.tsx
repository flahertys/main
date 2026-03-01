type SafetyStateBannerProps = {
  freedomMode: "uncensored" | "standard";
  policyMode?: string;
  lawfulOnly?: boolean;
};

export function SafetyStateBanner({ freedomMode, policyMode, lawfulOnly = true }: SafetyStateBannerProps) {
  const isOpenPromptMode = freedomMode === "uncensored";

  return (
    <div className="mb-3 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100/90">
      <p className="font-semibold">
        {isOpenPromptMode ? "Open Prompt Mode" : "Standard Guardrails"}
        {policyMode ? ` · ${policyMode}` : ""}
      </p>
      <p className="mt-1 text-[11px] text-fuchsia-100/75">
        {lawfulOnly
          ? "Broad lawful prompts are enabled, while illegal/harmful classes remain blocked server-side."
          : "Safety policy metadata unavailable for this turn. Default safeguards are still active."}
      </p>
    </div>
  );
}
