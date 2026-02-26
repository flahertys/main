"use client";

import { WalletButton } from "@/components/counter/WalletButton";
import { HubCapitalPreservationCircuit } from "@/components/landing/hub/HubCapitalPreservationCircuit";
import { HubCommandPalette } from "@/components/landing/hub/HubCommandPalette";
import { HubCompetitiveEdgeLab } from "@/components/landing/hub/HubCompetitiveEdgeLab";
import { HubExecutionLatencyGuard } from "@/components/landing/hub/HubExecutionLatencyGuard";
import { HubImageWorkspace } from "@/components/landing/hub/HubImageWorkspace";
import { HubMarketWorkspace } from "@/components/landing/hub/HubMarketWorkspace";
import { HubMetricsRail } from "@/components/landing/hub/HubMetricsRail";
import { HubPostTradeForensics } from "@/components/landing/hub/HubPostTradeForensics";
import { HubRegimeShiftSentinel } from "@/components/landing/hub/HubRegimeShiftSentinel";
import { HubSessionDriftGovernor } from "@/components/landing/hub/HubSessionDriftGovernor";
import { HubSitewideNeuralSmartness } from "@/components/landing/hub/HubSitewideNeuralSmartness";
import { HubVideoAiInfusion } from "@/components/landing/hub/HubVideoAiInfusion";
import { HubWebsiteSocialAutopilot } from "@/components/landing/hub/HubWebsiteSocialAutopilot";
import {
    exportLocalNeuralVault,
    getLocalNeuralVault,
    saveDatasetArtifact,
    saveLearningEnvironmentArtifact,
    saveTickerBehaviorArtifact,
    saveUserBehaviorArtifact,
} from "@/lib/ai/site-neural-memory";
import { HAX_TOKEN_CONFIG } from "@/lib/trading/hax-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bookmark,
    BookOpen,
    Brain,
    Coins,
    Command,
    Copy,
    Cpu,
    Download,
    Eraser,
    List,
    Lock,
    Pencil,
    RotateCcw,
    RotateCw,
    Send,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    TrendingUp,
    Zap
} from "lucide-react";
import { useEffect, useState } from "react";

type HubTab = "CHAT" | "IMAGE_GEN" | "MARKET";
type ResponseStyle = "concise" | "coach" | "operator";
type RiskStance = "guarded" | "balanced" | "aggressive";
type PersonaPresetId = "mystic" | "analyst" | "mentor";
type MemoryScope = "short" | "long";
type SocialChannel = "youtube" | "discord" | "x" | "linkedin" | "instagram" | "facebook" | "telegram" | "tiktok";
type LlmWorkflowTask = "chat" | "generate" | "summarize" | "qa";
type LlmDepth = "quick" | "balanced" | "deep";
type PromptLibraryCategory = "trading" | "content" | "ops";

interface ResponseQualitySnapshot {
  task: LlmWorkflowTask;
  model: string;
  latencyMs: number;
  words: number;
  chars: number;
  clarity: number;
  actionability: number;
  riskDiscipline: number;
}

interface ResponseCompareSnapshot {
  mode: "improve" | "rewrite" | "shorten";
  original: string;
  transformed: string;
  sourceIndex: number;
  createdAt: number;
}

interface SessionPreset {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

interface WorkspaceSettingsSnapshot {
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

interface WorkspaceSnapshotPayload {
  settings: WorkspaceSettingsSnapshot;
  customPromptPacks: PromptLibraryItem[];
  memoryCards: MemoryCard[];
  sessionPresets: SessionPreset[];
}

interface WorkspaceSnapshot {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  payload: WorkspaceSnapshotPayload;
}

type PromptLibraryItem = {
  id: string;
  title: string;
  category: PromptLibraryCategory;
  value: string;
};

type SlashCommand = {
  id: string;
  label: string;
  description: string;
  execute: () => void;
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MemoryCard {
  id: string;
  scope: MemoryScope;
  title: string;
  content: string;
  updatedAt: number;
  confidence: number;
}

interface BranchTrailEntry {
  id: string;
  kind: "retry" | "edit-retry";
  fromIndex: number;
  preview: string;
  createdAt: number;
}

interface SocialOpsDraft {
  id: string;
  focus: string;
  sourceUrl: string;
  channels: SocialChannel[];
  status: "draft" | "pending_approval" | "approved" | "published";
  scheduledAt?: string;
  performance?: {
    impressions: number;
    engagements: number;
    clicks: number;
  };
  updatedAt: string;
}

interface SocialOpsQueueJob {
  id: string;
  draftId: string;
  channel: SocialChannel;
  runAt: string;
  status: "queued" | "running" | "done" | "failed";
  lastError?: string;
}

interface SocialOpsSnapshot {
  connectors: Partial<Record<SocialChannel, boolean>>;
  drafts: SocialOpsDraft[];
  queue: SocialOpsQueueJob[];
  calendar: Array<{
    draftId: string;
    runAt?: string;
    status: string;
    focus: string;
    channels: SocialChannel[];
    performance?: {
      impressions: number;
      engagements: number;
      clicks: number;
    };
  }>;
}

interface MarketAsset {
  symbol: string;
  pair: string;
  price: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  source: string;
  updatedAt: string;
}

const FREE_USAGE_LIMIT = 3;
const PAYMENT_AMOUNT_SOL = 0.05;
const PAYMENT_AMOUNT_HAX = 100;
const TREASURY_WALLET = "6v6iK8kS1DqXhP9P8s7W6zX5B9Q4p7L3k2j1i0h9g8f7";

const CHAT_MODELS = [
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    label: "🔮 Qwen 2.5 7B",
    hint: "Strong structured output for workflows",
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    label: "⚡ Llama 3.3 70B",
    hint: "Higher-capability reasoning and synthesis",
  },
  {
    id: "microsoft/Phi-4-mini-instruct",
    label: "🧠 Phi-4 mini",
    hint: "Fast low-latency copilot-style responses",
  },
] as const;

const QUICK_RITUAL_PROMPTS = [
  {
    label: "Morning ritual",
    value: "Give me a 2-minute morning market ritual with one high-confidence setup and strict risk controls.",
  },
  {
    label: "Guru checkpoint",
    value: "Act like my calm trading guru and check my plan for risk leaks before I place any trade.",
  },
  {
    label: "Focus reset",
    value: "I feel emotionally noisy. Give me a short reset protocol before I make trading decisions.",
  },
] as const;

const LLM_WORKFLOW_TASKS: Array<{ id: LlmWorkflowTask; label: string; hint: string }> = [
  { id: "chat", label: "Neural Chat", hint: "Full guided assistant with relationship memory + persona controls" },
  { id: "generate", label: "Generate", hint: "High-quality text drafting for ideas, scripts, and content" },
  { id: "summarize", label: "Summarize", hint: "Compress long content into concise, decision-ready outputs" },
  { id: "qa", label: "Q&A", hint: "Answer strictly from provided context to improve factual discipline" },
];

const LLM_WORKFLOW_TEMPLATES: Array<{
  id: "exec" | "thread" | "sop";
  label: string;
  task: LlmWorkflowTask;
  prompt: string;
  context?: string;
}> = [
  {
    id: "exec",
    label: "Exec Brief",
    task: "summarize",
    prompt: "Summarize this into: key signals, risks, opportunities, and one immediate action for today.",
  },
  {
    id: "thread",
    label: "Social Thread",
    task: "generate",
    prompt: "Turn this into a high-converting social thread with hook, value bullets, CTA, and risk-aware language.",
  },
  {
    id: "sop",
    label: "Risk SOP",
    task: "qa",
    prompt: "Create a strict execution SOP with pre-trade checks, invalidation triggers, and post-trade review steps.",
    context: "Use only the context provided here. Do not infer unsupported facts.",
  },
];

const PROMPT_LIBRARY: PromptLibraryItem[] = [
  {
    id: "trade-plan-week",
    title: "Weekly Risk Plan",
    category: "trading",
    value: "Build my weekly trade plan with risk budget, A+ setup filter, and a no-trade checklist.",
  },
  {
    id: "trade-postmortem",
    title: "Trade Postmortem",
    category: "trading",
    value: "Review this trade like a coach: what was valid, what was emotional noise, and what to do next time.",
  },
  {
    id: "content-thread",
    title: "Social Thread Builder",
    category: "content",
    value: "Turn this into a high-converting thread with hook, authority proof, value bullets, and CTA.",
  },
  {
    id: "content-brief",
    title: "Executive Brief",
    category: "content",
    value: "Summarize this into key points, risks, opportunities, and one immediate action.",
  },
  {
    id: "ops-checklist",
    title: "Ops Checklist",
    category: "ops",
    value: "Create an operator checklist for execution: prep, trigger, risk limits, and post-action review.",
  },
  {
    id: "ops-standard",
    title: "SOP Draft",
    category: "ops",
    value: "Draft a concise SOP with prerequisites, step-by-step actions, failure modes, and escalation path.",
  },
];

const PERSONA_PRESETS: Array<{ id: PersonaPresetId; label: string; description: string; prompt: string }> = [
  {
    id: "mystic",
    label: "Mystic Oracle",
    description: "Symbolic, intuitive framing with practical risk steps.",
    prompt: "Speak with mystical clarity while remaining concrete. Blend intuition with practical execution checkpoints.",
  },
  {
    id: "analyst",
    label: "Quant Analyst",
    description: "Structured, data-first, probability-aware guidance.",
    prompt: "Use analytical structure: assumptions, scenarios, confidence ranges, and invalidation points.",
  },
  {
    id: "mentor",
    label: "Calm Mentor",
    description: "Grounded coaching with emotional discipline emphasis.",
    prompt: "Coach with calm discipline. Prioritize emotional regulation and repeatable routines over hype.",
  },
];

const PERSONA_THEME: Record<PersonaPresetId, {
  heroBorder: string;
  heroGradient: string;
  badgeTone: string;
  actionTone: string;
}> = {
  mystic: {
    heroBorder: "border-fuchsia-500/20",
    heroGradient: "bg-[linear-gradient(120deg,rgba(25,10,35,0.55),rgba(8,18,28,0.7))]",
    badgeTone: "text-fuchsia-200",
    actionTone: "border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100",
  },
  analyst: {
    heroBorder: "border-cyan-500/25",
    heroGradient: "bg-[linear-gradient(120deg,rgba(6,20,28,0.6),rgba(10,16,26,0.72))]",
    badgeTone: "text-cyan-200",
    actionTone: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
  },
  mentor: {
    heroBorder: "border-emerald-500/25",
    heroGradient: "bg-[linear-gradient(120deg,rgba(10,24,20,0.58),rgba(12,16,22,0.72))]",
    badgeTone: "text-emerald-200",
    actionTone: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
  },
};

const PERSONA_PROMPT_PACKS: Record<PersonaPresetId, Record<"BULLISH" | "BEARISH" | "MIXED", Array<{ label: string; value: string }>>> = {
  mystic: {
    BULLISH: [
      { label: "Momentum Ritual", value: "Market feels bullish. Give me a mystical-but-practical momentum ritual with entry, invalidation, and position sizing." },
      { label: "Protection Chant", value: "In a bullish tape, how do I protect gains and avoid late-entry FOMO? Give me a short protocol." },
    ],
    BEARISH: [
      { label: "Defensive Spell", value: "Market feels bearish. Build me a defensive plan with lower exposure, strict stops, and clear no-trade rules." },
      { label: "Drawdown Shield", value: "Give me a drawdown shield routine for bearish sessions and emotional discipline under pressure." },
    ],
    MIXED: [
      { label: "Signal Clarity", value: "Regime is mixed. Help me filter noise and focus on A+ setups only with explicit filters." },
      { label: "Patience Protocol", value: "I am in a choppy market. Give me a patience and selectivity protocol to reduce overtrading." },
    ],
  },
  analyst: {
    BULLISH: [
      { label: "Trend Framework", value: "Regime bullish. Build a probability-weighted trend-following framework with risk-adjusted exits." },
      { label: "Position Ladder", value: "Design a scale-in/scale-out ladder for bullish continuation with hard invalidation points." },
    ],
    BEARISH: [
      { label: "Capital Defense", value: "Regime bearish. Create a capital-preservation framework with reduced risk budget and scenario matrix." },
      { label: "Volatility Map", value: "Map bearish volatility scenarios and propose a strict execution checklist." },
    ],
    MIXED: [
      { label: "Range Exploiter", value: "Regime mixed. Build a range-trading playbook with confirmation rules and invalidation triggers." },
      { label: "Noisy Tape Filter", value: "Give me objective criteria to skip low-quality setups in noisy mixed conditions." },
    ],
  },
  mentor: {
    BULLISH: [
      { label: "Calm Upside Plan", value: "Market bullish. Give me a calm, disciplined upside plan that avoids greed and protects psychology." },
      { label: "Win Protection", value: "How do I lock in gains without cutting winners too early? Give me a mentor-style checklist." },
    ],
    BEARISH: [
      { label: "Steady Defense", value: "Market bearish. Coach me through a low-stress defensive routine with strict risk and fewer trades." },
      { label: "Emotional Recovery", value: "Help me recover confidence after losses in bearish conditions with a simple behavioral protocol." },
    ],
    MIXED: [
      { label: "Composure Loop", value: "Market mixed. Give me a composure loop to avoid impulsive entries and maintain consistency." },
      { label: "Consistency Drill", value: "Provide a mentor-style consistency drill for uncertain choppy sessions." },
    ],
  },
};

const SOCIAL_AUTOPILOT_CHANNELS: Array<{ id: SocialChannel; label: string }> = [
  { id: "youtube", label: "YouTube" },
  { id: "discord", label: "Discord" },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "telegram", label: "Telegram" },
  { id: "tiktok", label: "TikTok" },
];

const NeuralBackground = () => (
  <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <pattern id="neural-net" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" className="text-cyan-500/40" />
        <path d="M2 2 L100 2 M2 2 L2 100" stroke="currentColor" strokeWidth="0.1" className="text-cyan-500/10" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#neural-net)" />
      <motion.circle
        initial={{ cx: "10%", cy: "10%" }}
        animate={{
          cx: ["10%", "90%", "10%", "10%"],
          cy: ["10%", "50%", "90%", "10%"]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        r="2" fill="cyan" className="blur-[2px]"
      />
      <motion.circle
        initial={{ cx: "90%", cy: "90%" }}
        animate={{
          cx: ["90%", "10%", "90%", "90%"],
          cy: ["90%", "50%", "10%", "90%"]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        r="1.5" fill="purple" className="blur-[2px]"
      />
    </svg>
  </div>
);

export const AINeuralHub = () => {
  const [activeTab, setActiveTab] = useState<HubTab>("CHAT");
  const [usageCount, setUsageCount] = useState(0);
  const [isCharging, setIsOverLimit] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedChatModel, setSelectedChatModel] = useState<string>(CHAT_MODELS[0].id);
  const [openModeEnabled, setOpenModeEnabled] = useState(true);
  const [guideName, setGuideName] = useState("Trader");
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("coach");
  const [riskStance, setRiskStance] = useState<RiskStance>("balanced");
  const [focusSymbol, setFocusSymbol] = useState("SOL");
  const [sessionIntent, setSessionIntent] = useState("Build disciplined consistency");
  const [personaPreset, setPersonaPreset] = useState<PersonaPresetId>("mystic");
  const [videoSourceUrl, setVideoSourceUrl] = useState("");
  const [videoInstructionGoal, setVideoInstructionGoal] = useState("Extract actionable steps from this video");
  const [videoCue, setVideoCue] = useState("");
  const [websiteSourceUrl, setWebsiteSourceUrl] = useState("");
  const [autopilotFocus, setAutopilotFocus] = useState("cross-platform brand growth");
  const [autopilotChannels, setAutopilotChannels] = useState<SocialChannel[]>(["youtube", "discord", "x", "linkedin"]);
  const [isGeneratingAutopilot, setIsGeneratingAutopilot] = useState(false);
  const [latestAutopilotDraft, setLatestAutopilotDraft] = useState<Record<string, unknown> | null>(null);
  const [autopilotOpsDraftId, setAutopilotOpsDraftId] = useState("");
  const [autopilotScheduleAt, setAutopilotScheduleAt] = useState("");
  const [autopilotImpressions, setAutopilotImpressions] = useState("0");
  const [autopilotEngagements, setAutopilotEngagements] = useState("0");
  const [autopilotClicks, setAutopilotClicks] = useState("0");
  const [autopilotOpsLoading, setAutopilotOpsLoading] = useState(false);
  const [autopilotOpsSnapshot, setAutopilotOpsSnapshot] = useState<SocialOpsSnapshot | null>(null);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [branchTrail, setBranchTrail] = useState<BranchTrailEntry[]>([]);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryTitle, setEditingMemoryTitle] = useState("");
  const [editingMemoryContent, setEditingMemoryContent] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingMessageDraft, setEditingMessageDraft] = useState("");
  const [replayCursor, setReplayCursor] = useState(0);
  const [timeTick, setTimeTick] = useState(Date.now());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandSelectionIndex, setCommandSelectionIndex] = useState(0);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [customPromptPacks, setCustomPromptPacks] = useState<PromptLibraryItem[]>([]);
  const [customPromptTitle, setCustomPromptTitle] = useState("");
  const [customPromptValue, setCustomPromptValue] = useState("");
  const [customPromptCategory, setCustomPromptCategory] = useState<PromptLibraryCategory>("ops");
  const [compareSnapshot, setCompareSnapshot] = useState<ResponseCompareSnapshot | null>(null);
  const [sessionPresets, setSessionPresets] = useState<SessionPreset[]>([]);
  const [sessionPresetName, setSessionPresetName] = useState("");
  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [workspaceSnapshotName, setWorkspaceSnapshotName] = useState("");
  const [selectedWorkspaceSnapshotId, setSelectedWorkspaceSnapshotId] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState("tradehax-session-dataset");
  const [datasetRows, setDatasetRows] = useState("120");
  const [datasetNotes, setDatasetNotes] = useState("");
  const [behaviorLabel, setBehaviorLabel] = useState("early-session confidence pattern");
  const [behaviorObservation, setBehaviorObservation] = useState("");
  const [tickerBehaviorSymbol, setTickerBehaviorSymbol] = useState("SOL");
  const [tickerBehaviorPattern, setTickerBehaviorPattern] = useState("");
  const [learningEnvironmentName, setLearningEnvironmentName] = useState("macro event drill");
  const [learningEnvironmentHypothesis, setLearningEnvironmentHypothesis] = useState("");
  const [neuralVaultCount, setNeuralVaultCount] = useState(0);
  const { connected, publicKey, sendTransaction } = useWallet();

  // Usage Tracking
  useEffect(() => {
    const stored = localStorage.getItem("tradehax_ai_usage");
    if (stored) {
      const count = parseInt(stored);
      setUsageCount(count);
      if (count >= FREE_USAGE_LIMIT) setIsOverLimit(true);
    }

    const storedModel = localStorage.getItem("tradehax_ai_chat_model");
    if (storedModel && CHAT_MODELS.some((model) => model.id === storedModel)) {
      setSelectedChatModel(storedModel);
    }

    const storedGuideName = localStorage.getItem("tradehax_ai_guide_name");
    if (storedGuideName && storedGuideName.trim()) {
      setGuideName(storedGuideName.trim().slice(0, 24));
    }

    const storedStyle = localStorage.getItem("tradehax_ai_response_style");
    if (storedStyle === "concise" || storedStyle === "coach" || storedStyle === "operator") {
      setResponseStyle(storedStyle);
    }

    const storedRisk = localStorage.getItem("tradehax_ai_risk_stance");
    if (storedRisk === "guarded" || storedRisk === "balanced" || storedRisk === "aggressive") {
      setRiskStance(storedRisk);
    }

    const storedFocusSymbol = localStorage.getItem("tradehax_ai_focus_symbol");
    if (storedFocusSymbol && storedFocusSymbol.trim()) {
      setFocusSymbol(storedFocusSymbol.trim().slice(0, 12).toUpperCase());
    }

    const storedIntent = localStorage.getItem("tradehax_ai_session_intent");
    if (storedIntent && storedIntent.trim()) {
      setSessionIntent(storedIntent.trim().slice(0, 72));
    }

    const storedPersona = localStorage.getItem("tradehax_ai_persona_preset");
    if (storedPersona === "mystic" || storedPersona === "analyst" || storedPersona === "mentor") {
      setPersonaPreset(storedPersona);
    }

    const storedPromptLibrary = localStorage.getItem("tradehax_ai_prompt_library_open");
    if (storedPromptLibrary === "true") {
      setIsPromptLibraryOpen(true);
    }

    const storedCustomPrompts = localStorage.getItem("tradehax_ai_custom_prompt_packs");
    if (storedCustomPrompts) {
      try {
        const parsed = JSON.parse(storedCustomPrompts) as Array<Partial<PromptLibraryItem>>;
        if (Array.isArray(parsed)) {
          setCustomPromptPacks(
            parsed
              .slice(0, 24)
              .map((item) => ({
                id: typeof item.id === "string" ? item.id : `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                title: String(item.title ?? "Custom Prompt").slice(0, 40),
                category: item.category === "trading" || item.category === "content" || item.category === "ops" ? item.category : "ops",
                value: String(item.value ?? "").slice(0, 500),
              }))
              .filter((item) => item.value.trim().length > 0),
          );
        }
      } catch {
        // ignore malformed prompt pack payload
      }
    }

    const storedSessionPresets = localStorage.getItem("tradehax_ai_session_presets");
    if (storedSessionPresets) {
      try {
        const parsed = JSON.parse(storedSessionPresets) as Array<Partial<SessionPreset>>;
        if (Array.isArray(parsed)) {
          setSessionPresets(
            parsed
              .slice(0, 20)
              .map((preset) => ({
                id: typeof preset.id === "string" ? preset.id : `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: String(preset.name ?? "Session Preset").slice(0, 42),
                createdAt: typeof preset.createdAt === "number" ? preset.createdAt : Date.now(),
                updatedAt: typeof preset.updatedAt === "number" ? preset.updatedAt : Date.now(),
                guideName: String(preset.guideName ?? "Trader").slice(0, 24),
                responseStyle: preset.responseStyle === "concise" || preset.responseStyle === "coach" || preset.responseStyle === "operator"
                  ? preset.responseStyle
                  : "coach",
                riskStance: preset.riskStance === "guarded" || preset.riskStance === "balanced" || preset.riskStance === "aggressive"
                  ? preset.riskStance
                  : "balanced",
                focusSymbol: String(preset.focusSymbol ?? "SOL").slice(0, 12),
                sessionIntent: String(preset.sessionIntent ?? "Build disciplined consistency").slice(0, 72),
                personaPreset: preset.personaPreset === "mystic" || preset.personaPreset === "analyst" || preset.personaPreset === "mentor"
                  ? preset.personaPreset
                  : "mystic",
                workflowTask: preset.workflowTask === "chat" || preset.workflowTask === "generate" || preset.workflowTask === "summarize" || preset.workflowTask === "qa"
                  ? preset.workflowTask
                  : "chat",
                workflowDepth: preset.workflowDepth === "quick" || preset.workflowDepth === "balanced" || preset.workflowDepth === "deep"
                  ? preset.workflowDepth
                  : "balanced",
                workflowCreativity:
                  typeof preset.workflowCreativity === "number"
                    ? Math.max(20, Math.min(100, Math.round(preset.workflowCreativity)))
                    : 65,
              }))
              .sort((a, b) => b.updatedAt - a.updatedAt),
          );
        }
      } catch {
        // ignore malformed preset payload
      }
    }

    const storedWorkspaceSnapshots = localStorage.getItem("tradehax_ai_workspace_timeline");
    if (storedWorkspaceSnapshots) {
      try {
        const parsed = JSON.parse(storedWorkspaceSnapshots) as Array<Partial<WorkspaceSnapshot>>;
        if (Array.isArray(parsed)) {
          const hydrated = parsed
            .slice(0, 16)
            .filter((item) =>
              Boolean(item)
              && typeof item.id === "string"
              && typeof item.name === "string"
              && typeof item.version === "number"
              && typeof item.createdAt === "number"
              && typeof item.payload === "object"
              && item.payload !== null,
            )
            .map((item) => item as WorkspaceSnapshot)
            .sort((a, b) => b.createdAt - a.createdAt);
          setWorkspaceSnapshots(hydrated);
          if (hydrated[0]?.id) {
            setSelectedWorkspaceSnapshotId(hydrated[0].id);
          }
        }
      } catch {
        // ignore malformed timeline payload
      }
    }

    const storedDatasetName = localStorage.getItem("tradehax_ai_dataset_name");
    if (storedDatasetName && storedDatasetName.trim()) {
      setDatasetName(storedDatasetName.trim().slice(0, 80));
    }

    const storedDatasetRows = localStorage.getItem("tradehax_ai_dataset_rows");
    if (storedDatasetRows && /^\d{1,6}$/.test(storedDatasetRows)) {
      setDatasetRows(storedDatasetRows);
    }

    const storedDatasetNotes = localStorage.getItem("tradehax_ai_dataset_notes");
    if (storedDatasetNotes && storedDatasetNotes.trim()) {
      setDatasetNotes(storedDatasetNotes.trim().slice(0, 220));
    }

    const storedBehaviorLabel = localStorage.getItem("tradehax_ai_behavior_label");
    if (storedBehaviorLabel && storedBehaviorLabel.trim()) {
      setBehaviorLabel(storedBehaviorLabel.trim().slice(0, 100));
    }

    const storedBehaviorObservation = localStorage.getItem("tradehax_ai_behavior_observation");
    if (storedBehaviorObservation && storedBehaviorObservation.trim()) {
      setBehaviorObservation(storedBehaviorObservation.trim().slice(0, 240));
    }

    const storedTickerBehaviorSymbol = localStorage.getItem("tradehax_ai_ticker_behavior_symbol");
    if (storedTickerBehaviorSymbol && storedTickerBehaviorSymbol.trim()) {
      setTickerBehaviorSymbol(storedTickerBehaviorSymbol.trim().slice(0, 20).toUpperCase());
    }

    const storedTickerBehaviorPattern = localStorage.getItem("tradehax_ai_ticker_behavior_pattern");
    if (storedTickerBehaviorPattern && storedTickerBehaviorPattern.trim()) {
      setTickerBehaviorPattern(storedTickerBehaviorPattern.trim().slice(0, 240));
    }

    const storedLearningEnvironmentName = localStorage.getItem("tradehax_ai_learning_environment_name");
    if (storedLearningEnvironmentName && storedLearningEnvironmentName.trim()) {
      setLearningEnvironmentName(storedLearningEnvironmentName.trim().slice(0, 120));
    }

    const storedLearningEnvironmentHypothesis = localStorage.getItem("tradehax_ai_learning_environment_hypothesis");
    if (storedLearningEnvironmentHypothesis && storedLearningEnvironmentHypothesis.trim()) {
      setLearningEnvironmentHypothesis(storedLearningEnvironmentHypothesis.trim().slice(0, 260));
    }

    setNeuralVaultCount(getLocalNeuralVault().length);

    const storedVideoUrl = localStorage.getItem("tradehax_ai_video_source_url");
    if (storedVideoUrl && storedVideoUrl.trim()) {
      setVideoSourceUrl(storedVideoUrl.trim().slice(0, 300));
    }

    const storedVideoGoal = localStorage.getItem("tradehax_ai_video_instruction_goal");
    if (storedVideoGoal && storedVideoGoal.trim()) {
      setVideoInstructionGoal(storedVideoGoal.trim().slice(0, 140));
    }

    const storedVideoCue = localStorage.getItem("tradehax_ai_video_cue");
    if (storedVideoCue && storedVideoCue.trim()) {
      setVideoCue(storedVideoCue.trim().slice(0, 140));
    }

    const storedWebsiteSourceUrl = localStorage.getItem("tradehax_ai_website_source_url");
    if (storedWebsiteSourceUrl && storedWebsiteSourceUrl.trim()) {
      setWebsiteSourceUrl(storedWebsiteSourceUrl.trim().slice(0, 300));
    }

    const storedAutopilotFocus = localStorage.getItem("tradehax_ai_autopilot_focus");
    if (storedAutopilotFocus && storedAutopilotFocus.trim()) {
      setAutopilotFocus(storedAutopilotFocus.trim().slice(0, 80));
    }

    const storedChannels = localStorage.getItem("tradehax_ai_autopilot_channels");
    if (storedChannels) {
      try {
        const parsed = JSON.parse(storedChannels) as string[];
        const valid = Array.isArray(parsed)
          ? parsed
              .map((item) => String(item).toLowerCase())
              .filter((item): item is SocialChannel =>
                SOCIAL_AUTOPILOT_CHANNELS.some((channel) => channel.id === item),
              )
          : [];
        if (valid.length > 0) {
          setAutopilotChannels(Array.from(new Set(valid)).slice(0, 8));
        }
      } catch {
        // ignore malformed storage payload
      }
    }

    const storedOpsDraftId = localStorage.getItem("tradehax_ai_autopilot_ops_draft_id");
    if (storedOpsDraftId && storedOpsDraftId.trim()) {
      setAutopilotOpsDraftId(storedOpsDraftId.trim().slice(0, 80));
    }

    const storedScheduleAt = localStorage.getItem("tradehax_ai_autopilot_schedule_at");
    if (storedScheduleAt && storedScheduleAt.trim()) {
      setAutopilotScheduleAt(storedScheduleAt.trim().slice(0, 40));
    }

    const storedImpressions = localStorage.getItem("tradehax_ai_autopilot_impressions");
    if (storedImpressions && /^\d{1,9}$/.test(storedImpressions)) {
      setAutopilotImpressions(storedImpressions);
    }

    const storedEngagements = localStorage.getItem("tradehax_ai_autopilot_engagements");
    if (storedEngagements && /^\d{1,9}$/.test(storedEngagements)) {
      setAutopilotEngagements(storedEngagements);
    }

    const storedClicks = localStorage.getItem("tradehax_ai_autopilot_clicks");
    if (storedClicks && /^\d{1,9}$/.test(storedClicks)) {
      setAutopilotClicks(storedClicks);
    }

    const storedCards = localStorage.getItem("tradehax_ai_memory_cards");
    if (storedCards) {
      try {
        const parsed = JSON.parse(storedCards) as Array<Partial<MemoryCard>>;
        if (Array.isArray(parsed)) {
          setMemoryCards(
            parsed
              .slice(0, 12)
              .map<MemoryCard>((card) => ({
                id: typeof card.id === "string" ? card.id : `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                scope: card.scope === "long" ? "long" : "short",
                title: String(card.title ?? "Memory").slice(0, 40),
                content: String(card.content ?? "").slice(0, 160),
                updatedAt: typeof card.updatedAt === "number" ? card.updatedAt : Date.now(),
                confidence: typeof card.confidence === "number" ? Math.min(100, Math.max(1, card.confidence)) : 70,
              }))
              .filter((card) => card.content.trim().length > 0),
          );
        }
      } catch {
        // ignore malformed local storage payload
      }
    }

    const storedBranches = localStorage.getItem("tradehax_ai_branch_trail");
    if (storedBranches) {
      try {
        const parsed = JSON.parse(storedBranches) as BranchTrailEntry[];
        if (Array.isArray(parsed)) {
          setBranchTrail(parsed.slice(0, 18));
        }
      } catch {
        // ignore malformed local storage payload
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_chat_model", selectedChatModel);
  }, [selectedChatModel]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_guide_name", guideName.trim() || "Trader");
  }, [guideName]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_response_style", responseStyle);
  }, [responseStyle]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_risk_stance", riskStance);
  }, [riskStance]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_focus_symbol", focusSymbol);
  }, [focusSymbol]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_session_intent", sessionIntent);
  }, [sessionIntent]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_persona_preset", personaPreset);
  }, [personaPreset]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_prompt_library_open", String(isPromptLibraryOpen));
  }, [isPromptLibraryOpen]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_custom_prompt_packs", JSON.stringify(customPromptPacks.slice(0, 24)));
  }, [customPromptPacks]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_session_presets", JSON.stringify(sessionPresets.slice(0, 20)));
  }, [sessionPresets]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_workspace_timeline", JSON.stringify(workspaceSnapshots.slice(0, 16)));
  }, [workspaceSnapshots]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_dataset_name", datasetName.slice(0, 80));
  }, [datasetName]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_dataset_rows", datasetRows.replace(/\D/g, "").slice(0, 6) || "0");
  }, [datasetRows]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_dataset_notes", datasetNotes.slice(0, 220));
  }, [datasetNotes]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_behavior_label", behaviorLabel.slice(0, 100));
  }, [behaviorLabel]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_behavior_observation", behaviorObservation.slice(0, 240));
  }, [behaviorObservation]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_ticker_behavior_symbol", tickerBehaviorSymbol.slice(0, 20).toUpperCase());
  }, [tickerBehaviorSymbol]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_ticker_behavior_pattern", tickerBehaviorPattern.slice(0, 240));
  }, [tickerBehaviorPattern]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_learning_environment_name", learningEnvironmentName.slice(0, 120));
  }, [learningEnvironmentName]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_learning_environment_hypothesis", learningEnvironmentHypothesis.slice(0, 260));
  }, [learningEnvironmentHypothesis]);

  useEffect(() => {
    setCommandSelectionIndex(0);
  }, [commandQuery, isCommandPaletteOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMetaCommand = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isMetaCommand) {
        event.preventDefault();
        setActiveTab("CHAT");
        setIsCommandPaletteOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_video_source_url", videoSourceUrl);
  }, [videoSourceUrl]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_video_instruction_goal", videoInstructionGoal);
  }, [videoInstructionGoal]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_video_cue", videoCue);
  }, [videoCue]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_website_source_url", websiteSourceUrl);
  }, [websiteSourceUrl]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_focus", autopilotFocus);
  }, [autopilotFocus]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_channels", JSON.stringify(autopilotChannels));
  }, [autopilotChannels]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_ops_draft_id", autopilotOpsDraftId);
  }, [autopilotOpsDraftId]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_schedule_at", autopilotScheduleAt);
  }, [autopilotScheduleAt]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_impressions", autopilotImpressions.replace(/\D/g, "").slice(0, 9) || "0");
  }, [autopilotImpressions]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_engagements", autopilotEngagements.replace(/\D/g, "").slice(0, 9) || "0");
  }, [autopilotEngagements]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_autopilot_clicks", autopilotClicks.replace(/\D/g, "").slice(0, 9) || "0");
  }, [autopilotClicks]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_memory_cards", JSON.stringify(memoryCards.slice(0, 12)));
  }, [memoryCards]);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_branch_trail", JSON.stringify(branchTrail.slice(0, 18)));
  }, [branchTrail]);

  useEffect(() => {
    setReplayCursor((prev) => Math.min(prev, Math.max(0, branchTrail.length - 1)));
  }, [branchTrail]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const incrementUsage = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem("tradehax_ai_usage", newCount.toString());
    if (newCount >= FREE_USAGE_LIMIT) setIsOverLimit(true);
  };

  const handlePayment = async () => {
    if (!connected || !publicKey) return;
    setIsPaying(true);
    try {
      // Logic for actual SOL transfer would go here
      // For now we mock success after a delay to show UI flow
      await new Promise(r => setTimeout(r, 2000));

      localStorage.setItem("tradehax_ai_usage", "0");
      setUsageCount(0);
      setIsOverLimit(false);
      // In a real app, you'd verify the transaction on-chain
    } catch (err) {
      console.error("Payment failed", err);
    } finally {
      setIsPaying(false);
    }
  };

  // --- CHAT LOGIC ---
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Neural link established. How can I help with trading, build, or creative tasks today?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<string>("");
  const [workflowTask, setWorkflowTask] = useState<LlmWorkflowTask>("chat");
  const [workflowDepth, setWorkflowDepth] = useState<LlmDepth>("balanced");
  const [workflowCreativity, setWorkflowCreativity] = useState(65);
  const [workflowContext, setWorkflowContext] = useState("");
  const [qualitySnapshot, setQualitySnapshot] = useState<ResponseQualitySnapshot | null>(null);
  const [watchlist, setWatchlist] = useState<MarketAsset[]>([]);
  const [marketStatus, setMarketStatus] = useState<string>("Connecting to live market feed...");
  const [marketFeedUpdatedAt, setMarketFeedUpdatedAt] = useState<string>("");
  const [marketTransport, setMarketTransport] = useState<"sse" | "polling" | "offline">("offline");

  const relationshipScore = Math.min(100, 18 + usageCount * 20 + Math.min(messages.length, 12) * 4);
  const relationshipTier = relationshipScore >= 85
    ? "INNER_CIRCLE"
    : relationshipScore >= 60
      ? "TRUSTED_DISCIPLE"
      : relationshipScore >= 35
        ? "GUIDED_EXPLORER"
        : "NEW_SEEKER";

  const secureSessionLabel = connected ? "Wallet-signed secure session" : "Anon sandbox session (privacy-first)";
  const modeLabel = openModeEnabled ? "Mystic Open Mode" : "Guardian Standard Mode";
  const selectedPersona = PERSONA_PRESETS.find((preset) => preset.id === personaPreset) || PERSONA_PRESETS[0];
  const selectedTheme = PERSONA_THEME[personaPreset];
  const shortMemoryCards = memoryCards.filter((card) => card.scope === "short").slice(0, 4);
  const longMemoryCards = memoryCards.filter((card) => card.scope === "long").slice(0, 4);

  useEffect(() => {
    let disposed = false;
    let eventSource: EventSource | null = null;
    let fallbackIntervalId: number | null = null;
    let fallbackStarted = false;

    const hydrateItems = (payload: { items?: unknown; generatedAt?: unknown; source?: unknown }) => {
      if (!Array.isArray(payload.items)) return;

      const items = payload.items
        .map((item: Partial<MarketAsset>) => {
          const trend: MarketAsset["trend"] = item.trend === "down" || item.trend === "flat" ? item.trend : "up";
          return {
            symbol: String(item.symbol || ""),
            pair: String(item.pair || ""),
            price: Number(item.price),
            changePercent: Number(item.changePercent),
            trend,
            source: String(item.source || "Binance 24h ticker"),
            updatedAt: String(item.updatedAt || new Date().toISOString()),
          };
        })
        .filter(
          (item: MarketAsset) =>
            item.symbol.length > 0
            && Number.isFinite(item.price)
            && Number.isFinite(item.changePercent),
        );

      if (items.length > 0 && !disposed) {
        setWatchlist(items);
        setMarketFeedUpdatedAt(String(payload.generatedAt || new Date().toISOString()));
        return items.length;
      }

      return 0;
    };

    const loadLiveMarketHttp = async () => {
      try {
        const response = await fetch("/api/ai/market?symbols=SOLUSDT,BTCUSDT,ETHUSDT", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.items)) {
          throw new Error(typeof payload?.error === "string" ? payload.error : "live_market_feed_unavailable");
        }

        const count = hydrateItems(payload);
        if (count > 0 && !disposed) {
          setMarketTransport("polling");
          setMarketStatus(`Live feed (HTTP): ${String(payload.source || "market provider")} • ${count} assets`);
        }
      } catch (error) {
        if (disposed) return;
        setMarketTransport("offline");
        setMarketStatus(
          error instanceof Error
            ? `Live feed unavailable (${error.message}). Retrying...`
            : "Live feed unavailable. Retrying...",
        );
      }
    };

    const startHttpFallback = () => {
      if (fallbackStarted || disposed) return;
      fallbackStarted = true;
      setMarketStatus("Stream interrupted. Switching to HTTP fallback...");
      void loadLiveMarketHttp();
      fallbackIntervalId = window.setInterval(loadLiveMarketHttp, 10000);
    };

    if (typeof window !== "undefined" && "EventSource" in window) {
      eventSource = new EventSource("/api/ai/market/stream?symbols=SOLUSDT,BTCUSDT,ETHUSDT&intervalMs=5000");

      eventSource.addEventListener("ready", (event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as { source?: unknown };
          setMarketTransport("sse");
          setMarketStatus(`Live feed (stream): ${String(payload.source || "market provider")}`);
        } catch {
          setMarketTransport("sse");
          setMarketStatus("Live feed (stream): connected");
        }
      });

      eventSource.addEventListener("market", (event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as {
            items?: unknown;
            generatedAt?: unknown;
            source?: unknown;
          };
          const count = hydrateItems(payload);
          if (count > 0) {
            setMarketTransport("sse");
            setMarketStatus(`Live feed (stream): ${String(payload.source || "market provider")} • ${count} assets`);
          }
        } catch {
          // ignore malformed stream packet
        }
      });

      eventSource.addEventListener("error", () => {
        if (disposed) return;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startHttpFallback();
      });
    } else {
      startHttpFallback();
    }

    return () => {
      disposed = true;
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackIntervalId !== null) {
        window.clearInterval(fallbackIntervalId);
      }
    };
  }, []);

  function normalizeGuideName(value: string) {
    const cleaned = value.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
    return cleaned.slice(0, 24);
  }

  function normalizeSymbol(value: string) {
    const cleaned = value.replace(/[^a-zA-Z0-9/._-]/g, "").trim().toUpperCase();
    return cleaned.slice(0, 12);
  }

  function normalizeVideoUrl(value: string) {
    const cleaned = value.trim().slice(0, 300);
    if (!cleaned) return "";
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    return `https://${cleaned}`;
  }

  function toggleAutopilotChannel(channelId: SocialChannel) {
    setAutopilotChannels((prev) => {
      if (prev.includes(channelId)) {
        const next = prev.filter((item) => item !== channelId);
        return next.length > 0 ? next : prev;
      }
      return [...prev, channelId].slice(0, 8);
    });
  }

  function buildAutopilotDraftBlock(draft: unknown) {
    if (!draft || typeof draft !== "object") return "";
    const draftObj = draft as Record<string, unknown>;
    const channels = (draftObj.channels as Record<string, unknown>) || {};

    const lines: string[] = [
      "WEBSITE_SOCIAL_AUTOPILOT_DRAFT",
      `SOURCE_URL: ${String(draftObj.sourceUrl || "N/A")}`,
      `FOCUS: ${String(draftObj.focus || "N/A")}`,
      "",
    ];

    for (const [channelName, channelValue] of Object.entries(channels)) {
      lines.push(`[${channelName.toUpperCase()}]`);
      if (channelValue && typeof channelValue === "object") {
        for (const [k, v] of Object.entries(channelValue as Record<string, unknown>)) {
          if (Array.isArray(v)) {
            lines.push(`${k}: ${v.map((item) => String(item)).join(" | ")}`);
          } else {
            lines.push(`${k}: ${String(v)}`);
          }
        }
      } else {
        lines.push(String(channelValue));
      }
      lines.push("");
    }

    return lines.join("\n").trim();
  }

  function buildVideoInstructionBrief() {
    const safeUrl = normalizeVideoUrl(videoSourceUrl);
    const safeGoal = videoInstructionGoal.trim() || "Extract actionable steps from this video";
    const safeCue = videoCue.trim();

    const lines = [
      "VIDEO_AI_INFUSION_BRIEF",
      `SOURCE_URL: ${safeUrl || "N/A"}`,
      `PRIMARY_OBJECTIVE: ${safeGoal}`,
      safeCue ? `FOCUS_CUE: ${safeCue}` : "FOCUS_CUE: Not provided",
      "TASK: Summarize key points, convert into step-by-step instructions, and provide a practical execution checklist with risk controls.",
    ];

    return lines.join("\n");
  }

  function getDecayedConfidence(card: MemoryCard) {
    const elapsedMinutes = Math.max(0, (timeTick - card.updatedAt) / 60000);
    const decayRatePerHour = card.scope === "long" ? 0.8 : 2.1;
    const decayed = card.confidence - (elapsedMinutes / 60) * decayRatePerHour;
    return Math.max(5, Math.min(100, Math.round(decayed)));
  }

  function buildPremierSystemPrompt() {
    const styleInstruction =
      responseStyle === "concise"
        ? "Keep replies tight and tactical: key points, explicit constraints, one next action."
        : responseStyle === "operator"
          ? "Respond like a desk operator: structured execution protocol, scenario checks, and hard risk boundaries."
          : "Respond like a trusted coach: clear rationale, confidence-building guidance, and concise checklist steps.";

    const riskInstruction =
      riskStance === "guarded"
        ? "Prefer defensive posture, lower exposure, strict invalidation, and avoid speculative overreach."
        : riskStance === "aggressive"
          ? "Allow assertive setups but still enforce stop logic, position caps, and no guaranteed returns."
          : "Balance opportunity with risk discipline and explicit invalidation triggers.";

    const memoryContext = [
      ...longMemoryCards.slice(0, 3).map((card) => `Pinned memory: ${card.title} => ${card.content}`),
      ...shortMemoryCards.slice(0, 2).map((card) => `Session memory: ${card.title} => ${card.content}`),
    ].join(" ");

    const videoContext = videoSourceUrl.trim()
      ? `Video context URL: ${normalizeVideoUrl(videoSourceUrl)}. Video objective: ${videoInstructionGoal || "Extract actionable steps"}. ${videoCue.trim() ? `Video cue: ${videoCue.trim()}.` : ""}`
      : "";

    return [
      `You are ${guideName}, the user's mystical-but-practical neural guide for TradeHax.`,
      `Persona: ${selectedPersona.label}. ${selectedPersona.prompt}`,
      "Build long-term trust: remember user preference cues from this session and keep tone calm, secure, and empowering.",
      styleInstruction,
      riskInstruction,
      `Session focus symbol: ${focusSymbol || "SOL"}.`,
      `Session intention: ${sessionIntent || "Build disciplined consistency"}.`,
      `Detected market regime: ${detectedMarketRegime}.`,
      videoContext,
      memoryContext,
      "Never promise returns. Always include risk controls, invalidation logic, and one concrete next step.",
      openModeEnabled
        ? "Mode: Mystic Open. Be direct and creative while preserving safety and privacy."
        : "Mode: Guardian Standard. Be conservative, compliance-friendly, and explicit about uncertainty.",
    ].join(" ");
  }

  function getMaxTokensForDepth(depth: LlmDepth) {
    if (depth === "quick") return 320;
    if (depth === "deep") return 1100;
    return 700;
  }

  function scoreResponseQuality(text: string, task: LlmWorkflowTask) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text
      .split(/[.!?]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
    const bullets = (text.match(/(^|\n)\s*[-•\d]+[.)-]?\s+/g) || []).length;
    const hasRiskLanguage = /(risk|stop|invalidation|drawdown|position size|exposure)/i.test(text);
    const hasNextStep = /(next step|immediate action|do this now|first step|checklist)/i.test(text);

    const clarity = Math.max(35, Math.min(100, Math.round(100 - Math.abs(16 - avgWordsPerSentence) * 2.8)));
    const actionability = Math.max(30, Math.min(100, Math.round(40 + bullets * 14 + (hasNextStep ? 16 : 0))));
    const riskDiscipline = Math.max(28, Math.min(100, Math.round(45 + (hasRiskLanguage ? 32 : 0) + (task === "qa" ? 10 : 0))));

    return {
      words: words.length,
      chars: text.length,
      clarity,
      actionability,
      riskDiscipline,
    };
  }

  function applyWorkflowTemplate(templateId: "exec" | "thread" | "sop") {
    const template = LLM_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setWorkflowTask(template.task);
    setChatInput((prev) => `${template.prompt}\n\n${prev.trim()}`.trim().slice(0, 1800));
    if (template.context) {
      setWorkflowContext(template.context);
    }
    setChatStatus(`${template.label} template loaded.`);
  }

  function buildQaContext() {
    const memoryContext = [...longMemoryCards, ...shortMemoryCards]
      .slice(0, 6)
      .map((card) => `${card.title}: ${card.content}`)
      .join("\n");

    return [
      workflowContext.trim(),
      `Guide profile: ${guideName} • ${selectedPersona.label}`,
      `Session intent: ${sessionIntent}`,
      memoryContext,
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 8000);
  }

  function injectPrompt(prompt: string) {
    setActiveTab("CHAT");
    setChatInput((prev) => `${prompt}\n\n${prev.trim()}`.trim().slice(0, 2500));
  }

  function addPromptLibraryItem(item: PromptLibraryItem) {
    injectPrompt(item.value);
    setIsPromptLibraryOpen(false);
    setChatStatus(`Loaded prompt: ${item.title}`);
  }

  function createCustomPromptPack() {
    const title = customPromptTitle.trim().slice(0, 40);
    const value = customPromptValue.trim().slice(0, 500);
    if (!title || !value) {
      setChatStatus("Custom prompt title and content are required.");
      return;
    }

    setCustomPromptPacks((prev) => [
      {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        category: customPromptCategory,
        value,
      },
      ...prev,
    ].slice(0, 24));
    setCustomPromptTitle("");
    setCustomPromptValue("");
    setChatStatus("Custom prompt pack saved.");
  }

  function removeCustomPromptPack(id: string) {
    setCustomPromptPacks((prev) => prev.filter((item) => item.id !== id));
  }

  function createSessionPreset() {
    const cleanedName = sessionPresetName.trim().slice(0, 42) || `${personaPreset.toUpperCase()} • ${focusSymbol}`;
    const preset: SessionPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanedName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      guideName,
      responseStyle,
      riskStance,
      focusSymbol,
      sessionIntent,
      personaPreset,
      workflowTask,
      workflowDepth,
      workflowCreativity,
    };

    setSessionPresets((prev) => [preset, ...prev].slice(0, 20));
    setSessionPresetName("");
    setChatStatus(`Saved session preset: ${cleanedName}`);
  }

  function applySessionPreset(preset: SessionPreset) {
    setGuideName(preset.guideName);
    setResponseStyle(preset.responseStyle);
    setRiskStance(preset.riskStance);
    setFocusSymbol(normalizeSymbol(preset.focusSymbol) || "SOL");
    setSessionIntent(preset.sessionIntent);
    setPersonaPreset(preset.personaPreset);
    setWorkflowTask(preset.workflowTask);
    setWorkflowDepth(preset.workflowDepth);
    setWorkflowCreativity(Math.max(20, Math.min(100, Math.round(preset.workflowCreativity))));
    setSessionPresets((prev) =>
      prev.map((item) =>
        item.id === preset.id
          ? {
              ...item,
              updatedAt: Date.now(),
            }
          : item,
      ).sort((a, b) => b.updatedAt - a.updatedAt),
    );
    setActiveTab("CHAT");
    setChatStatus(`Applied preset: ${preset.name}`);
  }

  function deleteSessionPreset(id: string) {
    setSessionPresets((prev) => prev.filter((item) => item.id !== id));
    setChatStatus("Session preset removed.");
  }

  function buildWorkspaceSettingsSnapshot(): WorkspaceSettingsSnapshot {
    return {
      guideName,
      responseStyle,
      riskStance,
      focusSymbol,
      sessionIntent,
      personaPreset,
      workflowTask,
      workflowDepth,
      workflowCreativity,
    };
  }

  function createWorkspaceSnapshot(customName?: string) {
    const nextVersion = (workspaceSnapshots[0]?.version ?? 0) + 1;
    const snapshotName = (customName ?? workspaceSnapshotName).trim().slice(0, 56) || `Workspace v${nextVersion}`;
    const snapshot: WorkspaceSnapshot = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: snapshotName,
      version: nextVersion,
      createdAt: Date.now(),
      payload: {
        settings: buildWorkspaceSettingsSnapshot(),
        customPromptPacks: customPromptPacks.slice(0, 24),
        memoryCards: memoryCards.slice(0, 12),
        sessionPresets: sessionPresets.slice(0, 20),
      },
    };

    setWorkspaceSnapshots((prev) => [snapshot, ...prev].slice(0, 16));
    setSelectedWorkspaceSnapshotId(snapshot.id);
    setWorkspaceSnapshotName("");
    setChatStatus(`Workspace snapshot saved: ${snapshot.name}`);
  }

  function restoreWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
    const settings = snapshot.payload.settings;
    setGuideName(settings.guideName);
    setResponseStyle(settings.responseStyle);
    setRiskStance(settings.riskStance);
    setFocusSymbol(normalizeSymbol(settings.focusSymbol) || "SOL");
    setSessionIntent(settings.sessionIntent.slice(0, 72));
    setPersonaPreset(settings.personaPreset);
    setWorkflowTask(settings.workflowTask);
    setWorkflowDepth(settings.workflowDepth);
    setWorkflowCreativity(Math.max(20, Math.min(100, Math.round(settings.workflowCreativity))));
    setCustomPromptPacks(snapshot.payload.customPromptPacks.slice(0, 24));
    setMemoryCards(snapshot.payload.memoryCards.slice(0, 12));
    setSessionPresets(snapshot.payload.sessionPresets.slice(0, 20));
    setSelectedWorkspaceSnapshotId(snapshot.id);
    setActiveTab("CHAT");
    setChatStatus(`Restored workspace snapshot: ${snapshot.name}`);
  }

  function restorePreviousWorkspaceSnapshot() {
    if (workspaceSnapshots.length < 2) {
      setChatStatus("No previous workspace snapshot available.");
      return;
    }
    restoreWorkspaceSnapshot(workspaceSnapshots[1]);
  }

  function deleteWorkspaceSnapshot(id: string) {
    setWorkspaceSnapshots((prev) => prev.filter((item) => item.id !== id));
    if (selectedWorkspaceSnapshotId === id) {
      setSelectedWorkspaceSnapshotId(null);
    }
    setChatStatus("Workspace snapshot deleted.");
  }

  function getWorkspaceSnapshotDiff(snapshot: WorkspaceSnapshot) {
    const currentSettings = buildWorkspaceSettingsSnapshot();
    const incomingSettings = snapshot.payload.settings;
    const changedSettings = (Object.keys(currentSettings) as Array<keyof WorkspaceSettingsSnapshot>)
      .filter((key) => currentSettings[key] !== incomingSettings[key]);

    return {
      changedSettings,
      customPromptDelta: snapshot.payload.customPromptPacks.length - customPromptPacks.length,
      memoryDelta: snapshot.payload.memoryCards.length - memoryCards.length,
      presetsDelta: snapshot.payload.sessionPresets.length - sessionPresets.length,
    };
  }

  function exportSessionSnapshot() {
    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        guideName,
        responseStyle,
        riskStance,
        focusSymbol,
        sessionIntent,
        personaPreset,
        workflowTask,
        workflowDepth,
        workflowCreativity,
      },
      customPromptPacks: customPromptPacks.slice(0, 24),
      memoryCards: memoryCards.slice(0, 12),
      sessionPresets: sessionPresets.slice(0, 20),
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradehax-session-snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setChatStatus("Session snapshot exported.");
  }

  async function saveDatasetNeuralArtifact() {
    const rows = Number(datasetRows.replace(/\D/g, "") || "0");
    if (!datasetName.trim()) {
      setChatStatus("Dataset name is required.");
      return;
    }

    const result = await saveDatasetArtifact({
      name: datasetName,
      rows,
      notes: datasetNotes,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    setNeuralVaultCount(getLocalNeuralVault().length);
    setChatStatus(result.ok ? "Dataset artifact saved to neural memory." : "Dataset saved locally. Network sync pending.");
  }

  async function saveUserBehaviorNeuralArtifact() {
    if (!behaviorLabel.trim() || !behaviorObservation.trim()) {
      setChatStatus("Behavior and observation are required.");
      return;
    }

    const result = await saveUserBehaviorArtifact({
      behavior: behaviorLabel,
      observation: behaviorObservation,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    setNeuralVaultCount(getLocalNeuralVault().length);
    setChatStatus(result.ok ? "User behavior pattern saved." : "Behavior saved locally. Network sync pending.");
  }

  async function saveTickerBehaviorNeuralArtifact() {
    if (!tickerBehaviorSymbol.trim() || !tickerBehaviorPattern.trim()) {
      setChatStatus("Ticker symbol and pattern are required.");
      return;
    }

    const result = await saveTickerBehaviorArtifact({
      ticker: tickerBehaviorSymbol,
      pattern: tickerBehaviorPattern,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    setNeuralVaultCount(getLocalNeuralVault().length);
    setChatStatus(result.ok ? "Ticker behavior pattern saved." : "Ticker behavior saved locally. Network sync pending.");
  }

  async function saveLearningEnvironmentNeuralArtifact() {
    if (!learningEnvironmentName.trim() || !learningEnvironmentHypothesis.trim()) {
      setChatStatus("Environment and hypothesis are required.");
      return;
    }

    const result = await saveLearningEnvironmentArtifact({
      environment: learningEnvironmentName,
      hypothesis: learningEnvironmentHypothesis,
      userId: buildHubUserId(),
      source: "system",
      route: "/",
      consent: {
        analytics: true,
        training: true,
      },
    });

    setNeuralVaultCount(getLocalNeuralVault().length);
    setChatStatus(result.ok ? "Learning environment saved." : "Learning environment saved locally. Network sync pending.");
  }

  function exportNeuralVaultDataset() {
    const result = exportLocalNeuralVault();
    if (!result.ok) {
      setChatStatus("Unable to export neural vault in this environment.");
      return;
    }
    setChatStatus(`Exported neural vault with ${result.count} records.`);
  }

  function importSessionSnapshotFromPrompt() {
    const raw = window.prompt("Paste exported session snapshot JSON:");
    if (!raw || !raw.trim()) return;

    try {
      const parsed = JSON.parse(raw) as {
        settings?: Partial<SessionPreset>;
        customPromptPacks?: Array<Partial<PromptLibraryItem>>;
        memoryCards?: Array<Partial<MemoryCard>>;
        sessionPresets?: Array<Partial<SessionPreset>>;
      };

      if (parsed.settings) {
        const settings = parsed.settings;
        if (typeof settings.guideName === "string" && settings.guideName.trim()) {
          setGuideName(settings.guideName.trim().slice(0, 24));
        }
        if (settings.responseStyle === "concise" || settings.responseStyle === "coach" || settings.responseStyle === "operator") {
          setResponseStyle(settings.responseStyle);
        }
        if (settings.riskStance === "guarded" || settings.riskStance === "balanced" || settings.riskStance === "aggressive") {
          setRiskStance(settings.riskStance);
        }
        if (typeof settings.focusSymbol === "string") {
          setFocusSymbol(normalizeSymbol(settings.focusSymbol) || "SOL");
        }
        if (typeof settings.sessionIntent === "string") {
          setSessionIntent(settings.sessionIntent.slice(0, 72));
        }
        if (settings.personaPreset === "mystic" || settings.personaPreset === "analyst" || settings.personaPreset === "mentor") {
          setPersonaPreset(settings.personaPreset);
        }
        if (settings.workflowTask === "chat" || settings.workflowTask === "generate" || settings.workflowTask === "summarize" || settings.workflowTask === "qa") {
          setWorkflowTask(settings.workflowTask);
        }
        if (settings.workflowDepth === "quick" || settings.workflowDepth === "balanced" || settings.workflowDepth === "deep") {
          setWorkflowDepth(settings.workflowDepth);
        }
        if (typeof settings.workflowCreativity === "number") {
          setWorkflowCreativity(Math.max(20, Math.min(100, Math.round(settings.workflowCreativity))));
        }
      }

      if (Array.isArray(parsed.customPromptPacks)) {
        setCustomPromptPacks(
          parsed.customPromptPacks
            .slice(0, 24)
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              title: String(item.title ?? "Custom Prompt").slice(0, 40),
              category: item.category === "trading" || item.category === "content" || item.category === "ops" ? item.category : "ops",
              value: String(item.value ?? "").slice(0, 500),
            }))
            .filter((item) => item.value.trim().length > 0),
        );
      }

      if (Array.isArray(parsed.memoryCards)) {
        setMemoryCards(
          parsed.memoryCards
            .slice(0, 12)
            .map<MemoryCard>((card) => ({
              id: typeof card.id === "string" ? card.id : `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              scope: card.scope === "long" ? "long" : "short",
              title: String(card.title ?? "Memory").slice(0, 40),
              content: String(card.content ?? "").slice(0, 160),
              updatedAt: typeof card.updatedAt === "number" ? card.updatedAt : Date.now(),
              confidence: typeof card.confidence === "number" ? Math.min(100, Math.max(1, card.confidence)) : 70,
            }))
            .filter((card) => card.content.trim().length > 0),
        );
      }

      if (Array.isArray(parsed.sessionPresets)) {
        setSessionPresets(
          parsed.sessionPresets
            .slice(0, 20)
            .map((preset) => ({
              id: typeof preset.id === "string" ? preset.id : `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: String(preset.name ?? "Session Preset").slice(0, 42),
              createdAt: typeof preset.createdAt === "number" ? preset.createdAt : Date.now(),
              updatedAt: typeof preset.updatedAt === "number" ? preset.updatedAt : Date.now(),
              guideName: String(preset.guideName ?? "Trader").slice(0, 24),
              responseStyle: preset.responseStyle === "concise" || preset.responseStyle === "coach" || preset.responseStyle === "operator"
                ? preset.responseStyle
                : "coach",
              riskStance: preset.riskStance === "guarded" || preset.riskStance === "balanced" || preset.riskStance === "aggressive"
                ? preset.riskStance
                : "balanced",
              focusSymbol: String(preset.focusSymbol ?? "SOL").slice(0, 12),
              sessionIntent: String(preset.sessionIntent ?? "Build disciplined consistency").slice(0, 72),
              personaPreset: preset.personaPreset === "mystic" || preset.personaPreset === "analyst" || preset.personaPreset === "mentor"
                ? preset.personaPreset
                : "mystic",
              workflowTask: preset.workflowTask === "chat" || preset.workflowTask === "generate" || preset.workflowTask === "summarize" || preset.workflowTask === "qa"
                ? preset.workflowTask
                : "chat",
              workflowDepth: preset.workflowDepth === "quick" || preset.workflowDepth === "balanced" || preset.workflowDepth === "deep"
                ? preset.workflowDepth
                : "balanced",
              workflowCreativity:
                typeof preset.workflowCreativity === "number"
                  ? Math.max(20, Math.min(100, Math.round(preset.workflowCreativity)))
                  : 65,
            }))
            .sort((a, b) => b.updatedAt - a.updatedAt),
        );
      }

      setChatStatus("Session snapshot imported.");
    } catch {
      setChatStatus("Invalid snapshot JSON. Import aborted.");
    }
  }

  const promptLibraryEntries = [...PROMPT_LIBRARY, ...customPromptPacks];

  const slashCommands: SlashCommand[] = [
    {
      id: "new",
      label: "/new",
      description: "Start a new secure chat session",
      execute: () => startNewChat(),
    },
    {
      id: "palette",
      label: "/palette",
      description: "Open command palette",
      execute: () => setIsCommandPaletteOpen(true),
    },
    {
      id: "library",
      label: "/library",
      description: "Toggle prompt library drawer",
      execute: () => setIsPromptLibraryOpen((prev) => !prev),
    },
    {
      id: "task-chat",
      label: "/chat",
      description: "Switch to Neural Chat task",
      execute: () => setWorkflowTask("chat"),
    },
    {
      id: "task-generate",
      label: "/generate",
      description: "Switch to Generate task",
      execute: () => setWorkflowTask("generate"),
    },
    {
      id: "task-summarize",
      label: "/summarize",
      description: "Switch to Summarize task",
      execute: () => setWorkflowTask("summarize"),
    },
    {
      id: "task-qa",
      label: "/qa",
      description: "Switch to QA task",
      execute: () => setWorkflowTask("qa"),
    },
    {
      id: "save-preset",
      label: "/savepreset",
      description: "Save current settings as a session preset",
      execute: () => createSessionPreset(),
    },
    {
      id: "export-session",
      label: "/exportsession",
      description: "Export full session snapshot",
      execute: () => exportSessionSnapshot(),
    },
    {
      id: "import-session",
      label: "/importsession",
      description: "Import a session snapshot JSON",
      execute: () => importSessionSnapshotFromPrompt(),
    },
    {
      id: "snapshot",
      label: "/snapshot",
      description: "Capture workspace timeline snapshot",
      execute: () => createWorkspaceSnapshot(),
    },
    {
      id: "undo-snapshot",
      label: "/undo",
      description: "Restore previous workspace snapshot",
      execute: () => restorePreviousWorkspaceSnapshot(),
    },
  ];

  const commandPaletteEntries: Array<{ id: string; label: string; hint: string; action: () => void }> = [
    { id: "new-chat", label: "New Chat", hint: "Start a fresh secure session", action: () => startNewChat() },
    { id: "toggle-library", label: "Toggle Prompt Library", hint: "Open/close curated prompt drawer", action: () => setIsPromptLibraryOpen((prev) => !prev) },
    { id: "task-chat", label: "Mode: Neural Chat", hint: "Relationship-aware assistant mode", action: () => setWorkflowTask("chat") },
    { id: "task-generate", label: "Mode: Generate", hint: "Draft long-form or short-form output", action: () => setWorkflowTask("generate") },
    { id: "task-summarize", label: "Mode: Summarize", hint: "Compress dense source into action summary", action: () => setWorkflowTask("summarize") },
    { id: "task-qa", label: "Mode: Q&A", hint: "Ground answers in explicit context", action: () => setWorkflowTask("qa") },
    { id: "save-preset", label: "Save Session Preset", hint: "Store current operator setup", action: () => createSessionPreset() },
    { id: "export-session", label: "Export Session Snapshot", hint: "Download settings, memory, and presets JSON", action: () => exportSessionSnapshot() },
    { id: "import-session", label: "Import Session Snapshot", hint: "Paste JSON to restore a saved workspace", action: () => importSessionSnapshotFromPrompt() },
    { id: "capture-workspace", label: "Capture Workspace Snapshot", hint: "Save full timeline snapshot of current state", action: () => createWorkspaceSnapshot() },
    { id: "undo-workspace", label: "Undo to Previous Snapshot", hint: "Rewind workspace to prior saved state", action: () => restorePreviousWorkspaceSnapshot() },
    { id: "copy-last", label: "Copy Last Reply", hint: "Copy latest assistant output", action: () => { void copyLastReply(); } },
    { id: "export", label: "Export Transcript", hint: "Download current session transcript", action: () => exportTranscript() },
  ];

  const slashQuery = chatInput.startsWith("/") ? chatInput.slice(1).trim().toLowerCase() : "";
  const filteredSlashCommands = chatInput.startsWith("/")
    ? slashCommands.filter((command) =>
        command.label.replace(/^\//, "").includes(slashQuery) || command.description.toLowerCase().includes(slashQuery),
      )
    : [];
  const filteredCommandPaletteEntries = commandPaletteEntries.filter((entry) => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return true;
    return entry.label.toLowerCase().includes(query) || entry.hint.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const onPaletteKeyDown = (event: KeyboardEvent) => {
      if (filteredCommandPaletteEntries.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCommandSelectionIndex((prev) => (prev + 1) % filteredCommandPaletteEntries.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCommandSelectionIndex((prev) =>
          prev <= 0 ? filteredCommandPaletteEntries.length - 1 : prev - 1,
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selected = filteredCommandPaletteEntries[Math.min(commandSelectionIndex, filteredCommandPaletteEntries.length - 1)];
        if (selected) {
          runPaletteCommand(selected.id);
        }
      }
    };

    window.addEventListener("keydown", onPaletteKeyDown);
    return () => window.removeEventListener("keydown", onPaletteKeyDown);
  }, [isCommandPaletteOpen, filteredCommandPaletteEntries, commandSelectionIndex]);

  function applySlashCommand(command: SlashCommand) {
    command.execute();
    setChatInput("");
    setChatStatus(`Executed ${command.label}`);
  }

  function tryExecuteSlashInput(input: string) {
    if (!input.startsWith("/")) return false;
    const slashToken = input.split(/\s+/)[0].trim().toLowerCase();
    const command = slashCommands.find((item) => item.label === slashToken);
    if (!command) {
      setChatStatus("Unknown slash command. Try /palette, /library, /chat, /generate, /summarize, /qa, /savepreset, /exportsession, /importsession, /snapshot, /undo.");
      return true;
    }

    applySlashCommand(command);
    return true;
  }

  function runPaletteCommand(id: string) {
    const match = commandPaletteEntries.find((entry) => entry.id === id);
    if (!match) return;
    match.action();
    setIsCommandPaletteOpen(false);
    setCommandQuery("");
  }

  async function transformAssistantMessage(index: number, mode: "improve" | "rewrite" | "shorten") {
    if (isChatLoading || isCharging) return;
    const target = messages[index];
    if (!target || target.role !== "assistant") return;

    const directive =
      mode === "improve"
        ? "Improve the following response for clarity, stronger structure, and sharper actionability while preserving intent."
        : mode === "rewrite"
          ? "Rewrite the following response with a higher-end, executive tone and cleaner structure while preserving meaning."
          : "Shorten the following response into concise bullets with one immediate action line.";

    const transformPrompt = `${directive}\n\nOriginal response:\n${target.content}`;
    setWorkflowTask("generate");
    const transformed = await requestAssistantReply(transformPrompt, { appendUser: true });
    if (typeof transformed === "string" && transformed.trim()) {
      setCompareSnapshot({
        mode,
        original: target.content,
        transformed,
        sourceIndex: index,
        createdAt: Date.now(),
      });
      setChatStatus(`Compare view ready: ${mode.toUpperCase()} transform captured.`);
    }
  }

  function applyRitualPrompt(value: string) {
    setActiveTab("CHAT");
    setChatInput(value);
  }

  function buildHubUserId() {
    return `landing_hub_${(normalizeGuideName(guideName) || "trader").toLowerCase().replace(/\s+/g, "_")}`;
  }

  function addMemoryCard(scope: MemoryScope, title: string, content: string) {
    const trimmedTitle = title.trim().slice(0, 40);
    const trimmedContent = content.trim().slice(0, 160);
    if (!trimmedTitle || !trimmedContent) return;

    setMemoryCards((prev) => {
      const next = [
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          scope,
          title: trimmedTitle,
          content: trimmedContent,
          updatedAt: Date.now(),
          confidence: scope === "long" ? 84 : 72,
        },
        ...prev,
      ];

      const shorts = next.filter((card) => card.scope === "short").slice(0, 6);
      const longs = next.filter((card) => card.scope === "long").slice(0, 6);
      return [...longs, ...shorts].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12);
    });
  }

  function beginEditMemory(card: MemoryCard) {
    setEditingMemoryId(card.id);
    setEditingMemoryTitle(card.title);
    setEditingMemoryContent(card.content);
  }

  function cancelEditMemory() {
    setEditingMemoryId(null);
    setEditingMemoryTitle("");
    setEditingMemoryContent("");
  }

  function saveEditMemory(id: string) {
    const title = editingMemoryTitle.trim().slice(0, 40);
    const content = editingMemoryContent.trim().slice(0, 160);
    if (!title || !content) {
      setChatStatus("Memory title and content are required.");
      return;
    }

    setMemoryCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              title,
              content,
              updatedAt: Date.now(),
              confidence: Math.min(100, card.confidence + 4),
            }
          : card,
      ),
    );
    cancelEditMemory();
    setChatStatus("Memory card updated.");
  }

  function deleteMemoryCard(id: string) {
    setMemoryCards((prev) => prev.filter((card) => card.id !== id));
  }

  function toggleMemoryScope(id: string) {
    setMemoryCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              scope: card.scope === "long" ? "short" : "long",
              updatedAt: Date.now(),
              confidence: Math.min(100, card.confidence + 2),
            }
          : card,
      ),
    );
  }

  function applyMemoryToInput(card: MemoryCard) {
    const suffix = card.scope === "long" ? "(pinned memory)" : "(session memory)";
    const stitched = `${chatInput.trim()} ${card.content} ${suffix}`.trim();
    setChatInput(stitched.slice(0, 500));
    setMemoryCards((prev) =>
      prev.map((entry) =>
        entry.id === card.id
          ? {
              ...entry,
              updatedAt: Date.now(),
              confidence: Math.min(100, entry.confidence + 8),
            }
          : entry,
      ),
    );
    setActiveTab("CHAT");
  }

  function beginEditMessage(index: number) {
    const target = messages[index];
    if (!target || target.role !== "user") return;
    setEditingMessageIndex(index);
    setEditingMessageDraft(target.content);
  }

  function cancelEditMessage() {
    setEditingMessageIndex(null);
    setEditingMessageDraft("");
  }

  function pruneConversationAtUser(index: number, replacementContent?: string) {
    const target = messages[index];
    if (!target || target.role !== "user") return "";

    const updatedUserContent = (replacementContent ?? target.content).trim();
    if (!updatedUserContent) return "";

    const nextHistory = messages.slice(0, index + 1).map((entry, entryIdx) =>
      entryIdx === index
        ? {
            ...entry,
            content: updatedUserContent,
          }
        : entry,
    );
    setMessages(nextHistory);
    return updatedUserContent;
  }

  function logBranch(kind: "retry" | "edit-retry", fromIndex: number, preview: string) {
    const safePreview = preview.trim().slice(0, 120);
    if (!safePreview) return;

    setBranchTrail((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind,
        fromIndex,
        preview: safePreview,
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 18));
  }

  function stepReplay(delta: number) {
    setReplayCursor((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= branchTrail.length) return Math.max(0, branchTrail.length - 1);
      return next;
    });
  }

  function restoreReplayEntry(entry: BranchTrailEntry | null) {
    if (!entry) return;
    setActiveTab("CHAT");
    setChatInput(entry.preview);
    setChatStatus(`Loaded ${entry.kind === "edit-retry" ? "edited" : "retry"} branch #${entry.fromIndex + 1} into input.`);
  }

  function startNewChat() {
    setMessages([
      {
        role: "assistant",
        content: `${guideName} is synced. Intent locked: ${sessionIntent}. Focus: ${focusSymbol}. Say the word and we begin.`,
      },
    ]);
    setBranchTrail([]);
    setChatInput("");
    cancelEditMessage();
    setChatStatus("Started a fresh secure session.");
  }

  function getLastAssistantReply() {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        return messages[i].content;
      }
    }
    return "";
  }

  async function copyLastReply() {
    const text = getLastAssistantReply();
    if (!text) {
      setChatStatus("No assistant reply to copy yet.");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setChatStatus("Copied last reply to clipboard.");
    } catch {
      setChatStatus("Copy failed. Try selecting text manually.");
    }
  }

  function rememberLastPrompt() {
    const lastUser = [...messages].reverse().find((item) => item.role === "user")?.content || "";
    if (!lastUser) {
      setChatStatus("No recent user prompt to store.");
      return;
    }
    addMemoryCard("short", `Prompt ${new Date().toLocaleTimeString()}`, lastUser);
    setChatStatus("Stored latest prompt in session memory.");
  }

  function pinCurrentFocus() {
    addMemoryCard("long", `Focus ${focusSymbol}`, `${sessionIntent} • Symbol: ${focusSymbol}`);
    setChatStatus("Pinned current focus into long-term memory.");
  }

  function insertVideoInstructionBrief() {
    const safeUrl = normalizeVideoUrl(videoSourceUrl);
    if (!safeUrl) {
      setChatStatus("Add a video URL first to infuse instructions.");
      return;
    }

    const brief = buildVideoInstructionBrief();
    const stitched = `${chatInput.trim()}\n\n${brief}`.trim();
    setActiveTab("CHAT");
    setChatInput(stitched.slice(0, 1500));
    setChatStatus("Video AI instruction brief inserted into chat input.");
  }

  function rememberVideoInstructionBrief() {
    const safeUrl = normalizeVideoUrl(videoSourceUrl);
    if (!safeUrl) {
      setChatStatus("Cannot store video brief without a URL.");
      return;
    }

    addMemoryCard("long", "Video Instruction Brief", buildVideoInstructionBrief());
    setChatStatus("Stored video instruction brief in long-term memory.");
  }

  function insertCompetitiveEdgeBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Edge brief is empty. Adjust inputs and retry.");
      return;
    }
    setActiveTab("CHAT");
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus("Competitive edge brief inserted into chat input.");
  }

  function rememberCompetitiveEdgeBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Nothing to save yet. Build an edge brief first.");
      return;
    }
    addMemoryCard("long", `Edge Brief ${focusSymbol}`, safeBrief.slice(0, 160));
    setChatStatus("Competitive edge brief saved to long-term memory.");
  }

  function insertPostTradeForensicsBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Forensics brief is empty. Fill post-trade inputs first.");
      return;
    }
    setActiveTab("CHAT");
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus("Post-trade forensics brief inserted into chat input.");
  }

  function rememberPostTradeForensicsBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Nothing to store yet. Generate a forensics brief first.");
      return;
    }
    addMemoryCard("long", `Forensics ${focusSymbol}`, safeBrief.slice(0, 160));
    setChatStatus("Post-trade recovery brief saved to long-term memory.");
  }

  function insertRegimeShiftSentinelBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Regime sentinel brief is empty. Fill metrics first.");
      return;
    }
    setActiveTab("CHAT");
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus("Regime shift sentinel brief inserted into chat input.");
  }

  function rememberRegimeShiftSentinelBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("No regime brief to store yet.");
      return;
    }
    addMemoryCard("long", `Regime Sentinel ${focusSymbol}`, safeBrief.slice(0, 160));
    setChatStatus("Regime sentinel brief saved to long-term memory.");
  }

  function insertExecutionLatencyGuardBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Latency guard brief is empty. Fill metrics first.");
      return;
    }
    setActiveTab("CHAT");
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus("Execution latency guard brief inserted into chat input.");
  }

  function rememberExecutionLatencyGuardBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("No latency guard brief to store yet.");
      return;
    }
    addMemoryCard("long", `Latency Guard ${focusSymbol}`, safeBrief.slice(0, 160));
    setChatStatus("Execution latency guard brief saved to long-term memory.");
  }

  function insertSessionDriftGovernorBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Session drift brief is empty. Fill metrics first.");
      return;
    }
    setActiveTab("CHAT");
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus("Session drift governor brief inserted into chat input.");
  }

  function rememberSessionDriftGovernorBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("No session drift brief to store yet.");
      return;
    }
    addMemoryCard("long", `Session Drift ${focusSymbol}`, safeBrief.slice(0, 160));
    setChatStatus("Session drift governor brief saved to long-term memory.");
  }

  function insertCapitalPreservationCircuitBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("Capital circuit brief is empty. Fill metrics first.");
      return;
    }
    setActiveTab("CHAT");
    setChatInput((prev) => `${safeBrief}\n\n${prev.trim()}`.trim().slice(0, 3500));
    setChatStatus("Capital preservation circuit brief inserted into chat input.");
  }

  function rememberCapitalPreservationCircuitBrief(brief: string) {
    const safeBrief = brief.trim();
    if (!safeBrief) {
      setChatStatus("No capital circuit brief to store yet.");
      return;
    }
    addMemoryCard("long", `Capital Circuit ${focusSymbol}`, safeBrief.slice(0, 160));
    setChatStatus("Capital preservation circuit brief saved to long-term memory.");
  }

  async function generateWebsiteAutopilotDraft() {
    const normalizedSource = normalizeVideoUrl(websiteSourceUrl);
    if (!normalizedSource) {
      setChatStatus("Add a website URL first for social autopilot.");
      return;
    }

    setIsGeneratingAutopilot(true);
    setChatStatus("Generating cross-platform social drafts from website content...");

    try {
      const response = await fetch("/api/intelligence/content/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: normalizedSource,
          focus: autopilotFocus,
          channels: autopilotChannels,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setChatStatus(typeof payload?.error === "string" ? payload.error : "Failed to generate social drafts.");
        return;
      }

      const block = buildAutopilotDraftBlock(payload.draft);
      if (!block) {
        setChatStatus("Draft generation returned empty content.");
        return;
      }

      setLatestAutopilotDraft(payload.draft as Record<string, unknown>);
      setActiveTab("CHAT");
      setChatInput((prev) => `${prev.trim()}\n\n${block}`.trim().slice(0, 3500));
      addMemoryCard("long", "Website Social Autopilot", block.slice(0, 160));
      setChatStatus("Social autopilot drafts inserted into chat input. Save it to ops when ready.");
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : "Social autopilot request failed.");
    } finally {
      setIsGeneratingAutopilot(false);
    }
  }

  async function refreshAutopilotOps() {
    try {
      const response = await fetch("/api/intelligence/content/autopilot", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setChatStatus(typeof payload?.error === "string" ? payload.error : "Failed to refresh social ops status.");
        return;
      }
      setAutopilotOpsSnapshot(payload as SocialOpsSnapshot);
      if (!autopilotOpsDraftId && Array.isArray(payload?.drafts) && payload.drafts[0]?.id) {
        setAutopilotOpsDraftId(String(payload.drafts[0].id));
      }
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : "Could not refresh social ops state.");
    }
  }

  async function performAutopilotAction(action: string, extra: Record<string, unknown> = {}) {
    setAutopilotOpsLoading(true);
    try {
      const response = await fetch("/api/intelligence/content/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setChatStatus(typeof payload?.error === "string" ? payload.error : `Autopilot action failed: ${action}`);
        return null;
      }
      await refreshAutopilotOps();
      return payload as Record<string, unknown>;
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : `Autopilot action failed: ${action}`);
      return null;
    } finally {
      setAutopilotOpsLoading(false);
    }
  }

  async function saveCurrentAutopilotDraftToOps() {
    if (!latestAutopilotDraft) {
      setChatStatus("Generate drafts first, then save to Social Ops.");
      return;
    }

    const response = await performAutopilotAction("create_draft", {
      sourceUrl: String(latestAutopilotDraft.sourceUrl || normalizeVideoUrl(websiteSourceUrl) || ""),
      focus: String(latestAutopilotDraft.focus || autopilotFocus || "cross-platform brand growth"),
      channels: autopilotChannels,
      content: (latestAutopilotDraft.channels && typeof latestAutopilotDraft.channels === "object")
        ? (latestAutopilotDraft.channels as Record<string, unknown>)
        : {},
    });

    const draft = response?.draft as { id?: string } | undefined;
    if (draft?.id) {
      setAutopilotOpsDraftId(String(draft.id));
      setChatStatus(`Saved draft to social ops: ${draft.id}`);
    }
  }

  async function submitAutopilotForApproval() {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    const response = await performAutopilotAction("submit_for_approval", { draftId: autopilotOpsDraftId.trim() });
    if (response) setChatStatus("Draft submitted for approval.");
  }

  async function approveAutopilotDraft() {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    const response = await performAutopilotAction("approve_draft", { draftId: autopilotOpsDraftId.trim() });
    if (response) setChatStatus("Draft approved and ready to publish.");
  }

  async function scheduleAutopilotDraft() {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    if (!autopilotScheduleAt.trim()) {
      setChatStatus("Pick a schedule datetime first.");
      return;
    }

    const response = await performAutopilotAction("schedule_draft", {
      draftId: autopilotOpsDraftId.trim(),
      runAt: autopilotScheduleAt,
      channels: autopilotChannels,
    });
    if (response) setChatStatus("Draft scheduled and queued by channel.");
  }

  async function publishAutopilotNow() {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }
    const response = await performAutopilotAction("publish_now", {
      draftId: autopilotOpsDraftId.trim(),
      channels: autopilotChannels,
    });
    if (response) setChatStatus("Publish now executed. Check queue results and connector status.");
  }

  async function runDueAutopilotJobs() {
    const response = await performAutopilotAction("run_due_jobs");
    if (response) setChatStatus("Processed due queued jobs.");
  }

  async function syncAutopilotPerformance() {
    if (!autopilotOpsDraftId.trim()) {
      setChatStatus("Enter or save a Social Ops draft ID first.");
      return;
    }

    const impressions = Number(autopilotImpressions.replace(/\D/g, "") || "0");
    const engagements = Number(autopilotEngagements.replace(/\D/g, "") || "0");
    const clicks = Number(autopilotClicks.replace(/\D/g, "") || "0");

    const response = await performAutopilotAction("update_performance", {
      draftId: autopilotOpsDraftId.trim(),
      metrics: {
        impressions,
        engagements,
        clicks,
      },
    });
    if (response) setChatStatus("Performance metrics synced to calendar feedback loop.");
  }

  function exportTranscript() {
    if (messages.length === 0) {
      setChatStatus("No transcript available yet.");
      return;
    }

    const transcript = messages
      .map((msg, idx) => `${idx + 1}. [${msg.role.toUpperCase()}] ${msg.content}`)
      .join("\n\n");

    const payload = [
      `Guide: ${guideName}`,
      `Style: ${responseStyle}`,
      `Risk Stance: ${riskStance}`,
      `Focus: ${focusSymbol}`,
      `Intent: ${sessionIntent}`,
      "",
      transcript,
    ].join("\n");

    const blob = new Blob([payload], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradehax-neural-transcript-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setChatStatus("Transcript exported.");
  }

  async function requestAssistantReply(userMsg: string, options?: { appendUser?: boolean; regenerate?: boolean }): Promise<string | null> {
    if (!userMsg.trim()) return null;

    if (options?.appendUser) {
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    }

    setIsChatLoading(true);
    setChatStatus(options?.regenerate ? "Regenerating response..." : "");
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      let responseText = "";
      let resolvedModel = selectedChatModel;
      let providerLabel = "";

      if (workflowTask === "chat") {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMsg,
            userId: buildHubUserId(),
            model: selectedChatModel,
            tier: openModeEnabled ? "UNCENSORED" : "STANDARD",
            systemPrompt: buildPremierSystemPrompt(),
            context: {
              relationshipTier,
              riskStance,
              focusSymbol,
              sessionIntent,
            },
          })
        });
        const data = await res.json();
        if (res.ok && data?.ok && typeof data?.response === "string" && data.response.trim()) {
          responseText = data.response;
          resolvedModel = typeof data?.model === "string" ? data.model : selectedChatModel;
          providerLabel = typeof data?.provider === "string" ? ` • Provider: ${data.provider}` : "";
        } else {
          const errorMessage =
            typeof data?.message === "string" && data.message.trim()
              ? data.message
              : typeof data?.error === "string" && data.error.trim()
                ? data.error
                : "AI temporarily unavailable. Please try again.";
          setMessages(prev => [...prev, { role: "assistant", content: `ERROR: ${errorMessage}` }]);
          setChatStatus("The assistant hit an issue. You can retry or switch models.");
          return null;
        }
      } else {
        const res = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: workflowTask,
            userId: buildHubUserId(),
            model: selectedChatModel,
            temperature: Number((workflowCreativity / 100).toFixed(2)),
            maxTokens: getMaxTokensForDepth(workflowDepth),
            topP: 0.95,
            ...(workflowTask === "generate" ? { prompt: userMsg } : {}),
            ...(workflowTask === "summarize" ? { text: userMsg } : {}),
            ...(workflowTask === "qa" ? { question: userMsg, context: buildQaContext() } : {}),
          }),
        });
        const data = await res.json();
        if (res.ok && data?.ok && typeof data?.result === "string" && data.result.trim()) {
          responseText = data.result;
          resolvedModel = typeof data?.model === "string" ? data.model : selectedChatModel;
        } else {
          const errorMessage =
            typeof data?.error === "string" && data.error.trim()
              ? data.error
              : "LLM task failed. Please retry with adjusted settings.";
          setMessages(prev => [...prev, { role: "assistant", content: `ERROR: ${errorMessage}` }]);
          setChatStatus("Task execution failed. Consider switching task mode or reducing complexity.");
          return null;
        }
      }

      if (responseText.trim()) {
        setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
        const elapsedMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt);
        const quality = scoreResponseQuality(responseText, workflowTask);
        setQualitySnapshot({
          task: workflowTask,
          model: resolvedModel,
          latencyMs: elapsedMs,
          ...quality,
        });
        setChatStatus(`Model: ${resolvedModel}${providerLabel} • Task: ${workflowTask.toUpperCase()} • ${elapsedMs}ms`);
        incrementUsage();
        return responseText;
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "ERROR: NEURAL_TIMEOUT" }]);
      setChatStatus("Network timeout. Please check connection and retry.");
      return null;
    } finally {
      setIsChatLoading(false);
    }

    return null;
  }

  async function regenerateLastResponse() {
    if (isChatLoading || isCharging) return;
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")?.content || "";
    if (!lastUserMessage) {
      setChatStatus("No user message found to regenerate from.");
      return;
    }
    await requestAssistantReply(lastUserMessage, { regenerate: true });
  }

  async function retryFromMessageIndex(index: number) {
    if (isChatLoading || isCharging) return;
    const retryMessage = pruneConversationAtUser(index);
    if (!retryMessage) {
      setChatStatus("Could not retry from that message.");
      return;
    }
    logBranch("retry", index, retryMessage);
    await requestAssistantReply(retryMessage, { regenerate: true });
  }

  async function saveEditAndRetry() {
    if (editingMessageIndex === null || isChatLoading || isCharging) return;
    const updated = pruneConversationAtUser(editingMessageIndex, editingMessageDraft);
    if (!updated) {
      setChatStatus("Edited prompt is empty. Please add text before retrying.");
      return;
    }
    logBranch("edit-retry", editingMessageIndex, updated);
    cancelEditMessage();
    setChatStatus("Edited message saved. Regenerating response...");
    await requestAssistantReply(updated, { regenerate: true });
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || isCharging) return;

    const userMsg = chatInput.trim();
    if (tryExecuteSlashInput(userMsg)) {
      return;
    }
    setChatInput("");
    await requestAssistantReply(userMsg, { appendUser: true });
  };

  // --- IMAGE GEN LOGIC ---
  const [imgPrompt, setImgPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("NEURAL_DIFF_V4");
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [imageStatus, setImageStatus] = useState<string>("");

  const imageModels = [
    { id: "NEURAL_DIFF_V4", name: "Neural Diff V4", provider: "SDXL", label: "UNCENSORED" },
    { id: "FLUX_CORE_X", name: "Flux Core X", provider: "FLUX.1", label: "HIGH_FIDELITY" },
    { id: "ASTRA_LINK", name: "Astra Link", provider: "MIDJ-V6", label: "CREATIVE" },
  ];

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || isImgLoading || isCharging) return;
    setIsImgLoading(true);
    setGeneratedImg(null);
    setImageStatus("");

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt,
          style: "general",
          model: selectedModel,
          safetyMode: openModeEnabled ? "open" : "standard",
        })
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.url) {
        setGeneratedImg(data.url);
        if (data?.fallback) {
          setImageStatus(`Preview mode: ${data?.warning || "provider unavailable"}`);
        } else if (typeof data?.model === "string") {
          setImageStatus(`Generated with ${data.model}`);
        }
        incrementUsage();
      } else {
        console.error("Image generation failed", data?.error || data);
        setImageStatus(typeof data?.error === "string" ? data.error : "Image generation failed. Try another model.");
      }
    } catch (err) {
      console.error("Image gen failed", err);
      setImageStatus("Network error while generating image. Please retry.");
    } finally {
      setIsImgLoading(false);
    }
  };

  // --- MARKET LOGIC ---
  const marketTrendScore = watchlist.reduce(
    (score, asset) => score + (asset.trend === "up" ? 1 : asset.trend === "down" ? -1 : 0),
    0,
  );
  const detectedMarketRegime: "BULLISH" | "BEARISH" | "MIXED" = marketTrendScore >= 2 ? "BULLISH" : marketTrendScore <= -2 ? "BEARISH" : "MIXED";
  const activePromptPack = PERSONA_PROMPT_PACKS[personaPreset][detectedMarketRegime];
  const branchGraphEntries = branchTrail.slice(0, 8).reverse();
  const replayEntries = branchTrail;
  const activeReplayEntry = replayEntries.length > 0 ? replayEntries[Math.min(replayCursor, replayEntries.length - 1)] : null;
  const selectedWorkspaceSnapshot = selectedWorkspaceSnapshotId
    ? workspaceSnapshots.find((item) => item.id === selectedWorkspaceSnapshotId) ?? null
    : workspaceSnapshots[0] ?? null;
  const selectedWorkspaceSnapshotDiff = selectedWorkspaceSnapshot
    ? getWorkspaceSnapshotDiff(selectedWorkspaceSnapshot)
    : null;

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <NeuralBackground />
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-mono text-cyan-500 uppercase tracking-[0.3em]">Neural_Core_Platform</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                Access the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">TradeHax Intelligence</span>
              </h2>
            </div>

            <div className="flex w-full md:w-auto flex-col items-stretch sm:items-end gap-2">
              <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3 p-1 bg-zinc-900/50 rounded-full border border-white/5">
                {(["CHAT", "IMAGE_GEN", "MARKET"] as HubTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black tracking-[0.12em] sm:tracking-widest transition-all ${
                      activeTab === tab
                        ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {tab === "CHAT" ? "AI_CHAT" : tab === "IMAGE_GEN" ? "IMAGE_TOOL" : "MARKET_TOOLS"}
                  </button>
                ))}
              </div>
              <div className="w-full max-w-[280px] sm:max-w-[300px] md:w-[300px] rounded-xl border border-cyan-500/25 bg-[rgba(10,12,16,0.88)] px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-[0_0_18px_rgba(6,182,212,0.12)]">
                <label className="mb-1 block text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.2em] text-cyan-300/85">
                  Model (optional)
                </label>
                <select
                  value={selectedChatModel}
                  onChange={(event) => setSelectedChatModel(event.target.value)}
                  className="w-full rounded-lg border border-cyan-500/35 bg-black/60 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-zinc-100 outline-none transition-colors hover:border-cyan-400/60 focus:border-cyan-300"
                  title="Select model for GPT_CHAT"
                >
                  {CHAT_MODELS.map((model) => (
                    <option key={model.id} value={model.id} title={model.hint}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="self-end flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-zinc-900/80 border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${isCharging ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 uppercase">
                  {isCharging ? 'USAGE_LIMIT_REACHED' : `FREE_TRIAL: ${FREE_USAGE_LIMIT - usageCount}/${FREE_USAGE_LIMIT} REMAINING`}
                </span>
              </div>

              <button
                onClick={() => setOpenModeEnabled((prev) => !prev)}
                className="self-end rounded-full border border-fuchsia-500/30 bg-fuchsia-600/10 px-3 py-1 text-[9px] sm:text-[10px] font-mono uppercase text-fuchsia-200 hover:border-fuchsia-400/60"
                title="Toggle uncensored open mode for chat and image generation"
              >
                {openModeEnabled ? "UNCENSORED_ON" : "STANDARD_MODE"}
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-cyan-500/25 bg-[rgba(8,14,20,0.75)] px-4 py-3 text-[11px] text-cyan-100/85">
            <p className="font-semibold uppercase tracking-wide">Quick start</p>
            <p className="mt-1">1) Open <strong>AI_CHAT</strong>, 2) ask your goal in simple words, 3) use IMAGE_TOOL or MARKET_TOOLS as needed.</p>
          </div>

          <div className={`mb-8 grid gap-3 rounded-2xl border ${selectedTheme.heroBorder} ${selectedTheme.heroGradient} p-4 md:grid-cols-[1.1fr_1fr]`}>
            <div>
              <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${selectedTheme.badgeTone}`}>Neural Guide Bond</p>
              <h3 className="mt-1 text-lg font-black italic text-white">Your Mystical Trading Companion</h3>
              <p className="mt-2 text-xs text-zinc-300">
                Name your guide, run a quick ritual prompt, and build a persistent GPT relationship tuned to your style while preserving a secure, privacy-first session.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...QUICK_RITUAL_PROMPTS, ...activePromptPack].map((prompt) => (
                  <button
                    key={`hero-${prompt.label}`}
                    onClick={() => applyRitualPrompt(prompt.value)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 ${selectedTheme.actionTone}`}
                    title={`Load ritual: ${prompt.label}`}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 p-3">
              <label className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-200/90" htmlFor="guide-name-input">
                Guide Name
              </label>
              <input
                id="guide-name-input"
                value={guideName}
                onChange={(event) => setGuideName(normalizeGuideName(event.target.value) || "Trader")}
                className="mt-2 w-full rounded-lg border border-cyan-400/30 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
                placeholder="e.g. Oracle Nyx"
                maxLength={24}
              />

              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-300">Style</label>
                    <select
                      value={responseStyle}
                      onChange={(event) => setResponseStyle(event.target.value as ResponseStyle)}
                      className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white"
                      title="Choose assistant response style"
                    >
                      <option value="coach">Coach</option>
                      <option value="concise">Concise</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-300">Risk</label>
                    <select
                      value={riskStance}
                      onChange={(event) => setRiskStance(event.target.value as RiskStance)}
                      className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white"
                      title="Choose risk stance"
                    >
                      <option value="guarded">Guarded</option>
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-300">Persona Preset</label>
                  <select
                    value={personaPreset}
                    onChange={(event) => setPersonaPreset(event.target.value as PersonaPresetId)}
                    className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white"
                    title="Choose assistant persona preset"
                  >
                    {PERSONA_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-zinc-400">{selectedPersona.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-300">Focus Symbol</label>
                    <input
                      value={focusSymbol}
                      onChange={(event) => setFocusSymbol(normalizeSymbol(event.target.value) || "SOL")}
                      className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white"
                      placeholder="SOL"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-300">Intent</label>
                    <input
                      value={sessionIntent}
                      onChange={(event) => setSessionIntent(event.target.value.slice(0, 72))}
                      className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white"
                      placeholder="Build disciplined consistency"
                      maxLength={72}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-300">
                  <span>Relationship Tier</span>
                  <span className="text-cyan-300">{relationshipTier}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-900/80">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${relationshipScore}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="h-1.5 rounded-full bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-300"
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span>{secureSessionLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                  <Lock className="h-3.5 w-3.5 text-cyan-300" />
                  <span>{modeLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
                  <span>Regime: {detectedMarketRegime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Feature Interface */}
            <div className="lg:col-span-8">
              <div className="theme-panel min-h-[500px] flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                {isCharging && (
                  <div className="absolute inset-0 z-50 backdrop-blur-xl bg-black/80 flex flex-col items-center justify-center p-8 text-center border border-cyan-500/20">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
                      <ShieldAlert className="w-20 h-20 text-cyan-500 relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Neural Limit Reached</h3>
                    <p className="text-zinc-400 max-w-sm mb-10 text-sm leading-relaxed">
                      Your 3 free neural sessions have been consumed. To continue accessing uncensored AI models and real-time market pickers, settle a micro-transaction of <span className="text-cyan-400 font-bold">{PAYMENT_AMOUNT_HAX} $HAX</span> or <span className="text-cyan-400 font-bold">{PAYMENT_AMOUNT_SOL} SOL</span>.
                    </p>
                    <div className="flex flex-col gap-4 w-full max-w-md">
                      {!connected ? (
                        <div className="flex-1 flex justify-center">
                          <WalletButton />
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={handlePayment}
                            disabled={isPaying}
                            className="w-full px-8 py-4 bg-cyan-500 text-black font-black rounded-2xl text-xs hover:bg-white hover:scale-[1.02] transition-all uppercase italic flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-50"
                          >
                            {isPaying ? (
                              <>
                                <RotateCw className="w-4 h-4 animate-spin" />
                                Verifying_On_Chain...
                              </>
                            ) : (
                              <>
                                <Coins className="w-4 h-4" />
                                Pay_{PAYMENT_AMOUNT_HAX}_$HAX
                              </>
                            )}
                          </button>
                          <button
                            onClick={handlePayment}
                            disabled={isPaying}
                            className="w-full px-8 py-4 bg-zinc-900 border border-white/10 text-white font-black rounded-2xl text-xs hover:border-cyan-500/50 transition-all uppercase italic flex items-center justify-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Alternative:_{PAYMENT_AMOUNT_SOL}_SOL
                          </button>
                        </>
                      )}
                      <a
                        href={`https://jup.ag/swap/SOL-${HAX_TOKEN_CONFIG.SYMBOL}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded-2xl text-[10px] hover:bg-emerald-500/20 transition-all uppercase italic text-center"
                      >
                        Buy_$HAX_on_DEX
                      </a>
                    </div>
                    <p className="mt-8 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Secure_SSL_Encrypted_Handshake</p>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {activeTab === "CHAT" && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex-1 flex flex-col p-6 h-full"
                    >
                      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                        <div className="rounded-xl border border-white/10 bg-[rgba(10,14,18,0.75)] px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase">
                            <span className="text-cyan-200">Guide: {guideName}</span>
                            <span className="text-fuchsia-200">Bond {relationshipScore}%</span>
                            <span className="text-emerald-200">Secure Layer: Active</span>
                          </div>
                        </div>

                        {branchTrail.length > 0 && (
                          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">Branch Timeline</p>
                              <button
                                type="button"
                                onClick={() => setBranchTrail([])}
                                className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-400 hover:border-red-300/30"
                                title="Clear branch history"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="mb-2 rounded-lg border border-white/10 bg-black/30 px-2 py-2">
                              <svg viewBox="0 0 300 56" className="h-14 w-full" role="img" aria-label="Branch mini map">
                                <path
                                  d={branchGraphEntries
                                    .map((entry, idx) => {
                                      const x = 20 + idx * 38;
                                      const y = entry.kind === "edit-retry" ? 18 : 38;
                                      return `${idx === 0 ? "M" : "L"}${x} ${y}`;
                                    })
                                    .join(" ")}
                                  stroke="rgba(34,211,238,0.55)"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeLinecap="round"
                                />
                                {branchGraphEntries.map((entry, idx) => {
                                  const x = 20 + idx * 38;
                                  const y = entry.kind === "edit-retry" ? 18 : 38;
                                  return (
                                    <motion.circle
                                      key={entry.id}
                                      cx={x}
                                      cy={y}
                                      r={idx === branchGraphEntries.length - 1 ? 5 : 4}
                                      fill={entry.kind === "edit-retry" ? "rgba(232,121,249,0.95)" : "rgba(34,211,238,0.95)"}
                                      initial={{ scale: 0.8, opacity: 0.6 }}
                                      animate={{ scale: [0.9, 1.12, 0.96], opacity: [0.65, 1, 0.85] }}
                                      transition={{ duration: 1.6, repeat: Infinity, delay: idx * 0.06 }}
                                    />
                                  );
                                })}
                              </svg>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {branchTrail.slice(0, 6).map((entry) => (
                                <button
                                  key={entry.id}
                                  type="button"
                                  onClick={() => setChatInput(entry.preview)}
                                  className="rounded-full border border-cyan-300/20 bg-cyan-500/5 px-2.5 py-1 text-left text-[10px] text-cyan-100 hover:border-cyan-300/40"
                                  title="Load branch prompt into input"
                                >
                                  {entry.kind === "edit-retry" ? "EDIT" : "RETRY"} • #{entry.fromIndex + 1}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-2.5">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">Replay Mode</p>
                                <span className="text-[9px] font-mono text-zinc-500">
                                  {replayEntries.length > 0 ? `${Math.min(replayCursor + 1, replayEntries.length)} / ${replayEntries.length}` : "0 / 0"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => stepReplay(-1)}
                                  disabled={replayEntries.length === 0 || replayCursor <= 0}
                                  className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[9px] uppercase text-zinc-300 disabled:opacity-50"
                                  title="Previous branch snapshot"
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  onClick={() => stepReplay(1)}
                                  disabled={replayEntries.length === 0 || replayCursor >= replayEntries.length - 1}
                                  className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[9px] uppercase text-zinc-300 disabled:opacity-50"
                                  title="Next branch snapshot"
                                >
                                  Next
                                </button>
                                <button
                                  type="button"
                                  onClick={() => restoreReplayEntry(activeReplayEntry)}
                                  disabled={!activeReplayEntry}
                                  className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[9px] uppercase text-cyan-100 disabled:opacity-50"
                                  title="Restore selected snapshot into chat input"
                                >
                                  Restore
                                </button>
                              </div>

                              {activeReplayEntry ? (
                                <div className="mt-2 rounded-md border border-white/10 bg-black/40 p-2">
                                  <p className="text-[9px] font-mono uppercase text-zinc-400">
                                    {activeReplayEntry.kind === "edit-retry" ? "EDIT BRANCH" : "RETRY BRANCH"} • #{activeReplayEntry.fromIndex + 1}
                                  </p>
                                  <p className="mt-1 text-[10px] text-zinc-200 line-clamp-2">{activeReplayEntry.preview}</p>
                                </div>
                              ) : (
                                <p className="mt-2 text-[10px] text-zinc-500">No branch snapshots yet.</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={startNewChat}
                              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-100"
                              title="Start a fresh chat"
                            >
                              <Eraser className="h-3.5 w-3.5" />
                              New Chat
                            </button>
                            <button
                              type="button"
                              onClick={regenerateLastResponse}
                              disabled={isChatLoading}
                              className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-100 disabled:opacity-60"
                              title="Regenerate the latest response"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Regenerate
                            </button>
                            <button
                              type="button"
                              onClick={copyLastReply}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100"
                              title="Copy the last assistant reply"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy Reply
                            </button>
                            <button
                              type="button"
                              onClick={rememberLastPrompt}
                              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-100"
                              title="Store latest user prompt as session memory"
                            >
                              <Brain className="h-3.5 w-3.5" />
                              Remember Prompt
                            </button>
                            <button
                              type="button"
                              onClick={pinCurrentFocus}
                              className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-100"
                              title="Pin current focus and intent"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              Pin Focus
                            </button>
                            <button
                              type="button"
                              onClick={exportTranscript}
                              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100"
                              title="Export this chat transcript"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Export Chat
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsPromptLibraryOpen((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-100"
                              title="Toggle prompt library drawer"
                            >
                              <List className="h-3.5 w-3.5" />
                              Prompt Library
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCommandPaletteOpen(true);
                                setActiveTab("CHAT");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-100"
                              title="Open command palette (Ctrl/Cmd + K)"
                            >
                              <Command className="h-3.5 w-3.5" />
                              Command Palette
                            </button>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] text-zinc-300">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              {responseStyle.toUpperCase()} • {riskStance.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-cyan-400/20 bg-[rgba(6,10,16,0.82)] px-3 py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-200">Phase 4 · Session Continuity</p>
                            <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
                              {sessionPresets.length} presets
                            </span>
                          </div>

                          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                            <input
                              value={sessionPresetName}
                              onChange={(event) => setSessionPresetName(event.target.value.slice(0, 42))}
                              placeholder="Preset name (optional)"
                              className="rounded-md border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-cyan-300/55"
                            />
                            <button
                              type="button"
                              onClick={createSessionPreset}
                              className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100 hover:border-cyan-300/55"
                            >
                              Save Preset
                            </button>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={exportSessionSnapshot}
                              className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-100"
                            >
                              Export Snapshot
                            </button>
                            <button
                              type="button"
                              onClick={importSessionSnapshotFromPrompt}
                              className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-fuchsia-100"
                            >
                              Import Snapshot
                            </button>
                          </div>

                          {sessionPresets.length > 0 ? (
                            <div className="mt-2 space-y-1.5">
                              {sessionPresets.slice(0, 6).map((preset) => (
                                <div
                                  key={preset.id}
                                  className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/35 px-2.5 py-1.5"
                                >
                                  <button
                                    type="button"
                                    onClick={() => applySessionPreset(preset)}
                                    className="min-w-0 flex-1 truncate text-left text-[10px] font-semibold text-cyan-100"
                                    title={`${preset.personaPreset} • ${preset.focusSymbol} • ${preset.responseStyle}`}
                                  >
                                    {preset.name}
                                  </button>
                                  <span className="rounded-full border border-white/15 bg-black/30 px-1.5 py-0.5 text-[9px] uppercase text-zinc-400">
                                    {preset.personaPreset}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => deleteSessionPreset(preset.id)}
                                    className="rounded-full border border-rose-300/25 bg-rose-500/10 p-1 text-rose-200 hover:border-rose-300/45"
                                    aria-label={`Delete preset ${preset.name}`}
                                    title="Delete preset"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-[10px] text-zinc-500">No presets saved yet. Save one to instantly restore your full operator setup.</p>
                          )}
                        </div>

                        <div className="rounded-xl border border-fuchsia-400/20 bg-[rgba(12,8,20,0.82)] px-3 py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-fuchsia-200">Phase 5 · Workspace Timeline</p>
                            <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
                              {workspaceSnapshots.length} snapshots
                            </span>
                          </div>

                          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                            <input
                              value={workspaceSnapshotName}
                              onChange={(event) => setWorkspaceSnapshotName(event.target.value.slice(0, 56))}
                              placeholder="Snapshot label (optional)"
                              className="rounded-md border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-fuchsia-300/55"
                            />
                            <button
                              type="button"
                              onClick={() => createWorkspaceSnapshot()}
                              className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-fuchsia-100"
                            >
                              Capture
                            </button>
                            <button
                              type="button"
                              onClick={restorePreviousWorkspaceSnapshot}
                              className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
                            >
                              Undo
                            </button>
                          </div>

                          {workspaceSnapshots.length > 0 ? (
                            <div className="mt-2 space-y-1.5">
                              {workspaceSnapshots.slice(0, 8).map((snapshot) => (
                                <div
                                  key={snapshot.id}
                                  className={`rounded-md border px-2.5 py-1.5 ${
                                    selectedWorkspaceSnapshot?.id === snapshot.id
                                      ? "border-fuchsia-300/40 bg-fuchsia-500/10"
                                      : "border-white/10 bg-black/35"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWorkspaceSnapshotId(snapshot.id)}
                                      className="min-w-0 flex-1 truncate text-left text-[10px] font-semibold text-fuchsia-100"
                                      title={`v${snapshot.version} • ${new Date(snapshot.createdAt).toLocaleString()}`}
                                    >
                                      v{snapshot.version} • {snapshot.name}
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => restoreWorkspaceSnapshot(snapshot)}
                                        className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] uppercase text-cyan-100"
                                        title="Restore this snapshot"
                                      >
                                        Restore
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteWorkspaceSnapshot(snapshot.id)}
                                        className="rounded-full border border-rose-300/25 bg-rose-500/10 p-1 text-rose-200 hover:border-rose-300/45"
                                        aria-label={`Delete workspace snapshot ${snapshot.name}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-[9px] text-zinc-500">{new Date(snapshot.createdAt).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-[10px] text-zinc-500">No timeline snapshots yet. Capture one before risky edits and experiments.</p>
                          )}

                          {selectedWorkspaceSnapshot && selectedWorkspaceSnapshotDiff && (
                            <div className="mt-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Diff preview vs live workspace</p>
                                <span className="rounded-full border border-white/15 bg-black/30 px-1.5 py-0.5 text-[9px] text-zinc-300">
                                  {selectedWorkspaceSnapshot.name}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-[9px]">
                                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-zinc-300">
                                  Settings changed: {selectedWorkspaceSnapshotDiff.changedSettings.length}
                                </span>
                                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-zinc-300">
                                  Prompt packs Δ {selectedWorkspaceSnapshotDiff.customPromptDelta}
                                </span>
                                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-zinc-300">
                                  Memory Δ {selectedWorkspaceSnapshotDiff.memoryDelta}
                                </span>
                                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-zinc-300">
                                  Presets Δ {selectedWorkspaceSnapshotDiff.presetsDelta}
                                </span>
                              </div>
                              {selectedWorkspaceSnapshotDiff.changedSettings.length > 0 ? (
                                <p className="mt-1 text-[10px] text-zinc-400">
                                  {selectedWorkspaceSnapshotDiff.changedSettings.join(", ")}
                                </p>
                              ) : (
                                <p className="mt-1 text-[10px] text-zinc-500">No settings drift from current workspace.</p>
                              )}
                            </div>
                          )}
                        </div>

                        <HubSitewideNeuralSmartness
                          neuralVaultCount={neuralVaultCount}
                          datasetName={datasetName}
                          onDatasetNameChange={setDatasetName}
                          datasetRows={datasetRows}
                          onDatasetRowsChange={setDatasetRows}
                          datasetNotes={datasetNotes}
                          onDatasetNotesChange={setDatasetNotes}
                          onSaveDataset={saveDatasetNeuralArtifact}
                          behaviorLabel={behaviorLabel}
                          onBehaviorLabelChange={setBehaviorLabel}
                          behaviorObservation={behaviorObservation}
                          onBehaviorObservationChange={setBehaviorObservation}
                          onSaveBehavior={saveUserBehaviorNeuralArtifact}
                          tickerBehaviorSymbol={tickerBehaviorSymbol}
                          onTickerBehaviorSymbolChange={setTickerBehaviorSymbol}
                          tickerBehaviorPattern={tickerBehaviorPattern}
                          onTickerBehaviorPatternChange={setTickerBehaviorPattern}
                          onSaveTickerPattern={saveTickerBehaviorNeuralArtifact}
                          learningEnvironmentName={learningEnvironmentName}
                          onLearningEnvironmentNameChange={setLearningEnvironmentName}
                          learningEnvironmentHypothesis={learningEnvironmentHypothesis}
                          onLearningEnvironmentHypothesisChange={setLearningEnvironmentHypothesis}
                          onSaveEnvironment={saveLearningEnvironmentNeuralArtifact}
                          onExportNeuralVault={exportNeuralVaultDataset}
                        />

                        <HubVideoAiInfusion
                          videoSourceUrl={videoSourceUrl}
                          onVideoSourceUrlChange={setVideoSourceUrl}
                          videoInstructionGoal={videoInstructionGoal}
                          onVideoInstructionGoalChange={setVideoInstructionGoal}
                          videoCue={videoCue}
                          onVideoCueChange={setVideoCue}
                          onInsertBrief={insertVideoInstructionBrief}
                          onStoreBrief={rememberVideoInstructionBrief}
                        />

                        <HubWebsiteSocialAutopilot
                          websiteSourceUrl={websiteSourceUrl}
                          onWebsiteSourceUrlChange={setWebsiteSourceUrl}
                          autopilotFocus={autopilotFocus}
                          onAutopilotFocusChange={setAutopilotFocus}
                          socialChannels={SOCIAL_AUTOPILOT_CHANNELS}
                          autopilotChannels={autopilotChannels}
                          onToggleAutopilotChannel={toggleAutopilotChannel}
                          isGeneratingAutopilot={isGeneratingAutopilot}
                          onGenerateDrafts={generateWebsiteAutopilotDraft}
                          autopilotOpsLoading={autopilotOpsLoading}
                          onSaveToOps={saveCurrentAutopilotDraftToOps}
                          onRefreshOps={refreshAutopilotOps}
                          autopilotOpsDraftId={autopilotOpsDraftId}
                          onAutopilotOpsDraftIdChange={setAutopilotOpsDraftId}
                          autopilotScheduleAt={autopilotScheduleAt}
                          onAutopilotScheduleAtChange={setAutopilotScheduleAt}
                          onSubmitApproval={submitAutopilotForApproval}
                          onApproveDraft={approveAutopilotDraft}
                          onScheduleQueue={scheduleAutopilotDraft}
                          onPublishNow={publishAutopilotNow}
                          onRunDueJobs={runDueAutopilotJobs}
                          autopilotImpressions={autopilotImpressions}
                          onAutopilotImpressionsChange={setAutopilotImpressions}
                          autopilotEngagements={autopilotEngagements}
                          onAutopilotEngagementsChange={setAutopilotEngagements}
                          autopilotClicks={autopilotClicks}
                          onAutopilotClicksChange={setAutopilotClicks}
                          onSyncMetrics={syncAutopilotPerformance}
                          autopilotOpsSnapshot={autopilotOpsSnapshot}
                        />

                        <HubCompetitiveEdgeLab
                          focusSymbol={focusSymbol}
                          riskStance={riskStance}
                          marketRegime={detectedMarketRegime}
                          onInjectBrief={insertCompetitiveEdgeBrief}
                          onStoreBrief={rememberCompetitiveEdgeBrief}
                        />

                        <HubPostTradeForensics
                          focusSymbol={focusSymbol}
                          riskStance={riskStance}
                          marketRegime={detectedMarketRegime}
                          onInjectBrief={insertPostTradeForensicsBrief}
                          onStoreBrief={rememberPostTradeForensicsBrief}
                        />

                        <HubRegimeShiftSentinel
                          focusSymbol={focusSymbol}
                          riskStance={riskStance}
                          marketRegime={detectedMarketRegime}
                          onInjectBrief={insertRegimeShiftSentinelBrief}
                          onStoreBrief={rememberRegimeShiftSentinelBrief}
                        />

                        <HubExecutionLatencyGuard
                          focusSymbol={focusSymbol}
                          riskStance={riskStance}
                          marketRegime={detectedMarketRegime}
                          onInjectBrief={insertExecutionLatencyGuardBrief}
                          onStoreBrief={rememberExecutionLatencyGuardBrief}
                        />

                        <HubSessionDriftGovernor
                          focusSymbol={focusSymbol}
                          riskStance={riskStance}
                          marketRegime={detectedMarketRegime}
                          onInjectBrief={insertSessionDriftGovernorBrief}
                          onStoreBrief={rememberSessionDriftGovernorBrief}
                        />

                        <HubCapitalPreservationCircuit
                          focusSymbol={focusSymbol}
                          riskStance={riskStance}
                          marketRegime={detectedMarketRegime}
                          onInjectBrief={insertCapitalPreservationCircuitBrief}
                          onStoreBrief={rememberCapitalPreservationCircuitBrief}
                        />

                        <div className="rounded-xl border border-white/10 bg-[rgba(10,14,20,0.72)] px-3 py-3">
                          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-zinc-300">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
                            Memory Cards
                            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] text-zinc-400">
                              {longMemoryCards.length} pinned • {shortMemoryCards.length} session
                            </span>
                          </div>

                          {memoryCards.length === 0 ? (
                            <p className="text-[11px] text-zinc-500">No memories stored yet. Save prompts or pin your focus.</p>
                          ) : (
                            <div className="space-y-2">
                              {memoryCards.map((card) => (
                                <div key={card.id} className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    {editingMemoryId === card.id ? (
                                      <div className="w-full space-y-2">
                                        <label className="sr-only" htmlFor={`memory-title-${card.id}`}>Edit memory title</label>
                                        <input
                                          id={`memory-title-${card.id}`}
                                          value={editingMemoryTitle}
                                          onChange={(event) => setEditingMemoryTitle(event.target.value.slice(0, 40))}
                                          className="w-full rounded-md border border-cyan-400/25 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300"
                                          title="Edit memory title"
                                          placeholder="Memory title"
                                        />
                                        <label className="sr-only" htmlFor={`memory-content-${card.id}`}>Edit memory content</label>
                                        <textarea
                                          id={`memory-content-${card.id}`}
                                          value={editingMemoryContent}
                                          onChange={(event) => setEditingMemoryContent(event.target.value.slice(0, 160))}
                                          rows={3}
                                          className="w-full rounded-md border border-cyan-400/25 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300"
                                          title="Edit memory content"
                                          placeholder="Memory content"
                                        />
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => saveEditMemory(card.id)}
                                            className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[9px] uppercase text-cyan-100"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelEditMemory}
                                            className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[9px] uppercase text-zinc-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => applyMemoryToInput(card)}
                                        className="text-left"
                                        title="Inject memory into chat input"
                                      >
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-100">{card.title}</p>
                                        <p className="text-[11px] text-zinc-300">{card.content}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                          <span className="text-[9px] uppercase tracking-wide text-zinc-400">Confidence {getDecayedConfidence(card)}%</span>
                                          <div className="h-1 w-20 overflow-hidden rounded-full bg-zinc-800">
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${getDecayedConfidence(card)}%` }}
                                              transition={{ duration: 0.35, ease: "easeOut" }}
                                              className="h-1 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400"
                                            />
                                          </div>
                                        </div>
                                      </button>
                                    )}

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => beginEditMemory(card)}
                                        className="rounded-full border border-white/15 bg-black/40 p-1 text-zinc-300 hover:border-cyan-300/40"
                                        title="Edit memory card"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleMemoryScope(card.id)}
                                        className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300 hover:border-cyan-300/40"
                                        title={card.scope === "long" ? "Move to session memory" : "Pin as long-term memory"}
                                      >
                                        {card.scope === "long" ? "Pinned" : "Session"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteMemoryCard(card.id)}
                                        className="rounded-full border border-red-300/20 bg-red-500/10 p-1 text-red-200 hover:border-red-300/40"
                                        title="Delete memory card"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                              msg.role === 'user'
                                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100"
                                : "bg-zinc-900/80 border border-white/5 text-zinc-300"
                            }`}>
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="font-mono text-[10px] opacity-50 uppercase tracking-widest">{msg.role === "assistant" ? `${guideName}_guide` : msg.role}</p>
                                {msg.role === "user" && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => beginEditMessage(i)}
                                      className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] uppercase text-zinc-300 hover:border-cyan-300/40"
                                      title="Edit this prompt"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => retryFromMessageIndex(i)}
                                      className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] uppercase text-zinc-300 hover:border-fuchsia-300/40"
                                      title="Retry from this prompt"
                                    >
                                      Retry
                                    </button>
                                  </div>
                                )}
                                {msg.role === "assistant" && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void transformAssistantMessage(i, "improve");
                                      }}
                                      className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] uppercase text-cyan-100 hover:border-cyan-300/50"
                                      title="Improve this response"
                                    >
                                      Improve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void transformAssistantMessage(i, "rewrite");
                                      }}
                                      className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-2 py-0.5 text-[9px] uppercase text-fuchsia-100 hover:border-fuchsia-300/50"
                                      title="Rewrite this response"
                                    >
                                      Rewrite
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void transformAssistantMessage(i, "shorten");
                                      }}
                                      className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] uppercase text-emerald-100 hover:border-emerald-300/50"
                                      title="Shorten this response"
                                    >
                                      Shorten
                                    </button>
                                  </div>
                                )}
                              </div>

                              {editingMessageIndex === i ? (
                                <div className="space-y-2">
                                  <label className="sr-only" htmlFor={`edit-user-message-${i}`}>
                                    Edit user message
                                  </label>
                                  <textarea
                                    id={`edit-user-message-${i}`}
                                    value={editingMessageDraft}
                                    onChange={(event) => setEditingMessageDraft(event.target.value.slice(0, 500))}
                                    className="w-full rounded-lg border border-cyan-400/35 bg-black/50 px-2.5 py-2 text-[12px] text-white outline-none focus:border-cyan-300"
                                    rows={3}
                                    placeholder="Refine your prompt and retry"
                                    title="Edit prompt text"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={saveEditAndRetry}
                                      className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold text-cyan-100"
                                    >
                                      Save + Retry
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditMessage}
                                      className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] text-zinc-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-zinc-900/80 border border-white/5 p-4 rounded-2xl">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-150" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-100/85">
                        {workflowTask === "chat"
                          ? "Try: I&apos;m new to trading. Give me a safe beginner plan for this week."
                          : workflowTask === "generate"
                            ? "Generate mode tip: ask for exact format (e.g. 5 bullets + 1 action)."
                            : workflowTask === "summarize"
                              ? "Summarize mode tip: paste the full source text for stronger compression quality."
                              : "Q&A mode tip: add context below so answers stay grounded and factual."}
                      </div>

                      <div className="mb-3 rounded-xl border border-white/10 bg-[rgba(8,12,18,0.82)] px-3 py-3">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-300">Operator Workflow Dock</p>
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] uppercase text-cyan-100">Industry-grade controls</span>
                        </div>

                        <div className="mb-2 flex flex-wrap gap-2">
                          {LLM_WORKFLOW_TASKS.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => setWorkflowTask(task.id)}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                workflowTask === task.id
                                  ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                                  : "border-white/15 bg-black/35 text-zinc-300 hover:border-cyan-300/30"
                              }`}
                              title={task.hint}
                            >
                              {task.label}
                            </button>
                          ))}
                        </div>

                        <div className="grid gap-2 md:grid-cols-[1fr_1fr]">
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400">Depth</p>
                            <div className="mt-1 flex gap-1.5">
                              {(["quick", "balanced", "deep"] as LlmDepth[]).map((depth) => (
                                <button
                                  key={depth}
                                  type="button"
                                  onClick={() => setWorkflowDepth(depth)}
                                  className={`rounded-full border px-2 py-0.5 text-[9px] uppercase ${
                                    workflowDepth === depth
                                      ? "border-fuchsia-300/40 bg-fuchsia-500/15 text-fuchsia-100"
                                      : "border-white/15 bg-black/35 text-zinc-300"
                                  }`}
                                >
                                  {depth}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="workflow-creativity-range">
                              <span>Creativity</span>
                              <span>{workflowCreativity}%</span>
                            </label>
                            <input
                              id="workflow-creativity-range"
                              type="range"
                              min={20}
                              max={100}
                              value={workflowCreativity}
                              onChange={(event) => setWorkflowCreativity(Number(event.target.value))}
                              className="mt-1 w-full accent-cyan-400"
                              title="Adjust generation creativity"
                            />
                          </div>
                        </div>

                        {workflowTask === "qa" && (
                          <div className="mt-2">
                            <label className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400" htmlFor="workflow-context-input">
                              Context (used by Q&A task)
                            </label>
                            <textarea
                              id="workflow-context-input"
                              value={workflowContext}
                              onChange={(event) => setWorkflowContext(event.target.value.slice(0, 2000))}
                              rows={3}
                              className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2.5 py-2 text-[11px] text-white outline-none focus:border-cyan-300/60"
                              placeholder="Paste source context here so answers remain grounded."
                            />
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {LLM_WORKFLOW_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => applyWorkflowTemplate(template.id)}
                              className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-100"
                              title={`Load ${template.label} template`}
                            >
                              {template.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isPromptLibraryOpen && (
                        <div className="mb-3 rounded-xl border border-cyan-400/20 bg-[rgba(6,10,16,0.84)] px-3 py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-200">Prompt Library</p>
                            <button
                              type="button"
                              onClick={() => setIsPromptLibraryOpen(false)}
                              className="rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[9px] uppercase text-zinc-300"
                            >
                              Close
                            </button>
                          </div>

                          <div className="mb-3 rounded-lg border border-white/10 bg-black/35 px-2.5 py-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Build Custom Prompt Pack</p>
                              <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] text-cyan-100">
                                Saved: {customPromptPacks.length}
                              </span>
                            </div>
                            <div className="grid gap-2 md:grid-cols-[1fr_120px]">
                              <input
                                value={customPromptTitle}
                                onChange={(event) => setCustomPromptTitle(event.target.value.slice(0, 40))}
                                placeholder="Prompt title"
                                className="rounded-md border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-cyan-300/50"
                              />
                              <select
                                value={customPromptCategory}
                                onChange={(event) => setCustomPromptCategory(event.target.value as PromptLibraryCategory)}
                                aria-label="Custom prompt category"
                                className="rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-cyan-300/50"
                              >
                                <option value="trading">Trading</option>
                                <option value="content">Content</option>
                                <option value="ops">Ops</option>
                              </select>
                            </div>
                            <textarea
                              value={customPromptValue}
                              onChange={(event) => setCustomPromptValue(event.target.value.slice(0, 500))}
                              rows={3}
                              placeholder="Prompt body"
                              className="mt-2 w-full rounded-md border border-white/15 bg-black/50 px-2.5 py-2 text-[11px] text-white outline-none focus:border-cyan-300/50"
                            />
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-[9px] text-zinc-500">Max 24 custom packs • 500 chars each</p>
                              <button
                                type="button"
                                onClick={createCustomPromptPack}
                                className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 hover:border-emerald-300/50"
                              >
                                Save Pack
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {(["trading", "content", "ops"] as const).map((category) => (
                              <div key={category} className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-2">
                                <p className="mb-1 text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">{category}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {promptLibraryEntries.filter((item) => item.category === category).map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => addPromptLibraryItem(item)}
                                      className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-100 hover:border-cyan-300/45"
                                      title={item.value}
                                    >
                                      {item.title}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {customPromptPacks.length > 0 && (
                            <div className="mt-3 rounded-lg border border-fuchsia-300/20 bg-fuchsia-500/5 px-2.5 py-2">
                              <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.12em] text-fuchsia-200">Manage Custom Packs</p>
                              <div className="space-y-1.5">
                                {customPromptPacks.slice(0, 8).map((item) => (
                                  <div
                                    key={`manage-${item.id}`}
                                    className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/35 px-2 py-1.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => addPromptLibraryItem(item)}
                                      className="min-w-0 flex-1 truncate text-left text-[10px] font-semibold text-fuchsia-100"
                                      title={item.value}
                                    >
                                      {item.title}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeCustomPromptPack(item.id)}
                                      className="rounded-full border border-rose-300/25 bg-rose-500/10 p-1 text-rose-200 hover:border-rose-300/45"
                                      aria-label={`Remove ${item.title}`}
                                      title="Remove custom prompt"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mb-3 flex flex-wrap gap-2">
                        {[...activePromptPack, ...QUICK_RITUAL_PROMPTS].map((prompt) => (
                          <button
                            key={`chat-${prompt.label}`}
                            onClick={() => applyRitualPrompt(prompt.value)}
                            type="button"
                            className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold text-cyan-100 hover:border-cyan-300/60"
                            title={`Load ritual: ${prompt.label}`}
                          >
                            {prompt.label}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleSendMessage} className="relative">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask in plain language (example: What should I do first?)"
                          className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-all"
                        />
                        <button
                          type="submit"
                          aria-label="Send chat message"
                          title="Send chat message"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-cyan-500 rounded-xl flex items-center justify-center text-black hover:scale-105 transition-transform"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                      {filteredSlashCommands.length > 0 && (
                        <div className="mt-2 rounded-lg border border-white/10 bg-black/40 px-2 py-2">
                          <p className="mb-1 text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Slash commands</p>
                          <div className="space-y-1">
                            {filteredSlashCommands.slice(0, 6).map((command) => (
                              <button
                                key={command.id}
                                type="button"
                                onClick={() => applySlashCommand(command)}
                                className="flex w-full items-center justify-between rounded-md border border-white/10 bg-black/35 px-2 py-1 text-left hover:border-cyan-300/35"
                              >
                                <span className="text-[10px] font-semibold text-cyan-100">{command.label}</span>
                                <span className="text-[9px] text-zinc-400">{command.description}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {chatStatus && (
                        <p className="mt-3 text-[11px] text-cyan-300/80 font-mono">{chatStatus}</p>
                      )}
                      {qualitySnapshot && (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-zinc-300">
                            <span className="text-cyan-200">Response Scorecard</span>
                            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] text-zinc-400">
                              {qualitySnapshot.task.toUpperCase()} • {qualitySnapshot.model}
                            </span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {[
                              { label: "Clarity", value: qualitySnapshot.clarity, tone: "from-cyan-400 to-blue-400" },
                              { label: "Actionability", value: qualitySnapshot.actionability, tone: "from-emerald-400 to-teal-400" },
                              { label: "Risk Discipline", value: qualitySnapshot.riskDiscipline, tone: "from-fuchsia-400 to-purple-400" },
                            ].map((metric) => (
                              <div key={metric.label} className="rounded-lg border border-white/10 bg-black/35 px-2 py-1.5">
                                <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-300">
                                  <span>{metric.label}</span>
                                  <span>{metric.value}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-zinc-800/80">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.value}%` }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className={`h-1.5 rounded-full bg-gradient-to-r ${metric.tone}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                            <span className="rounded-full border border-white/10 bg-black/35 px-2 py-0.5">Latency: {qualitySnapshot.latencyMs}ms</span>
                            <span className="rounded-full border border-white/10 bg-black/35 px-2 py-0.5">Words: {qualitySnapshot.words}</span>
                            <span className="rounded-full border border-white/10 bg-black/35 px-2 py-0.5">Chars: {qualitySnapshot.chars}</span>
                          </div>
                        </div>
                      )}

                      {compareSnapshot && (
                        <div className="mt-3 rounded-xl border border-fuchsia-300/25 bg-[rgba(14,10,22,0.86)] px-3 py-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-fuchsia-200">Original vs Improved</p>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
                                {compareSnapshot.mode}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCompareSnapshot(null)}
                                className="rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[9px] uppercase text-zinc-300"
                              >
                                Close
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-2">
                              <p className="mb-1 text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-400">Original</p>
                              <p className="whitespace-pre-wrap text-[11px] text-zinc-200/90">{compareSnapshot.original}</p>
                            </div>
                            <div className="rounded-lg border border-fuchsia-300/25 bg-fuchsia-500/10 px-2.5 py-2">
                              <p className="mb-1 text-[9px] font-mono uppercase tracking-[0.12em] text-fuchsia-200">Improved</p>
                              <p className="whitespace-pre-wrap text-[11px] text-fuchsia-50">{compareSnapshot.transformed}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "IMAGE_GEN" && (
                    <HubImageWorkspace
                      imageModels={imageModels}
                      selectedModel={selectedModel}
                      onSelectModel={setSelectedModel}
                      imgPrompt={imgPrompt}
                      onImgPromptChange={setImgPrompt}
                      onGenerateImage={handleGenerateImage}
                      isImgLoading={isImgLoading}
                      generatedImg={generatedImg}
                      imageStatus={imageStatus}
                    />
                  )}

                  {activeTab === "MARKET" && (
                    <HubMarketWorkspace
                      watchlist={watchlist}
                      marketTransport={marketTransport}
                      marketStatus={marketStatus}
                      marketFeedUpdatedAt={marketFeedUpdatedAt}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: AI Metrics & State */}
            <div className="lg:col-span-4 space-y-6">
              <HubMetricsRail isCharging={isCharging} relationshipTier={relationshipTier} />
            </div>
          </div>

        </div>
      </div>

      <HubCommandPalette
        isOpen={isCommandPaletteOpen}
        commandQuery={commandQuery}
        setCommandQuery={setCommandQuery}
        commandSelectionIndex={commandSelectionIndex}
        filteredEntries={filteredCommandPaletteEntries}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRunCommand={runPaletteCommand}
        onSetSelectionIndex={setCommandSelectionIndex}
      />
    </section>
  );
};
