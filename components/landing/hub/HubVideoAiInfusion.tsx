"use client";

import { Video } from "lucide-react";

type HubVideoAiInfusionProps = {
  videoSourceUrl: string;
  onVideoSourceUrlChange: (value: string) => void;
  videoInstructionGoal: string;
  onVideoInstructionGoalChange: (value: string) => void;
  videoCue: string;
  onVideoCueChange: (value: string) => void;
  onInsertBrief: () => void;
  onStoreBrief: () => void;
};

export function HubVideoAiInfusion({
  videoSourceUrl,
  onVideoSourceUrlChange,
  videoInstructionGoal,
  onVideoInstructionGoalChange,
  videoCue,
  onVideoCueChange,
  onInsertBrief,
  onStoreBrief,
}: HubVideoAiInfusionProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(9,12,18,0.72)] px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-zinc-300">
        <Video className="h-3.5 w-3.5 text-cyan-300" />
        Video AI Infusion
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="video-source-url-input">
            Video URL
          </label>
          <input
            id="video-source-url-input"
            value={videoSourceUrl}
            onChange={(event) => onVideoSourceUrlChange(event.target.value.slice(0, 300))}
            className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
            placeholder="https://youtube.com/..."
            maxLength={300}
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="video-goal-input">
            Objective
          </label>
          <input
            id="video-goal-input"
            value={videoInstructionGoal}
            onChange={(event) => onVideoInstructionGoalChange(event.target.value.slice(0, 140))}
            className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
            placeholder="Extract actionable steps"
            maxLength={140}
          />
        </div>
      </div>

      <div className="mt-2">
        <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="video-cue-input">
          Focus cue (optional)
        </label>
        <input
          id="video-cue-input"
          value={videoCue}
          onChange={(event) => onVideoCueChange(event.target.value.slice(0, 140))}
          className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          placeholder="e.g. Timestamp 03:20 risk management section"
          maxLength={140}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onInsertBrief}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
          title="Insert video instruction brief into chat input"
        >
          Insert Brief
        </button>
        <button
          type="button"
          onClick={onStoreBrief}
          className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-fuchsia-100"
          title="Store video instruction brief in long-term memory"
        >
          Store Brief
        </button>
      </div>
    </div>
  );
}
