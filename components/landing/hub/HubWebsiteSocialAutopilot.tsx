"use client";

import { Cpu } from "lucide-react";

type SocialChannel = "youtube" | "discord" | "x" | "linkedin" | "instagram" | "facebook" | "telegram" | "tiktok";

type SocialChannelOption = {
  id: SocialChannel;
  label: string;
};

type SocialOpsSnapshot = {
  connectors?: Partial<Record<SocialChannel, boolean>>;
  queue?: Array<{
    id: string;
    channel: SocialChannel;
    runAt: string;
    status: string;
  }>;
  calendar?: Array<{
    draftId: string;
    runAt?: string;
    status: string;
    focus: string;
  }>;
};

type HubWebsiteSocialAutopilotProps = {
  websiteSourceUrl: string;
  onWebsiteSourceUrlChange: (value: string) => void;
  autopilotFocus: string;
  onAutopilotFocusChange: (value: string) => void;
  socialChannels: SocialChannelOption[];
  autopilotChannels: SocialChannel[];
  onToggleAutopilotChannel: (channelId: SocialChannel) => void;
  isGeneratingAutopilot: boolean;
  onGenerateDrafts: () => void;
  autopilotOpsLoading: boolean;
  onSaveToOps: () => void;
  onRefreshOps: () => void;
  autopilotOpsDraftId: string;
  onAutopilotOpsDraftIdChange: (value: string) => void;
  autopilotScheduleAt: string;
  onAutopilotScheduleAtChange: (value: string) => void;
  onSubmitApproval: () => void;
  onApproveDraft: () => void;
  onScheduleQueue: () => void;
  onPublishNow: () => void;
  onRunDueJobs: () => void;
  autopilotImpressions: string;
  onAutopilotImpressionsChange: (value: string) => void;
  autopilotEngagements: string;
  onAutopilotEngagementsChange: (value: string) => void;
  autopilotClicks: string;
  onAutopilotClicksChange: (value: string) => void;
  onSyncMetrics: () => void;
  autopilotOpsSnapshot: SocialOpsSnapshot | null;
};

export function HubWebsiteSocialAutopilot({
  websiteSourceUrl,
  onWebsiteSourceUrlChange,
  autopilotFocus,
  onAutopilotFocusChange,
  socialChannels,
  autopilotChannels,
  onToggleAutopilotChannel,
  isGeneratingAutopilot,
  onGenerateDrafts,
  autopilotOpsLoading,
  onSaveToOps,
  onRefreshOps,
  autopilotOpsDraftId,
  onAutopilotOpsDraftIdChange,
  autopilotScheduleAt,
  onAutopilotScheduleAtChange,
  onSubmitApproval,
  onApproveDraft,
  onScheduleQueue,
  onPublishNow,
  onRunDueJobs,
  autopilotImpressions,
  onAutopilotImpressionsChange,
  autopilotEngagements,
  onAutopilotEngagementsChange,
  autopilotClicks,
  onAutopilotClicksChange,
  onSyncMetrics,
  autopilotOpsSnapshot,
}: HubWebsiteSocialAutopilotProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(7,11,17,0.74)] px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-zinc-300">
        <Cpu className="h-3.5 w-3.5 text-emerald-300" />
        Website → Social Autopilot
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="website-source-url-input">
          Website URL
        </label>
        <input
          id="website-source-url-input"
          value={websiteSourceUrl}
          onChange={(event) => onWebsiteSourceUrlChange(event.target.value.slice(0, 300))}
          className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="https://tradehax.net/blog/your-post"
          maxLength={300}
        />
      </div>

      <div className="mt-2">
        <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="autopilot-focus-input">
          Autopilot focus
        </label>
        <input
          id="autopilot-focus-input"
          value={autopilotFocus}
          onChange={(event) => onAutopilotFocusChange(event.target.value.slice(0, 80))}
          className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
          placeholder="cross-platform brand growth"
          maxLength={80}
        />
      </div>

      <div className="mt-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400">Channels</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {socialChannels.map((channel) => {
            const enabled = autopilotChannels.includes(channel.id);
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onToggleAutopilotChannel(channel.id)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  enabled
                    ? "border-emerald-300/35 bg-emerald-500/10 text-emerald-100"
                    : "border-white/15 bg-black/40 text-zinc-300"
                }`}
                title={`Toggle ${channel.label}`}
              >
                {channel.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGenerateDrafts}
          disabled={isGeneratingAutopilot}
          className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100 disabled:opacity-60"
          title="Generate multi-platform social drafts from website content"
        >
          {isGeneratingAutopilot ? "Generating..." : "Generate Drafts"}
        </button>
        <button
          type="button"
          onClick={onSaveToOps}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100 disabled:opacity-60"
          title="Create a managed social ops draft from the generated content"
        >
          Save to Ops
        </button>
        <button
          type="button"
          onClick={onRefreshOps}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase text-zinc-200 disabled:opacity-60"
          title="Refresh queue, calendar, and connector status"
        >
          Refresh Ops
        </button>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="autopilot-ops-draft-id-input">
            Social Ops Draft ID
          </label>
          <input
            id="autopilot-ops-draft-id-input"
            value={autopilotOpsDraftId}
            onChange={(event) => onAutopilotOpsDraftIdChange(event.target.value.slice(0, 80))}
            className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
            placeholder="draft_..."
            maxLength={80}
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="autopilot-schedule-at-input">
            Schedule (calendar)
          </label>
          <input
            id="autopilot-schedule-at-input"
            type="datetime-local"
            value={autopilotScheduleAt}
            onChange={(event) => onAutopilotScheduleAtChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmitApproval}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-fuchsia-100 disabled:opacity-60"
          title="Move draft into pending approval"
        >
          Submit Approval
        </button>
        <button
          type="button"
          onClick={onApproveDraft}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100 disabled:opacity-60"
          title="Approve draft for publishing"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onScheduleQueue}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-amber-100 disabled:opacity-60"
          title="Schedule channel queue jobs"
        >
          Schedule Queue
        </button>
        <button
          type="button"
          onClick={onPublishNow}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-red-100 disabled:opacity-60"
          title="Publish now through configured connectors"
        >
          Publish Now
        </button>
        <button
          type="button"
          onClick={onRunDueJobs}
          disabled={autopilotOpsLoading}
          className="rounded-full border border-blue-300/30 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-blue-100 disabled:opacity-60"
          title="Run due queue jobs manually"
        >
          Run Due Jobs
        </button>
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400">Feedback loop</p>
        <div className="mt-1 grid gap-2 md:grid-cols-4">
          <input
            value={autopilotImpressions}
            onChange={(event) => onAutopilotImpressionsChange(event.target.value.replace(/\D/g, "").slice(0, 9))}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
            placeholder="Impressions"
          />
          <input
            value={autopilotEngagements}
            onChange={(event) => onAutopilotEngagementsChange(event.target.value.replace(/\D/g, "").slice(0, 9))}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
            placeholder="Engagements"
          />
          <input
            value={autopilotClicks}
            onChange={(event) => onAutopilotClicksChange(event.target.value.replace(/\D/g, "").slice(0, 9))}
            className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
            placeholder="Clicks"
          />
          <button
            type="button"
            onClick={onSyncMetrics}
            disabled={autopilotOpsLoading}
            className="rounded-md border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-100 disabled:opacity-60"
          >
            Sync Metrics
          </button>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[10px] text-zinc-300">
        <p className="font-mono uppercase tracking-wide text-zinc-400">Connector status</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {socialChannels.map((channel) => {
            const configured = Boolean(autopilotOpsSnapshot?.connectors?.[channel.id]);
            return (
              <span
                key={`connector-${channel.id}`}
                className={`rounded-full border px-2 py-0.5 ${configured ? "border-emerald-300/35 bg-emerald-500/10 text-emerald-100" : "border-white/15 bg-black/40 text-zinc-400"}`}
              >
                {channel.label}: {configured ? "ON" : "OFF"}
              </span>
            );
          })}
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <p className="font-mono uppercase tracking-wide text-zinc-400">Calendar</p>
            <div className="mt-1 max-h-24 space-y-1 overflow-auto pr-1">
              {(autopilotOpsSnapshot?.calendar || []).slice(0, 4).map((entry) => (
                <div key={`${entry.draftId}_${entry.runAt || "na"}`} className="rounded border border-white/10 bg-black/35 px-1.5 py-1">
                  <p className="text-zinc-200">{entry.focus}</p>
                  <p className="text-zinc-500">{entry.runAt ? new Date(entry.runAt).toLocaleString() : "unscheduled"} • {entry.status}</p>
                </div>
              ))}
              {(autopilotOpsSnapshot?.calendar || []).length === 0 && (
                <p className="text-zinc-500">No scheduled calendar entries yet.</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-mono uppercase tracking-wide text-zinc-400">Queue</p>
            <div className="mt-1 max-h-24 space-y-1 overflow-auto pr-1">
              {(autopilotOpsSnapshot?.queue || []).slice(0, 5).map((job) => (
                <div key={job.id} className="rounded border border-white/10 bg-black/35 px-1.5 py-1 text-zinc-200">
                  <p>{job.channel.toUpperCase()} • {job.status}</p>
                  <p className="text-zinc-500">{new Date(job.runAt).toLocaleString()}</p>
                </div>
              ))}
              {(autopilotOpsSnapshot?.queue || []).length === 0 && (
                <p className="text-zinc-500">Queue is idle.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
