"use client";

import { Loader2, Mic, MicOff, Search, Send, Square } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useState } from "react";

type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};

type XSearchItem = {
  author?: string;
  text?: string;
  content?: string;
};

type StreamStatusData = {
  status?: string;
  provider?: string;
  model?: string;
  preset?: string;
  tier?: string;
  failedModels?: string[];
  candidateModels?: string[];
  predictionDomain?: string;
  predictionConfidence?: number;
  quality?: {
    score?: number;
    classification?: string;
  };
  credits?: {
    spent?: number;
    remaining?: number;
  };
  usage?: {
    remainingToday?: number;
    remainingThisWeek?: number | null;
    replayed?: boolean;
  };
};

export function ChatStreamPanel() {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [xQuery, setXQuery] = useState("");
  const [objective, setObjective] = useState("");
  const [responseStyle, setResponseStyle] = useState<"concise" | "coach" | "operator">("operator");
  const [freedomMode, setFreedomMode] = useState<"uncensored" | "standard">("uncensored");
  const [preset, setPreset] = useState("operator_exec");
  const [xLoading, setXLoading] = useState(false);
  const [xError, setXError] = useState("");
  const [localError, setLocalError] = useState("");
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    clearError,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/use-chat",
      body: {
        objective: objective.trim() || undefined,
        responseStyle,
        freedomMode,
        preset,
        context: {
          xSearchQuery: xQuery.trim() || undefined,
        },
      },
    }),
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = Boolean(
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
    );
    setVoiceSupported(supported);
  }, []);

  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechCtor = (
      window as Window & {
        SpeechRecognition?: new () => VoiceRecognition;
        webkitSpeechRecognition?: new () => VoiceRecognition;
      }
    ).SpeechRecognition ||
      (
        window as Window & {
          SpeechRecognition?: new () => VoiceRecognition;
          webkitSpeechRecognition?: new () => VoiceRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechCtor) {
      setLocalError("Voice mode is not available in this browser.");
      return;
    }

    if (recording) {
      setRecording(false);
      return;
    }

    try {
      const recognition = new SpeechCtor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (typeof transcript === "string" && transcript.trim()) {
          setInput((prev) => `${prev}${prev.trim() ? " " : ""}${transcript.trim()}`);
        }
      };
      recognition.onerror = () => {
        setLocalError("Voice capture failed. Please try again.");
      };
      recognition.onend = () => {
        setRecording(false);
      };
      setLocalError("");
      setRecording(true);
      recognition.start();
    } catch {
      setRecording(false);
      setLocalError("Could not start voice capture.");
    }
  };

  const addXContext = async () => {
    if (!xQuery.trim()) return;
    setXLoading(true);
    setXError("");

    try {
      const response = await fetch(`/api/ai/x-ecosystem-search?q=${encodeURIComponent(xQuery.trim())}&limit=3`);
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to load X context");
      }

      const results = Array.isArray(data.results) ? (data.results as XSearchItem[]) : [];
      if (results.length === 0) {
        setXError("No context found for this query.");
        return;
      }

      const contextText = results
        .map((item) => `- ${item.author || "source"}: ${(item.text || item.content || "").slice(0, 220)}`)
        .join("\n");

      setInput((prev) => `${prev}${prev.trim() ? "\n\n" : ""}X ecosystem context:\n${contextText}`);
    } catch (err) {
      setXError(err instanceof Error ? err.message : "Unable to load X context");
    } finally {
      setXLoading(false);
    }
  };

  const isStreaming = status === "streaming" || status === "submitted";

  const latestStatusData = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      for (let j = message.parts.length - 1; j >= 0; j -= 1) {
        const part = message.parts[j] as { type?: string; data?: unknown };
        if (part?.type === "data-status" && part?.data && typeof part.data === "object") {
          return part.data as StreamStatusData;
        }
      }
    }
    return null;
  })();

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    clearError();
    await sendMessage({ text });
    setInput("");
  };

  return (
    <div className="theme-panel rounded-xl border border-emerald-500/20 bg-emerald-600/10 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-200/80">Vercel AI SDK (Beta)</p>
          <h3 className="text-lg font-bold text-emerald-100">Streaming Chat Lane</h3>
        </div>
        {isStreaming ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1 rounded border border-rose-400/35 bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-100"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        ) : null}
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Optional objective (e.g. Build a safer 7-day plan)"
          className="rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none placeholder:text-emerald-100/45 md:col-span-2"
        />
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <select
          value={responseStyle}
          onChange={(e) => setResponseStyle(e.target.value as "concise" | "coach" | "operator")}
          title="Response style"
          aria-label="Response style"
          className="rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none"
        >
          <option value="operator">Operator style</option>
          <option value="coach">Coach style</option>
          <option value="concise">Concise style</option>
        </select>

        <select
          value={freedomMode}
          onChange={(e) => setFreedomMode(e.target.value as "uncensored" | "standard")}
          title="Freedom mode"
          aria-label="Freedom mode"
          className="rounded-lg border border-fuchsia-400/35 bg-black/35 px-3 py-2 text-sm text-fuchsia-100 outline-none"
        >
          <option value="uncensored">Open prompts (lawful)</option>
          <option value="standard">Standard guardrails</option>
        </select>

        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          title="Preset"
          aria-label="Preset"
          className="rounded-lg border border-cyan-400/35 bg-black/35 px-3 py-2 text-sm text-cyan-100 outline-none"
        >
          <option value="operator_exec">Execution Coach</option>
          <option value="navigator_fast">Quick Thinker</option>
          <option value="analyst_risk">Risk Analyst</option>
          <option value="creative_growth">Growth Writer</option>
          <option value="deep_research">Deep Researcher</option>
          <option value="fallback_safe">Safe Backup</option>
        </select>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          value={xQuery}
          onChange={(e) => setXQuery(e.target.value)}
          placeholder="Optional: pull live X ecosystem context"
          className="rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none placeholder:text-emerald-100/45"
        />
        <button
          type="button"
          onClick={addXContext}
          disabled={!xQuery.trim() || xLoading}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          {xLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Add Context
        </button>
      </div>

      {xError ? <p className="mb-2 text-xs text-rose-200">{xError}</p> : null}

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-emerald-500/20 bg-black/30 px-3 py-2 text-xs text-emerald-100/85">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/70">Lane status</p>
          <p className="mt-1 font-semibold">
            {latestStatusData?.status ? latestStatusData.status.toUpperCase() : isStreaming ? "STREAMING" : "READY"}
          </p>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-black/30 px-3 py-2 text-xs text-cyan-100/85">
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/70">Model / Preset</p>
          <p className="mt-1 font-semibold truncate">{latestStatusData?.model || "auto"}</p>
          <p className="truncate text-[11px] opacity-80">{latestStatusData?.preset || preset}</p>
        </div>
        <div className="rounded-lg border border-fuchsia-500/20 bg-black/30 px-3 py-2 text-xs text-fuchsia-100/85">
          <p className="text-[10px] uppercase tracking-wider text-fuchsia-300/70">Tier / Domain</p>
          <p className="mt-1 font-semibold">{latestStatusData?.tier || (freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD")}</p>
          <p className="text-[11px] opacity-80">
            {(latestStatusData?.predictionDomain || "general")} · {Math.round(latestStatusData?.predictionConfidence || 0)}%
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-black/30 px-3 py-2 text-xs text-amber-100/85">
          <p className="text-[10px] uppercase tracking-wider text-amber-300/70">Usage / Credits</p>
          <p className="mt-1 font-semibold">
            D{latestStatusData?.usage?.remainingToday ?? "-"}
            {" "}· W{latestStatusData?.usage?.remainingThisWeek ?? "-"}
          </p>
          <p className="text-[11px] opacity-80">
            -{latestStatusData?.credits?.spent ?? 0} / {latestStatusData?.credits?.remaining ?? "-"} left
          </p>
        </div>
      </div>

      {latestStatusData?.quality ? (
        <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
          <p className="font-semibold">Response Quality: {latestStatusData.quality.classification || "n/a"} ({Math.round(latestStatusData.quality.score || 0)}/100)</p>
          <p className="mt-1 text-[11px] text-cyan-100/75">
            Provider: {latestStatusData.provider || "stream"}
            {Array.isArray(latestStatusData.failedModels) && latestStatusData.failedModels.length > 0
              ? ` · failover used (${latestStatusData.failedModels.length} degraded model${latestStatusData.failedModels.length > 1 ? "s" : ""})`
              : " · no failover events"}
          </p>
        </div>
      ) : null}

      <div className="mb-3 max-h-[320px] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-300/75">Ask anything to begin streaming chat. Tip: add X context first for richer signal-aware responses.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-50"
                    : "border-emerald-400/25 bg-emerald-500/10 text-emerald-50"
                }`}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider opacity-75">{message.role}</p>
                <p className="whitespace-pre-wrap">
                  {message.parts
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join("")}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={submitMessage} className="space-y-2">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Prompt TradeHax AI (streaming)..."
            rows={3}
            className="flex-1 resize-none rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none placeholder:text-emerald-100/45"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              disabled={!voiceSupported}
              className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/20 px-3 py-2 text-sm font-semibold text-fuchsia-100 disabled:opacity-50"
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {recording ? "Stop" : "Voice"}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/25 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </div>
      </form>

      {(error || localError) && (
        <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error?.message || localError}
        </div>
      )}
    </div>
  );
}
