"use client";

import { Clapperboard, Image as ImageIcon, Loader2, Mic, MicOff, Search, Send, Square } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useState } from "react";
import { SafetyStateBanner } from "@/components/ai/SafetyStateBanner";
import { ContextSignalPanel } from "@/components/ai/ContextSignalPanel";

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
  cached?: boolean;
  cachedAt?: string;
  sloFallbackTriggered?: boolean;
  sloFallbackFromModel?: string;
  sloFallbackToModel?: string;
  responseLatencyMs?: number;
  sloProfile?: "latency" | "balanced" | "quality";
  sloTargetLatencyMs?: number;
  sloMaxTokens?: number;
  tier?: string;
  policyMode?: string;
  lawfulOnly?: boolean;
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

type MultimodalTab = "text" | "image" | "video";

type MultimodalImageResult = {
  url: string;
  prompt: string;
  style: "trading" | "nft" | "hero" | "general";
  model?: string;
  width?: number;
  height?: number;
};

type VideoConceptResult = {
  concept: string;
  format: "short" | "ad" | "explainer";
  scenes: string[];
  cta: string;
  visualDirection: string;
  model?: string;
};

export function ChatStreamPanel() {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [xQuery, setXQuery] = useState("");
  const [objective, setObjective] = useState("");
  const [responseStyle, setResponseStyle] = useState<"concise" | "coach" | "operator">("operator");
  const [freedomMode, setFreedomMode] = useState<"uncensored" | "standard">("uncensored");
  const [preset, setPreset] = useState("operator_exec");
  const [sloProfile, setSloProfile] = useState<"latency" | "balanced" | "quality">("balanced");
  const [xLoading, setXLoading] = useState(false);
  const [xError, setXError] = useState("");
  const [localError, setLocalError] = useState("");
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<MultimodalTab>("text");

  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState<"trading" | "nft" | "hero" | "general">("general");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageResult, setImageResult] = useState<MultimodalImageResult | null>(null);

  const [videoGoal, setVideoGoal] = useState("");
  const [videoFormat, setVideoFormat] = useState<"short" | "ad" | "explainer">("short");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoResult, setVideoResult] = useState<VideoConceptResult | null>(null);

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
        sloProfile,
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

  const latestAssistantText = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role !== "assistant") continue;
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
        .trim();
      if (text) return text;
    }
    return "";
  })();

  const seedMultimodalFromLatest = () => {
    if (!latestAssistantText) {
      setLocalError("Generate at least one AI response before using multimodal handoff.");
      return;
    }

    const seededImagePrompt = `Create a high-impact visual from this strategy/context:\n\n${latestAssistantText.slice(0, 1200)}`;
    const seededVideoGoal = `Turn this response into a concise video concept with scenes and CTA:\n\n${latestAssistantText.slice(0, 1200)}`;

    setImagePrompt((prev) => (prev.trim() ? prev : seededImagePrompt));
    setVideoGoal((prev) => (prev.trim() ? prev : seededVideoGoal));
    setLocalError("");
  };

  const generateImageFromContext = async () => {
    const promptToUse = imagePrompt.trim() || latestAssistantText.trim();
    if (!promptToUse) {
      setImageError("No context available. Ask the AI first or enter an image prompt.");
      return;
    }

    setImageLoading(true);
    setImageError("");

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          style: imageStyle,
          width: imageStyle === "hero" ? 1920 : 1024,
          height: imageStyle === "hero" ? 1080 : 1024,
          safetyMode: freedomMode === "uncensored" ? "open" : "standard",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || "Image generation failed");
      }

      setImageResult({
        url: data.url,
        prompt: data.prompt || promptToUse,
        style: data.style || imageStyle,
        model: data.model,
        width: data.width,
        height: data.height,
      });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setImageLoading(false);
    }
  };

  const generateVideoConcept = async () => {
    const goal = videoGoal.trim() || latestAssistantText.trim();
    if (!goal) {
      setVideoError("No context available. Ask the AI first or enter a video objective.");
      return;
    }

    setVideoLoading(true);
    setVideoError("");

    try {
      const response = await fetch("/api/ai/generate-video-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          format: videoFormat,
          style: responseStyle,
          objective,
          context: {
            latestAssistantText: latestAssistantText.slice(0, 2000),
            xSearchQuery: xQuery.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || "Video concept generation failed");
      }

      setVideoResult({
        concept: data.concept,
        format: data.format,
        scenes: Array.isArray(data.scenes) ? data.scenes : [],
        cta: data.cta || "",
        visualDirection: data.visualDirection || "",
        model: data.model,
      });
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Video concept generation failed");
    } finally {
      setVideoLoading(false);
    }
  };

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

      <div className="mb-3 grid gap-2 sm:grid-cols-4">
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

        <select
          value={sloProfile}
          onChange={(e) => setSloProfile(e.target.value as "latency" | "balanced" | "quality")}
          title="SLO profile"
          aria-label="SLO profile"
          className="rounded-lg border border-amber-400/35 bg-black/35 px-3 py-2 text-sm text-amber-100 outline-none"
        >
          <option value="latency">Latency-first</option>
          <option value="balanced">Balanced</option>
          <option value="quality">Quality-first</option>
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

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-white/15 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "text" ? "bg-emerald-500/25 text-emerald-100" : "text-zinc-200/80 hover:bg-white/10"
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "image" ? "bg-cyan-500/25 text-cyan-100" : "text-zinc-200/80 hover:bg-white/10"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "video" ? "bg-fuchsia-500/25 text-fuchsia-100" : "text-zinc-200/80 hover:bg-white/10"
            }`}
          >
            <Clapperboard className="h-3.5 w-3.5" />
            Video Concept
          </button>
        </div>

        <button
          type="button"
          onClick={seedMultimodalFromLatest}
          className="rounded border border-cyan-400/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100"
        >
          Use latest AI response as multimodal context
        </button>
      </div>

      {latestStatusData?.cached && (
        <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          <p className="font-semibold">⚡ Quick replay from cache</p>
          <p className="mt-1 text-[11px] opacity-90">
            Instant response served from recent cache ({latestStatusData?.cachedAt ? `cached ${new Date(latestStatusData.cachedAt).toLocaleTimeString()}` : "just now"})
          </p>
        </div>
      )}

      {latestStatusData?.sloFallbackTriggered && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <p className="font-semibold">Adaptive SLO fallback engaged</p>
          <p className="mt-1 text-[11px] opacity-90">
            Switched from {latestStatusData?.sloFallbackFromModel || "initial model"} to {latestStatusData?.sloFallbackToModel || latestStatusData?.model || "fallback model"} to preserve latency target.
          </p>
        </div>
      )}

      <SafetyStateBanner
        freedomMode={freedomMode}
        policyMode={latestStatusData?.policyMode}
        lawfulOnly={latestStatusData?.lawfulOnly ?? true}
      />

      <ContextSignalPanel
        objective={objective}
        xQuery={xQuery}
        predictionDomain={latestStatusData?.predictionDomain}
        predictionConfidence={latestStatusData?.predictionConfidence}
      />

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
          <p className="truncate text-[11px] opacity-80">
            {latestStatusData?.preset || preset} · SLO {(latestStatusData?.sloProfile || sloProfile).toUpperCase()}
          </p>
        </div>
        <div className="rounded-lg border border-fuchsia-500/20 bg-black/30 px-3 py-2 text-xs text-fuchsia-100/85">
          <p className="text-[10px] uppercase tracking-wider text-fuchsia-300/70">Tier / Domain</p>
          <p className="mt-1 font-semibold">{latestStatusData?.tier || (freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD")}</p>
          <p className="text-[11px] opacity-80">
            {(latestStatusData?.predictionDomain || "general")} · {Math.round(latestStatusData?.predictionConfidence || 0)}%
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-black/30 px-3 py-2 text-xs text-amber-100/85">
          <p className="text-[10px] uppercase tracking-wider text-amber-300/70">Usage / Credits / SLO</p>
          <p className="mt-1 font-semibold">
            D{latestStatusData?.usage?.remainingToday ?? "-"}
            {" "}· W{latestStatusData?.usage?.remainingThisWeek ?? "-"}
          </p>
          <p className="text-[11px] opacity-80">
            -{latestStatusData?.credits?.spent ?? 0} / {latestStatusData?.credits?.remaining ?? "-"} left
          </p>
          <p className="text-[11px] opacity-80">
            {latestStatusData?.responseLatencyMs ?? "-"}ms actual · {latestStatusData?.sloTargetLatencyMs ?? "-"}ms target · {latestStatusData?.sloMaxTokens ?? "-"} max tokens
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

      {activeTab === "text" ? (
        <>
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
        </>
      ) : null}

      {activeTab === "image" ? (
        <div className="space-y-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3">
          <p className="text-xs text-cyan-100/85">Generate a visual directly from the latest chat response or your custom prompt.</p>

          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the image to generate..."
            rows={4}
            className="w-full resize-none rounded-lg border border-cyan-400/35 bg-black/35 px-3 py-2 text-sm text-cyan-100 outline-none placeholder:text-cyan-100/45"
          />

          <div className="grid grid-cols-4 gap-2">
            {(["general", "trading", "nft", "hero"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setImageStyle(style)}
                className={`rounded px-2 py-1.5 text-xs font-semibold uppercase ${
                  imageStyle === style ? "bg-cyan-500 text-white" : "bg-black/35 text-cyan-100/80"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={generateImageFromContext}
            disabled={imageLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
          >
            {imageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Generate Image from Context
          </button>

          {imageError ? <p className="text-xs text-rose-200">{imageError}</p> : null}

          {imageResult ? (
            <div className="space-y-2 rounded-lg border border-cyan-300/30 bg-black/30 p-2">
              <img src={imageResult.url} alt={imageResult.prompt} className="w-full rounded" />
              <p className="text-[11px] text-cyan-100/80">{imageResult.prompt}</p>
              <p className="text-[11px] text-cyan-100/65">
                {imageResult.style} · {imageResult.model || "model:auto"}
                {imageResult.width && imageResult.height ? ` · ${imageResult.width}x${imageResult.height}` : ""}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "video" ? (
        <div className="space-y-3 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 p-3">
          <p className="text-xs text-fuchsia-100/85">Create a ready-to-produce video concept and storyboard from conversation context.</p>

          <textarea
            value={videoGoal}
            onChange={(e) => setVideoGoal(e.target.value)}
            placeholder="What should this video achieve?"
            rows={4}
            className="w-full resize-none rounded-lg border border-fuchsia-400/35 bg-black/35 px-3 py-2 text-sm text-fuchsia-100 outline-none placeholder:text-fuchsia-100/45"
          />

          <select
            value={videoFormat}
            onChange={(e) => setVideoFormat(e.target.value as "short" | "ad" | "explainer")}
            title="Video format"
            aria-label="Video format"
            className="rounded-lg border border-fuchsia-400/35 bg-black/35 px-3 py-2 text-sm text-fuchsia-100 outline-none"
          >
            <option value="short">Short-form (15-30s)</option>
            <option value="ad">Ad creative (30-45s)</option>
            <option value="explainer">Explainer (45-90s)</option>
          </select>

          <button
            type="button"
            onClick={generateVideoConcept}
            disabled={videoLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/20 px-3 py-2 text-sm font-semibold text-fuchsia-100 disabled:opacity-50"
          >
            {videoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
            Generate Video Concept
          </button>

          {videoError ? <p className="text-xs text-rose-200">{videoError}</p> : null}

          {videoResult ? (
            <div className="space-y-2 rounded-lg border border-fuchsia-300/30 bg-black/30 p-3">
              <p className="text-sm font-semibold text-fuchsia-100">{videoResult.concept}</p>
              <p className="text-[11px] text-fuchsia-100/70">Format: {videoResult.format}</p>
              <p className="text-[11px] text-fuchsia-100/80">Visual direction: {videoResult.visualDirection}</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-fuchsia-100/85">
                {videoResult.scenes.map((scene, index) => (
                  <li key={`${scene}-${index}`}>{scene}</li>
                ))}
              </ul>
              <p className="text-xs font-semibold text-fuchsia-100">CTA: {videoResult.cta}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {(error || localError) && (
        <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error?.message || localError}
        </div>
      )}
    </div>
  );
}
