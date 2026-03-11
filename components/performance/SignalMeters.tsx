interface ConfidenceMeterProps {
    label: string;
    value: number;
    tone?: "cyan" | "emerald" | "rose" | "amber";
    subtitle?: string;
}

interface ProbabilitySplitMeterProps {
    longProbability: number;
    shortProbability: number;
    confidence?: number;
}

function clampPercent(value: number) {
    return Math.max(0, Math.min(Math.round(value * 100), 100));
}

function toneClasses(tone: NonNullable<ConfidenceMeterProps["tone"]>) {
    if (tone === "emerald") {
        return "text-emerald-100 border-emerald-400/30 bg-emerald-500/10 [&::-webkit-progress-value]:bg-emerald-400 [&::-moz-progress-bar]:bg-emerald-400";
    }
    if (tone === "rose") {
        return "text-rose-100 border-rose-400/30 bg-rose-500/10 [&::-webkit-progress-value]:bg-rose-400 [&::-moz-progress-bar]:bg-rose-400";
    }
    if (tone === "amber") {
        return "text-amber-100 border-amber-400/30 bg-amber-500/10 [&::-webkit-progress-value]:bg-amber-400 [&::-moz-progress-bar]:bg-amber-400";
    }
    return "text-cyan-100 border-cyan-400/30 bg-cyan-500/10 [&::-webkit-progress-value]:bg-cyan-400 [&::-moz-progress-bar]:bg-cyan-400";
}

export function ConfidenceMeter({ label, value, tone = "cyan", subtitle }: ConfidenceMeterProps) {
    const percent = clampPercent(value);

    return (
        <div className={`rounded-xl border p-3 ${toneClasses(tone)}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">{label}</p>
                <p className="text-lg font-semibold">{percent}%</p>
            </div>
            <progress
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30 [&::-webkit-progress-bar]:bg-black/30"
                value={percent}
                max={100}
                aria-label={`${label} ${percent}%`}
            />
            {subtitle ? <p className="mt-2 text-[11px] opacity-75">{subtitle}</p> : null}
        </div>
    );
}

export function ProbabilitySplitMeter({ longProbability, shortProbability, confidence }: ProbabilitySplitMeterProps) {
    const longPercent = clampPercent(longProbability);
    const shortPercent = clampPercent(shortProbability);
    const confidencePercent = typeof confidence === "number" ? clampPercent(confidence) : null;

    return (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
                <span>Probability Balance</span>
                <span>{longPercent}% / {shortPercent}%</span>
            </div>
            <div className="mt-2 grid gap-2">
                <progress
                    className="h-2 w-full overflow-hidden rounded-full bg-black/30 [&::-webkit-progress-bar]:bg-black/30 [&::-webkit-progress-value]:bg-emerald-400 [&::-moz-progress-bar]:bg-emerald-400"
                    value={longPercent}
                    max={100}
                    aria-label={`Long probability ${longPercent}%`}
                />
                <progress
                    className="h-2 w-full overflow-hidden rounded-full bg-black/30 [&::-webkit-progress-bar]:bg-black/30 [&::-webkit-progress-value]:bg-rose-400 [&::-moz-progress-bar]:bg-rose-400"
                    value={shortPercent}
                    max={100}
                    aria-label={`Short probability ${shortPercent}%`}
                />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-100/85">
                <span>Long {longPercent}%</span>
                <span className="text-rose-100/85">Short {shortPercent}%</span>
            </div>
            {confidencePercent !== null ? (
                <div className="mt-3 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">
                        <span>Confidence</span>
                        <span>{confidencePercent}%</span>
                    </div>
                    <progress
                        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30 [&::-webkit-progress-bar]:bg-black/30 [&::-webkit-progress-value]:bg-cyan-400 [&::-moz-progress-bar]:bg-cyan-400"
                        value={confidencePercent}
                        max={100}
                        aria-label={`Confidence ${confidencePercent}%`}
                    />
                </div>
            ) : null}
        </div>
    );
}
