"use client";

import { Clapperboard, Image as ImageIcon, Loader2, Mic, MicOff, Search, Send, Square } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  slashCommand?: "plan" | "risk" | "parabolic" | "odinsignal" | null;
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

type ExperienceMode = "beginner" | "odin";
type SkillLevel = "beginner" | "intermediate" | "advanced";

const EXPERIENCE_MODE_KEY = "tradehax-chat-stream-experience-v1";
const ONBOARDING_MEMORY_KEY = "tradehax-chat-stream-onboarding-v1";
const FRICTION_TELEMETRY_KEY = "tradehax-chat-stream-friction-v1";

type OnboardingMemory = {
  objective: string;
  experienceMode: ExperienceMode;
  skillLevel: SkillLevel;
  responseStyle: "concise" | "coach" | "operator";
  freedomMode: "uncensored" | "standard";
  preset: string;
  sloProfile: "latency" | "balanced" | "quality";
  xQuery: string;
  updatedAt: number;
};

type FrictionTelemetry = {
  sends: number;
  emptySubmitBlocked: number;
  voiceErrors: number;
  xContextFailures: number;
  generationErrors: number;
  playbooksApplied: number;
  odinToggles: number;
  slashPrefills: number;
  multimodalSeeds: number;
  startedAt: number;
  updatedAt: number;
};

const BEGINNER_DEFAULTS = {
  responseStyle: "coach" as const,
  freedomMode: "standard" as const,
  preset: "navigator_fast",
  sloProfile: "balanced" as const,
  objective: "Create a beginner-safe action plan with one clear next step",
};

const ODIN_DEFAULTS = {
  responseStyle: "operator" as const,
  freedomMode: "uncensored" as const,
  preset: "deep_research",
  sloProfile: "quality" as const,
  objective: "Generate an ODIN operator brief with signal quality, risk envelope, and execution checklist",
};

const SLASH_SHORTCUTS: Array<{
  command: "/plan" | "/risk" | "/parabolic" | "/odinsignal";
  label: string;
  template: string;
}> = [
  {
    command: "/plan",
    label: "Plan",
    template: "/plan Build a 7-day execution roadmap with milestones and one measurable KPI per day.",
  },
  {
    command: "/risk",
    label: "Risk",
    template: "/risk Analyze downside risk, invalidation levels, and mitigation checklist for this setup.",
  },
  {
    command: "/parabolic",
    label: "Parabolic",
    template: "/parabolic Model bullish/base/bear paths with trigger levels and position sizing guardrails.",
  },
  {
    command: "/odinsignal",
    label: "ODIN Signal",
    template: "/odinsignal Generate a concise signal brief with confidence, catalysts, and operator next action.",
  },
];

const SKILL_LEVEL_META: Record<SkillLevel, { label: string; hint: string }> = {
  beginner: {
    label: "Beginner",
    hint: "Simple language, safer defaults, clear steps.",
  },
  intermediate: {
    label: "Intermediate",
    hint: "Balanced depth with explicit risk controls.",
  },
  advanced: {
    label: "Advanced",
    hint: "Operator-grade detail and execution structure.",
  },
};

type LaunchpadPlaybook = {
  id: "starter" | "riskshield" | "alphaops";
  label: string;
  description: string;
  objective: string;
  prompt: string;
  responseStyle: "concise" | "coach" | "operator";
  preset: string;
  sloProfile: "latency" | "balanced" | "quality";
  freedomMode: "uncensored" | "standard";
  recommendedSkill: SkillLevel;
};

const LAUNCHPAD_PLAYBOOKS: LaunchpadPlaybook[] = [
  {
    id: "starter",
    label: "Starter Autopilot",
    description: "For first-time users who need a clear, low-risk 7-day start path.",
    objective: "Build a beginner-safe 7-day market routine with one concrete action per day",
    prompt: "/plan Build a beginner-safe 7-day routine with daily tasks, time budget, and one success KPI per day.",
    responseStyle: "coach",
    preset: "navigator_fast",
    sloProfile: "balanced",
    freedomMode: "standard",
    recommendedSkill: "beginner",
  },
  {
    id: "riskshield",
    label: "Risk Shield",
    description: "For users who already trade and want tighter downside protection immediately.",
    objective: "Audit and harden risk controls before increasing exposure",
    prompt: "/risk Evaluate downside paths, invalidation levels, sizing rules, and mitigation checklist for my current process.",
    responseStyle: "operator",
    preset: "analyst_risk",
    sloProfile: "balanced",
    freedomMode: "standard",
    recommendedSkill: "intermediate",
  },
  {
    id: "alphaops",
    label: "ODIN Alpha Ops",
    description: "For power users requiring scenario-engine outputs and operator directives.",
    objective: "Generate an ODIN-grade signal brief and execution protocol",
    prompt: "/odinsignal Build a catalyst-aware signal brief with confidence tiers, scenario tree, and operator next action.",
    responseStyle: "operator",
    preset: "deep_research",
    sloProfile: "quality",
    freedomMode: "uncensored",
    recommendedSkill: "advanced",
  },
];

const QUICK_START_PROMPTS: Record<SkillLevel, string[]> = {
  beginner: [
    "Build me a simple 7-day starter plan with one task per day.",
    "Explain today's best setup in plain English with one action.",
    "Give me a safe beginner checklist before I place my next trade.",
  ],
  intermediate: [
    "/risk Evaluate my current process and tighten risk controls for this week.",
    "Create a daily pre-trade checklist with invalidation and sizing steps.",
    "Build a balanced execution routine with catalyst and timing filters.",
  ],
  advanced: [
    "/odinsignal Generate an operator brief with confidence tiers and triggers.",
    "/parabolic Model bullish/base/bear scenarios with position envelopes.",
    "Design a high-frequency decision matrix with risk-adjusted execution rules.",
  ],
};

const STARTER_SCENARIOS: Record<
  "new-user-setup" | "first-trade-plan" | "content-engine",
  {
    objective: string;
    prompt: string;
    skillLevel: SkillLevel;
    experienceMode: ExperienceMode;
    preset: string;
    sloProfile: "latency" | "balanced" | "quality";
    responseStyle: "concise" | "coach" | "operator";
    freedomMode: "uncensored" | "standard";
  }
> = {
  "new-user-setup": {
    objective: "Complete first-time onboarding and define one immediate next action",
    prompt: "/plan I am new. Build a 5-step onboarding flow with one immediate task and a beginner-safe weekly routine.",
    skillLevel: "beginner",
    experienceMode: "beginner",
    preset: "navigator_fast",
    sloProfile: "balanced",
    responseStyle: "coach",
    freedomMode: "standard",
  },
  "first-trade-plan": {
    objective: "Generate a risk-aware first trade plan with explicit invalidation",
    prompt: "/risk Build my first trade plan with setup filters, position sizing, invalidation levels, and post-trade review steps.",
    skillLevel: "intermediate",
    experienceMode: "beginner",
    preset: "analyst_risk",
    sloProfile: "balanced",
    responseStyle: "operator",
    freedomMode: "standard",
  },
  "content-engine": {
    objective: "Turn one market thesis into text + visual content assets",
    prompt: "Create a content engine plan: one thread outline, one short-form script, and one image concept from my thesis.",
    skillLevel: "intermediate",
    experienceMode: "beginner",
    preset: "creative_growth",
    sloProfile: "balanced",
    responseStyle: "coach",
    freedomMode: "standard",
  },
};

type ResponseTransformMode = "checklist" | "risk" | "counter" | "operator";

type MissionTask = {
  id: string;
  label: string;
  status: "queued" | "executed";
  mode: ResponseTransformMode;
  createdAt: number;
};

export function ChatStreamPanel({ minimal = false }: { minimal?: boolean } = {}) {
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
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("beginner");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [showSetupPanels, setShowSetupPanels] = useState(() => !minimal);
  const [missionTasks, setMissionTasks] = useState<MissionTask[]>([]);
  const [frictionTelemetry, setFrictionTelemetry] = useState<FrictionTelemetry>({
    sends: 0,
    emptySubmitBlocked: 0,
    voiceErrors: 0,
    xContextFailures: 0,
    generationErrors: 0,
    playbooksApplied: 0,
    odinToggles: 0,
    slashPrefills: 0,
    multimodalSeeds: 0,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  });

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (minimal) {
      setShowSetupPanels(false);
      return;
    }
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    setShowSetupPanels(!mobile);
  }, [minimal]);

  useEffect(() => {
    if (minimal) {
      setActiveTab("text");
    }
  }, [minimal]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(ONBOARDING_MEMORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<OnboardingMemory>;
        if (typeof parsed.objective === "string") setObjective(parsed.objective.slice(0, 220));
        if (parsed.experienceMode === "beginner" || parsed.experienceMode === "odin") setExperienceMode(parsed.experienceMode);
        if (parsed.skillLevel === "beginner" || parsed.skillLevel === "intermediate" || parsed.skillLevel === "advanced") {
          setSkillLevel(parsed.skillLevel);
        }
        if (parsed.responseStyle === "concise" || parsed.responseStyle === "coach" || parsed.responseStyle === "operator") {
          setResponseStyle(parsed.responseStyle);
        }
        if (parsed.freedomMode === "uncensored" || parsed.freedomMode === "standard") {
          setFreedomMode(parsed.freedomMode);
        }
        if (typeof parsed.preset === "string" && parsed.preset.trim()) setPreset(parsed.preset.trim());
        if (parsed.sloProfile === "latency" || parsed.sloProfile === "balanced" || parsed.sloProfile === "quality") {
          setSloProfile(parsed.sloProfile);
        }
        if (typeof parsed.xQuery === "string") setXQuery(parsed.xQuery.slice(0, 120));
      }
    } catch {
      // Ignore malformed onboarding memory
    }

    try {
      const rawFriction = window.localStorage.getItem(FRICTION_TELEMETRY_KEY);
      if (rawFriction) {
        const parsed = JSON.parse(rawFriction) as Partial<FrictionTelemetry>;
        setFrictionTelemetry((prev) => ({
          ...prev,
          ...parsed,
          sends: Math.max(0, Number(parsed.sends) || 0),
          emptySubmitBlocked: Math.max(0, Number(parsed.emptySubmitBlocked) || 0),
          voiceErrors: Math.max(0, Number(parsed.voiceErrors) || 0),
          xContextFailures: Math.max(0, Number(parsed.xContextFailures) || 0),
          generationErrors: Math.max(0, Number(parsed.generationErrors) || 0),
          playbooksApplied: Math.max(0, Number(parsed.playbooksApplied) || 0),
          odinToggles: Math.max(0, Number(parsed.odinToggles) || 0),
          slashPrefills: Math.max(0, Number(parsed.slashPrefills) || 0),
          multimodalSeeds: Math.max(0, Number(parsed.multimodalSeeds) || 0),
          startedAt: Number(parsed.startedAt) || prev.startedAt,
          updatedAt: Date.now(),
        }));
      }
    } catch {
      // Ignore malformed friction telemetry
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(EXPERIENCE_MODE_KEY);
    if (saved === "odin") {
      setExperienceMode("odin");
      setResponseStyle(ODIN_DEFAULTS.responseStyle);
      setFreedomMode(ODIN_DEFAULTS.freedomMode);
      setPreset(ODIN_DEFAULTS.preset);
      setSloProfile(ODIN_DEFAULTS.sloProfile);
      setObjective((prev) => prev.trim() || ODIN_DEFAULTS.objective);
      return;
    }

    setExperienceMode("beginner");
    setResponseStyle(BEGINNER_DEFAULTS.responseStyle);
    setFreedomMode(BEGINNER_DEFAULTS.freedomMode);
    setPreset(BEGINNER_DEFAULTS.preset);
    setSloProfile(BEGINNER_DEFAULTS.sloProfile);
    setObjective((prev) => prev.trim() || BEGINNER_DEFAULTS.objective);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const route = params.get("route");
    const experience = params.get("experience");
    const skill = params.get("skill");
    const starter = params.get("starter");
    const starterScenario =
      starter === "new-user-setup" || starter === "first-trade-plan" || starter === "content-engine"
        ? STARTER_SCENARIOS[starter]
        : null;

    if (!route && !experience && !skill && !starterScenario) return;

    const routeToPlaybook: Record<string, LaunchpadPlaybook["id"]> = {
      scout: "starter",
      forge: "riskshield",
      odin: "alphaops",
    };

    const routePlaybookId = route ? routeToPlaybook[route] : undefined;
    const routePlaybook = routePlaybookId
      ? LAUNCHPAD_PLAYBOOKS.find((candidate) => candidate.id === routePlaybookId)
      : undefined;

    const nextExperience: ExperienceMode | null =
      starterScenario?.experienceMode ||
      (experience === "odin" || experience === "beginner"
        ? experience
        : routePlaybook?.id === "alphaops"
          ? "odin"
          : routePlaybook
            ? "beginner"
            : null);

    const nextSkill: SkillLevel | null =
      starterScenario?.skillLevel ||
      (skill === "beginner" || skill === "intermediate" || skill === "advanced"
        ? skill
        : routePlaybook?.recommendedSkill || null);

    if (nextExperience) {
      setExperienceMode(nextExperience);
      window.localStorage.setItem(EXPERIENCE_MODE_KEY, nextExperience);
      if (nextExperience === "odin") {
        setResponseStyle(ODIN_DEFAULTS.responseStyle);
        setFreedomMode(ODIN_DEFAULTS.freedomMode);
        setPreset(ODIN_DEFAULTS.preset);
        setSloProfile(ODIN_DEFAULTS.sloProfile);
        setObjective((prev) => prev.trim() || ODIN_DEFAULTS.objective);
      } else {
        setResponseStyle(BEGINNER_DEFAULTS.responseStyle);
        setFreedomMode(BEGINNER_DEFAULTS.freedomMode);
        setPreset(BEGINNER_DEFAULTS.preset);
        setSloProfile(BEGINNER_DEFAULTS.sloProfile);
        setObjective((prev) => prev.trim() || BEGINNER_DEFAULTS.objective);
      }
    }

    if (nextSkill) {
      setSkillLevel(nextSkill);
      if (nextSkill === "beginner") {
        setResponseStyle("coach");
        setPreset("navigator_fast");
        setSloProfile("balanced");
        setFreedomMode(nextExperience === "odin" ? "uncensored" : "standard");
      } else if (nextSkill === "intermediate") {
        setResponseStyle("operator");
        setPreset("analyst_risk");
        setSloProfile("balanced");
        setFreedomMode("standard");
      } else {
        setResponseStyle("operator");
        setPreset("deep_research");
        setSloProfile("quality");
        setFreedomMode("uncensored");
      }
    }

    if (routePlaybook) {
      setObjective(routePlaybook.objective);
      setInput((prev) => prev.trim() || routePlaybook.prompt);
      setShowSetupPanels(true);
    }

    if (starterScenario) {
      setObjective(starterScenario.objective);
      setInput((prev) => prev.trim() || starterScenario.prompt);
      setSkillLevel(starterScenario.skillLevel);
      setResponseStyle(starterScenario.responseStyle);
      setPreset(starterScenario.preset);
      setSloProfile(starterScenario.sloProfile);
      setFreedomMode(starterScenario.freedomMode);
      setShowSetupPanels(true);
      setActiveTab("text");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: OnboardingMemory = {
      objective: objective.slice(0, 220),
      experienceMode,
      skillLevel,
      responseStyle,
      freedomMode,
      preset,
      sloProfile,
      xQuery: xQuery.slice(0, 120),
      updatedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(ONBOARDING_MEMORY_KEY, JSON.stringify(payload));
    } catch {
      // Ignore persistence failure
    }
  }, [objective, experienceMode, skillLevel, responseStyle, freedomMode, preset, sloProfile, xQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(FRICTION_TELEMETRY_KEY, JSON.stringify(frictionTelemetry));
    } catch {
      // Ignore persistence failure
    }
  }, [frictionTelemetry]);

  const trackFriction = (update: Partial<FrictionTelemetry>) => {
    setFrictionTelemetry((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(update).map(([key, value]) => {
          if (typeof value !== "number") return [key, value];
          const base = (prev as Record<string, number>)[key] || 0;
          return [key, base + value];
        }),
      ) as Partial<FrictionTelemetry>,
      updatedAt: Date.now(),
    }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        setExperienceMode((current) => {
          const next: ExperienceMode = current === "beginner" ? "odin" : "beginner";
          if (next === "odin") {
            setResponseStyle(ODIN_DEFAULTS.responseStyle);
            setFreedomMode(ODIN_DEFAULTS.freedomMode);
            setPreset(ODIN_DEFAULTS.preset);
            setSloProfile(ODIN_DEFAULTS.sloProfile);
            setObjective((prev) => prev.trim() || ODIN_DEFAULTS.objective);
          } else {
            setResponseStyle(BEGINNER_DEFAULTS.responseStyle);
            setFreedomMode(BEGINNER_DEFAULTS.freedomMode);
            setPreset(BEGINNER_DEFAULTS.preset);
            setSloProfile(BEGINNER_DEFAULTS.sloProfile);
            setObjective((prev) => prev.trim() || BEGINNER_DEFAULTS.objective);
          }
          window.localStorage.setItem(EXPERIENCE_MODE_KEY, next);
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
      trackFriction({ voiceErrors: 1 });
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
        trackFriction({ voiceErrors: 1 });
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
      trackFriction({ voiceErrors: 1 });
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
        trackFriction({ xContextFailures: 1 });
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
      trackFriction({ xContextFailures: 1 });
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

  const nextBestAction = (() => {
    if (isStreaming) {
      return "Wait for this response to complete, then apply one recommended action before sending the next prompt.";
    }

    if (!messages.length) {
      return "Pick a launchpad playbook below, then send the generated prompt to initialize a structured workflow.";
    }

    if (latestStatusData?.slashCommand === "risk") {
      return "Translate the risk output into explicit position-size and invalidation rules before entering any trade.";
    }

    if (latestStatusData?.slashCommand === "odinsignal" || experienceMode === "odin") {
      return "Execute only the top-priority operator instruction, then feed back outcomes for iterative refinement.";
    }

    if (skillLevel === "beginner") {
      return "Ask for exactly one next step and complete it now; avoid multitasking across multiple strategies.";
    }

    if (skillLevel === "advanced") {
      return "Request scenario probabilities and explicit trigger thresholds before committing capital.";
    }

    return "Convert the current response into a checklist and execute the first two items immediately.";
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
    trackFriction({ multimodalSeeds: 1 });
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
        trackFriction({ generationErrors: 1 });
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
      trackFriction({ generationErrors: 1 });
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
        trackFriction({ generationErrors: 1 });
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
      trackFriction({ generationErrors: 1 });
    } finally {
      setVideoLoading(false);
    }
  };

  const submitCurrentInput = async () => {
    const text = input.trim();
    if (!text || isStreaming) {
      if (!text) {
        trackFriction({ emptySubmitBlocked: 1 });
      }
      return;
    }

    clearError();
    await sendMessage({ text });
    setInput("");
    trackFriction({ sends: 1 });
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    await submitCurrentInput();
  };

  const applyExperienceMode = (mode: ExperienceMode) => {
    setExperienceMode(mode);
    if (mode === "odin") {
      setResponseStyle(ODIN_DEFAULTS.responseStyle);
      setFreedomMode(ODIN_DEFAULTS.freedomMode);
      setPreset(ODIN_DEFAULTS.preset);
      setSloProfile(ODIN_DEFAULTS.sloProfile);
      setObjective((prev) => prev.trim() || ODIN_DEFAULTS.objective);
    } else {
      setResponseStyle(BEGINNER_DEFAULTS.responseStyle);
      setFreedomMode(BEGINNER_DEFAULTS.freedomMode);
      setPreset(BEGINNER_DEFAULTS.preset);
      setSloProfile(BEGINNER_DEFAULTS.sloProfile);
      setObjective((prev) => prev.trim() || BEGINNER_DEFAULTS.objective);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EXPERIENCE_MODE_KEY, mode);
    }
    trackFriction({ odinToggles: 1 });
  };

  const applySkillDefaults = (level: SkillLevel) => {
    setSkillLevel(level);
    if (level === "beginner") {
      setResponseStyle("coach");
      setPreset("navigator_fast");
      setSloProfile("balanced");
      if (experienceMode === "odin") {
        setFreedomMode("uncensored");
      } else {
        setFreedomMode("standard");
      }
      return;
    }

    if (level === "intermediate") {
      setResponseStyle("operator");
      setPreset("analyst_risk");
      setSloProfile("balanced");
      setFreedomMode("standard");
      return;
    }

    setResponseStyle("operator");
    setPreset("deep_research");
    setSloProfile("quality");
    setFreedomMode("uncensored");
  };

  const applyLaunchpadPlaybook = (playbook: LaunchpadPlaybook) => {
    setObjective(playbook.objective);
    setInput(playbook.prompt);
    setResponseStyle(playbook.responseStyle);
    setPreset(playbook.preset);
    setSloProfile(playbook.sloProfile);
    setFreedomMode(playbook.freedomMode);
    setSkillLevel(playbook.recommendedSkill);
    if (playbook.id === "alphaops") {
      applyExperienceMode("odin");
    }
    trackFriction({ playbooksApplied: 1 });
  };

  const launchPlaybookNow = async (playbook: LaunchpadPlaybook) => {
    if (isStreaming) return;
    applyLaunchpadPlaybook(playbook);
    clearError();
    await sendMessage({ text: playbook.prompt });
    setInput("");
    trackFriction({ sends: 1 });
  };

  const applySlashTemplate = (template: string) => {
    setInput(template);
    trackFriction({ slashPrefills: 1 });
  };

  const adaptiveStarterPrompts = useMemo(() => {
    if (experienceMode === "odin") return QUICK_START_PROMPTS.advanced;
    return QUICK_START_PROMPTS[skillLevel];
  }, [experienceMode, skillLevel]);

  const applyAdaptivePrompt = (prompt: string) => {
    setInput(prompt);
    trackFriction({ slashPrefills: 1 });
  };

  const buildTransformPrompt = (mode: ResponseTransformMode, sourceText: string) => {
    const clipped = sourceText.slice(0, 1800);
    if (mode === "checklist") {
      return `Convert this output into an execution checklist with priority tags, time estimates, and one immediate action:\n\n${clipped}`;
    }
    if (mode === "risk") {
      return `/risk Stress-test this output for hidden risks, invalidation levels, and mitigation priorities:\n\n${clipped}`;
    }
    if (mode === "counter") {
      return `Challenge this output with the strongest counter-thesis and specify what evidence would invalidate the current plan:\n\n${clipped}`;
    }
    return `/odinsignal Convert this output into an ODIN operator brief with confidence tiers, triggers, and execution protocol:\n\n${clipped}`;
  };

  const labelForMode = (mode: ResponseTransformMode) => {
    if (mode === "checklist") return "Checklist";
    if (mode === "risk") return "Risk Stress Test";
    if (mode === "counter") return "Counter Thesis";
    return "ODIN Brief";
  };

  const queueMissionTask = (mode: ResponseTransformMode, status: MissionTask["status"]) => {
    const task: MissionTask = {
      id: `${mode}-${Date.now()}`,
      label: labelForMode(mode),
      status,
      mode,
      createdAt: Date.now(),
    };
    setMissionTasks((prev) => [task, ...prev].slice(0, 8));
  };

  const queueResponseTransform = (mode: ResponseTransformMode) => {
    if (!latestAssistantText.trim()) {
      setLocalError("Generate at least one response before using post-response actions.");
      return;
    }

    const nextPrompt = buildTransformPrompt(mode, latestAssistantText);

    setInput(nextPrompt);
    setActiveTab("text");
    setLocalError("");
    queueMissionTask(mode, "queued");
    trackFriction({ slashPrefills: 1 });
  };

  const runResponseTransformNow = async (mode: ResponseTransformMode) => {
    if (isStreaming) return;
    if (!latestAssistantText.trim()) {
      setLocalError("Generate at least one response before running post-response actions.");
      return;
    }
    const nextPrompt = buildTransformPrompt(mode, latestAssistantText);
    setInput(nextPrompt);
    setActiveTab("text");
    setLocalError("");
    clearError();
    await sendMessage({ text: nextPrompt });
    setInput("");
    queueMissionTask(mode, "executed");
    trackFriction({ sends: 1, slashPrefills: 1 });
  };

  const orchestrationHint = useMemo(() => {
    const qualityScore = Math.round(latestStatusData?.quality?.score || 0);
    const confidence = Math.round(latestStatusData?.predictionConfidence || 0);

    if (!messages.length) {
      return "Start with one guided prompt, then use post-response actions to turn output into execution artifacts.";
    }

    if (qualityScore > 0 && qualityScore < 72) {
      return "Quality signal is moderate—consider switching to quality-first profile or running a counter-thesis pass before execution.";
    }

    if (confidence > 0 && confidence < 58) {
      return "Prediction confidence is low—run risk stress test and look for additional confirming context before action.";
    }

    if (experienceMode === "odin") {
      return "ODIN mode active—promote this response into an operator brief and execute highest-impact action first.";
    }

    return "Signal quality is stable—convert this into a checklist and complete the first two actions now.";
  }, [latestStatusData?.predictionConfidence, latestStatusData?.quality?.score, messages.length, experienceMode]);

  const applyQualityBoost = () => {
    setSloProfile("quality");
    setPreset("deep_research");
    setResponseStyle("operator");
    if (experienceMode !== "odin") {
      setFreedomMode("standard");
    }
    setLocalError("");
  };

  const applyRiskGuard = () => {
    setPreset("analyst_risk");
    setSloProfile("balanced");
    setResponseStyle("operator");
    setFreedomMode("standard");
    setLocalError("");
  };

  const recommendationExplanation = useMemo(() => {
    if (!messages.length) {
      return "No prior conversation yet, so launchpad guidance is prioritized to reduce onboarding friction and improve first-success rate.";
    }
    if (latestStatusData?.slashCommand === "risk") {
      return "Risk command detected; recommendation prioritizes capital protection and invalidation discipline over aggressive expansion.";
    }
    if (experienceMode === "odin") {
      return "ODIN mode enabled; recommendation emphasizes operator execution quality, scenario clarity, and feedback-loop refinement.";
    }
    if (skillLevel === "beginner") {
      return "Beginner profile active; recommendation is intentionally simplified to one actionable step to prevent cognitive overload.";
    }
    return "Recommendation is calibrated using current profile, response state, and command context to maximize completion probability.";
  }, [messages.length, latestStatusData?.slashCommand, experienceMode, skillLevel]);

  const frictionSummary = useMemo(() => {
    const failed =
      frictionTelemetry.voiceErrors +
      frictionTelemetry.xContextFailures +
      frictionTelemetry.generationErrors +
      frictionTelemetry.emptySubmitBlocked;
    const productive =
      frictionTelemetry.sends +
      frictionTelemetry.playbooksApplied +
      frictionTelemetry.slashPrefills +
      frictionTelemetry.multimodalSeeds;

    const completionScore = Math.max(0, Math.min(100, Math.round((productive * 10) - (failed * 6) + 40)));
    const health: "excellent" | "good" | "watch" = completionScore >= 85 ? "excellent" : completionScore >= 65 ? "good" : "watch";

    return {
      failed,
      productive,
      completionScore,
      health,
    };
  }, [frictionTelemetry]);

  const developmentGoalStatus = useMemo(
    () => [
      {
        id: "adaptive-onboarding",
        label: "Adaptive onboarding memory",
        ok: true,
      },
      {
        id: "clear-guidance",
        label: "Clear next-action guidance",
        ok: nextBestAction.trim().length > 0,
      },
      {
        id: "cross-skill",
        label: "Cross-skill profile tuning",
        ok: skillLevel === "beginner" || skillLevel === "intermediate" || skillLevel === "advanced",
      },
      {
        id: "friction-health",
        label: "Friction telemetry health",
        ok: frictionSummary.health !== "watch",
      },
    ],
    [nextBestAction, skillLevel, frictionSummary.health],
  );

  if (minimal) {
    return (
      <div className="theme-panel rounded-xl border border-emerald-500/20 bg-emerald-600/10 p-3 sm:p-5">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-widest text-emerald-200/80">Single Window Mode</p>
          <h3 className="text-lg font-bold text-emerald-100">AI Command Window</h3>
          <p className="mt-1 text-xs text-emerald-100/75">One input, one conversation, one next action.</p>
        </div>

        <div className="mb-3 max-h-[45dvh] sm:max-h-[420px] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-300/75">Start with a single objective. Keep prompts short and outcome-focused.</p>
              <div className="flex flex-wrap gap-2">
                {adaptiveStarterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => applyAdaptivePrompt(prompt)}
                    className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-100/90 hover:bg-emerald-500/25"
                  >
                    {prompt.length > 78 ? `${prompt.slice(0, 78)}…` : prompt}
                  </button>
                ))}
              </div>
            </div>
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
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && input.trim() && !isStreaming) {
                  event.preventDefault();
                  void submitCurrentInput();
                }
              }}
              placeholder="Ask anything… (Ctrl/Cmd + Enter to send)"
              rows={3}
              className="flex-1 resize-none rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none placeholder:text-emerald-100/45 min-h-[92px]"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={!voiceSupported}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/20 px-3 py-2 text-sm font-semibold text-fuchsia-100 disabled:opacity-50 min-h-[44px]"
              >
                {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {recording ? "Stop" : "Voice"}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/25 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50 min-h-[44px]"
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

  return (
    <div className="theme-panel rounded-xl border border-emerald-500/20 bg-emerald-600/10 p-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-200/80">Vercel AI SDK (Beta)</p>
          <h3 className="text-lg font-bold text-emerald-100">Streaming Chat Lane</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSetupPanels((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold text-zinc-100"
          >
            {showSetupPanels ? "Hide setup" : "Show setup"}
          </button>
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
      </div>

      {showSetupPanels ? (
      <>
      <div className="mb-3 rounded-lg border border-white/15 bg-black/30 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-white/15 bg-black/35 p-1">
            <button
              type="button"
              onClick={() => applyExperienceMode("beginner")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                experienceMode === "beginner" ? "bg-emerald-500/30 text-emerald-100" : "text-zinc-200/80 hover:bg-white/10"
              }`}
            >
              Beginner Autopilot
            </button>
            <button
              type="button"
              onClick={() => applyExperienceMode("odin")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                experienceMode === "odin" ? "bg-fuchsia-500/30 text-fuchsia-100" : "text-zinc-200/80 hover:bg-white/10"
              }`}
            >
              ODIN Pro
            </button>
          </div>
          <p className="text-[11px] text-zinc-300/80">Shortcut: <span className="font-semibold text-zinc-100">Ctrl+Shift+O</span></p>
        </div>
        <p className="mt-2 text-[11px] text-zinc-300/80">
          {experienceMode === "beginner"
            ? "Autopilot keeps safer defaults, clearer guidance, and lower complexity for new users."
            : "ODIN Pro prioritizes operator-depth reasoning, richer context windows, and power controls."}
        </p>
      </div>

      <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
        <p className="text-[11px] font-semibold text-emerald-100">Skill Profile</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(SKILL_LEVEL_META) as SkillLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => applySkillDefaults(level)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                skillLevel === level
                  ? "border-emerald-300/50 bg-emerald-500/25 text-emerald-100"
                  : "border-white/20 bg-black/30 text-zinc-100/80 hover:bg-black/45"
              }`}
              title={SKILL_LEVEL_META[level].hint}
            >
              {SKILL_LEVEL_META[level].label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-emerald-100/80">{SKILL_LEVEL_META[skillLevel].hint}</p>
      </div>

      <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2.5">
        <p className="text-[11px] font-semibold text-cyan-100">Guided Launchpad</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {LAUNCHPAD_PLAYBOOKS.map((playbook) => (
            <button
              key={playbook.id}
              type="button"
              onClick={() => applyLaunchpadPlaybook(playbook)}
              className="rounded-lg border border-cyan-300/25 bg-black/30 p-2 text-left transition hover:border-cyan-300/45 hover:bg-black/45"
            >
              <p className="text-xs font-semibold text-cyan-100">{playbook.label}</p>
              <p className="mt-1 text-[11px] text-cyan-100/75">{playbook.description}</p>
              <p className="mt-2 text-[10px] text-cyan-100/60">Recommended: {SKILL_LEVEL_META[playbook.recommendedSkill].label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-sky-400/25 bg-sky-500/10 p-2.5">
        <p className="text-[11px] font-semibold text-sky-100">One-Tap Guided Start</p>
        <p className="mt-1 text-[10px] text-sky-100/75">Applies route defaults and sends the first high-quality prompt automatically.</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {LAUNCHPAD_PLAYBOOKS.map((playbook) => (
            <button
              key={`${playbook.id}-instant`}
              type="button"
              onClick={() => {
                void launchPlaybookNow(playbook);
              }}
              disabled={isStreaming}
              className="rounded-lg border border-sky-300/25 bg-black/35 px-2.5 py-2 text-left text-[11px] font-semibold text-sky-100 transition hover:bg-black/50 disabled:opacity-50"
            >
              <span className="block uppercase tracking-[0.18em] text-[10px] text-sky-200/80">{SKILL_LEVEL_META[playbook.recommendedSkill].label}</span>
              <span className="mt-1 block">{playbook.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100/90">
        <p className="font-semibold">Development Goal Status</p>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {developmentGoalStatus.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-[11px]">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.ok ? "bg-emerald-300" : "bg-amber-300"}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Optional objective (e.g. Build a safer 7-day plan)"
          className="rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none placeholder:text-emerald-100/45 md:col-span-2"
        />
      </div>

      </>
      ) : null}

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

      <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2.5">
        <p className="text-[11px] font-semibold text-cyan-100">Slash Commands</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLASH_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.command}
              type="button"
              onClick={() => applySlashTemplate(shortcut.template)}
              className="rounded-full border border-cyan-300/35 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 hover:bg-black/45"
            >
              {shortcut.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-cyan-100/75">Commands: /plan, /risk, /parabolic, /odinsignal</p>
      </div>

      <div className="mb-3 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100/90">
        <p className="font-semibold">Why this recommendation</p>
        <p className="mt-1 text-[11px] opacity-90">{recommendationExplanation}</p>
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
        <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-white/15 bg-black/30 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {latestStatusData?.slashCommand ? (
        <div className="mb-3 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100/90">
          <p className="font-semibold">Command mode active: /{latestStatusData.slashCommand}</p>
          <p className="mt-1 text-[11px] opacity-85">The prompt was routed through the ODIN command template for structured output quality.</p>
        </div>
      ) : null}

      <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
        <p className="font-semibold">Next Best Action</p>
        <p className="mt-1 text-[11px] opacity-90">{nextBestAction}</p>
      </div>

      <div className="mb-3 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100/90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Adaptive Orchestrator</p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={applyQualityBoost}
              className="rounded-full border border-sky-300/40 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-sky-100 hover:bg-black/45"
            >
              Quality Boost
            </button>
            <button
              type="button"
              onClick={applyRiskGuard}
              className="rounded-full border border-amber-300/40 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-100 hover:bg-black/45"
            >
              Risk Guard
            </button>
          </div>
        </div>
        <p className="mt-1 text-[11px] opacity-90">{orchestrationHint}</p>
      </div>

      {latestAssistantText && !isStreaming ? (
        <div className="mb-3 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100/90">
          <p className="font-semibold">Post-Response Actions</p>
          <p className="mt-1 text-[11px] opacity-85">Transform the latest response into decision-ready artifacts in one click.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => queueResponseTransform("checklist")}
              className="rounded-full border border-fuchsia-300/35 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-100 hover:bg-black/45"
            >
              Checklist (prep)
            </button>
            <button
              type="button"
              onClick={() => queueResponseTransform("risk")}
              className="rounded-full border border-amber-300/35 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-amber-100 hover:bg-black/45"
            >
              Risk Stress (prep)
            </button>
            <button
              type="button"
              onClick={() => queueResponseTransform("counter")}
              className="rounded-full border border-cyan-300/35 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 hover:bg-black/45"
            >
              Counter Thesis (prep)
            </button>
            <button
              type="button"
              onClick={() => queueResponseTransform("operator")}
              className="rounded-full border border-emerald-300/35 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 hover:bg-black/45"
            >
              ODIN Brief (prep)
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void runResponseTransformNow("checklist");
              }}
              className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/20 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-100 hover:bg-fuchsia-500/30"
            >
              Run Checklist now
            </button>
            <button
              type="button"
              onClick={() => {
                void runResponseTransformNow("risk");
              }}
              className="rounded-full border border-amber-300/35 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30"
            >
              Run Risk Test now
            </button>
            <button
              type="button"
              onClick={() => {
                void runResponseTransformNow("operator");
              }}
              className="rounded-full border border-emerald-300/35 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/30"
            >
              Run ODIN Brief now
            </button>
          </div>
        </div>
      ) : null}

      {missionTasks.length > 0 ? (
        <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Session Mission Control</p>
            <span className="text-[10px] uppercase tracking-wider text-cyan-100/70">
              {missionTasks.filter((task) => task.status === "executed").length}/{missionTasks.length} executed
            </span>
          </div>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {missionTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded border border-cyan-300/20 bg-black/25 px-2 py-1 text-[11px]">
                <span>{task.label}</span>
                <span className={`uppercase tracking-wider ${task.status === "executed" ? "text-emerald-200" : "text-amber-200"}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100/90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Friction & Completion Insights</p>
          <span className="rounded-full border border-emerald-300/35 bg-black/30 px-2 py-0.5 text-[10px] uppercase">
            {frictionSummary.health} · {frictionSummary.completionScore}
          </span>
        </div>
        <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-4 text-[11px]">
          <span>productive {frictionSummary.productive}</span>
          <span>friction {frictionSummary.failed}</span>
          <span>sends {frictionTelemetry.sends}</span>
          <span>playbooks {frictionTelemetry.playbooksApplied}</span>
          <span>slash prefills {frictionTelemetry.slashPrefills}</span>
          <span>voice errors {frictionTelemetry.voiceErrors}</span>
          <span>x-context issues {frictionTelemetry.xContextFailures}</span>
          <span>gen errors {frictionTelemetry.generationErrors}</span>
        </div>
      </div>

      {activeTab === "text" ? (
        <>
          <div className="mb-3 max-h-[42dvh] sm:max-h-[360px] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300/75">Ask anything to begin streaming chat. Tip: add X context first for richer signal-aware responses.</p>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400/80">Adaptive quick start</p>
                  <div className="flex flex-wrap gap-2">
                    {adaptiveStarterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => applyAdaptivePrompt(prompt)}
                        className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-100/90 hover:bg-emerald-500/25"
                      >
                        {prompt.length > 78 ? `${prompt.slice(0, 78)}…` : prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && input.trim() && !isStreaming) {
                    event.preventDefault();
                    void submitCurrentInput();
                  }
                }}
                placeholder={experienceMode === "beginner" ? "Ask in plain English (or use a slash command button above)..." : "Enter ODIN operator prompt or /command..."}
                rows={3}
                className="flex-1 resize-none rounded-lg border border-emerald-500/30 bg-black/35 px-3 py-2 text-sm text-emerald-100 outline-none placeholder:text-emerald-100/45 min-h-[92px]"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={!voiceSupported}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/20 px-3 py-2 text-sm font-semibold text-fuchsia-100 disabled:opacity-50 min-h-[44px]"
                >
                  {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {recording ? "Stop" : "Voice"}
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/25 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50 min-h-[44px]"
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
