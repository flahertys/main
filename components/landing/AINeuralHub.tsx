"use client";

import { useArtifactPreferences } from "@/components/landing/hub/hooks/useArtifactPreferences";
import { useBranchReplayControls } from "@/components/landing/hub/hooks/useBranchReplayControls";
import { useBriefComposerActions } from "@/components/landing/hub/hooks/useBriefComposerActions";
import { useChatCommandControls } from "@/components/landing/hub/hooks/useChatCommandControls";
import { useChatUtilityActions } from "@/components/landing/hub/hooks/useChatUtilityActions";
import { useCommandPaletteControls } from "@/components/landing/hub/hooks/useCommandPaletteControls";
import { useCorePreferences } from "@/components/landing/hub/hooks/useCorePreferences";
import { useMarketFeed } from "@/components/landing/hub/hooks/useMarketFeed";
import { useMemoryCardControls } from "@/components/landing/hub/hooks/useMemoryCardControls";
import { useMessageBranchControls } from "@/components/landing/hub/hooks/useMessageBranchControls";
import { useNeuralArtifactWorkflows } from "@/components/landing/hub/hooks/useNeuralArtifactWorkflows";
import { useNeuralSessionPersistence } from "@/components/landing/hub/hooks/useNeuralSessionPersistence";
import { useNeuralVaultCount } from "@/components/landing/hub/hooks/useNeuralVaultCount";
import { useSessionContinuityControls } from "@/components/landing/hub/hooks/useSessionContinuityControls";
import { useUsageLimit } from "@/components/landing/hub/hooks/useUsageLimit";
import { useWebsiteAutopilotWorkflows } from "@/components/landing/hub/hooks/useWebsiteAutopilotWorkflows";
import { useWorkspaceTimelinePersistence } from "@/components/landing/hub/hooks/useWorkspaceTimelinePersistence";
import { HubCapitalPreservationCircuit } from "@/components/landing/hub/HubCapitalPreservationCircuit";
import { HubCommandPalette } from "@/components/landing/hub/HubCommandPalette";
import { HubCompetitiveEdgeLab } from "@/components/landing/hub/HubCompetitiveEdgeLab";
import { HubConvictionCalibrationEngine } from "@/components/landing/hub/HubConvictionCalibrationEngine";
import { HubExecutionLatencyGuard } from "@/components/landing/hub/HubExecutionLatencyGuard";
import { HubImageWorkspace } from "@/components/landing/hub/HubImageWorkspace";
import { HubMarketWorkspace } from "@/components/landing/hub/HubMarketWorkspace";
import { HubMetricsRail } from "@/components/landing/hub/HubMetricsRail";
import { HubOpportunityCostRadar } from "@/components/landing/hub/HubOpportunityCostRadar";
import { HubPostTradeForensics } from "@/components/landing/hub/HubPostTradeForensics";
import { HubRegimeShiftSentinel } from "@/components/landing/hub/HubRegimeShiftSentinel";
import { HubSessionDriftGovernor } from "@/components/landing/hub/HubSessionDriftGovernor";
import { HubShell } from "@/components/landing/hub/HubShell";
import { HubSitewideNeuralSmartness } from "@/components/landing/hub/HubSitewideNeuralSmartness";
import { HubVideoAiInfusion } from "@/components/landing/hub/HubVideoAiInfusion";
import { HubWebsiteSocialAutopilot } from "@/components/landing/hub/HubWebsiteSocialAutopilot";
import { parseImportedSessionSnapshot } from "@/components/landing/hub/utils/sessionSnapshotParser";
import { HubAutomationWorkspace } from "@/components/landing/hub/workspaces/HubAutomationWorkspace";
import { HubChatWorkspace } from "@/components/landing/hub/workspaces/HubChatWorkspace";
import { HubCreateWorkspace } from "@/components/landing/hub/workspaces/HubCreateWorkspace";
import { HubLibraryWorkspace } from "@/components/landing/hub/workspaces/HubLibraryWorkspace";
import { HubMarketWorkspaceView } from "@/components/landing/hub/workspaces/HubMarketWorkspaceView";
import {
  getLocalNeuralVault,
} from "@/lib/ai/site-neural-memory";
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
import { useCallback, useEffect, useRef, useState } from "react";

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

const FREE_USAGE_LIMIT = 3;
const PAYMENT_AMOUNT_SOL = 0.05;
const PAYMENT_AMOUNT_HAX = 100;

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

const CHAT_MODEL_IDS = CHAT_MODELS.map((model) => model.id);

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

const SOCIAL_AUTOPILOT_CHANNEL_IDS = SOCIAL_AUTOPILOT_CHANNELS.map((channel) => channel.id);

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
  const [beginnerFocusMode, setBeginnerFocusMode] = useState(true);
  const [showOperatorDock, setShowOperatorDock] = useState(false);
  const [latestReplyPulse, setLatestReplyPulse] = useState(false);
  const { usageCount, isCharging, incrementUsage, resetUsage } = useUsageLimit(FREE_USAGE_LIMIT);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedChatModel, setSelectedChatModel] = useState<string>(CHAT_MODELS[0].id);
  const [openModeEnabled, setOpenModeEnabled] = useState(true);
  const [guideName, setGuideName] = useState("Trader");
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("coach");
  const [riskStance, setRiskStance] = useState<RiskStance>("balanced");
  const [focusSymbol, setFocusSymbol] = useState("HAX");
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
  const {
    memoryCards,
    setMemoryCards,
    editingMemoryId,
    editingMemoryTitle,
    setEditingMemoryTitle,
    editingMemoryContent,
    setEditingMemoryContent,
    addMemoryCard,
    beginEditMemory,
    cancelEditMemory,
    saveEditMemory,
    deleteMemoryCard,
    toggleMemoryScope,
    boostMemoryCard,
  } = useMemoryCardControls();
  const {
    branchTrail,
    setBranchTrail,
    clearBranchTrail,
    editingMessageIndex,
    editingMessageDraft,
    setEditingMessageDraft,
    beginEditMessage,
    cancelEditMessage,
    pruneConversationAtUser,
    logBranch,
  } = useMessageBranchControls();
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
  const [tickerBehaviorSymbol, setTickerBehaviorSymbol] = useState("HAX");
  const [tickerBehaviorPattern, setTickerBehaviorPattern] = useState("");
  const [learningEnvironmentName, setLearningEnvironmentName] = useState("macro event drill");
  const [learningEnvironmentHypothesis, setLearningEnvironmentHypothesis] = useState("");
  const [connected, setConnected] = useState(false);
  const [chainAccountId, setChainAccountId] = useState("");
  const { neuralVaultCount, refreshNeuralVaultCount } = useNeuralVaultCount(getLocalNeuralVault);

  useCorePreferences({
    validModelIds: CHAT_MODEL_IDS,
    values: {
      selectedChatModel,
      guideName,
      responseStyle,
      riskStance,
      focusSymbol,
      sessionIntent,
      personaPreset,
      isPromptLibraryOpen,
      beginnerFocusMode,
      showOperatorDock,
    },
    setters: {
      setSelectedChatModel,
      setGuideName,
      setResponseStyle,
      setRiskStance,
      setFocusSymbol,
      setSessionIntent,
      setPersonaPreset,
      setIsPromptLibraryOpen,
      setBeginnerFocusMode,
      setShowOperatorDock,
    },
  });

  useCommandPaletteControls({
    commandQuery,
    isCommandPaletteOpen,
    setCommandSelectionIndex,
    onOpenPalette: () => {
      setActiveTab("CHAT");
      setCommandQuery("");
      setIsCommandPaletteOpen(true);
    },
    onClosePalette: () => {
      setIsCommandPaletteOpen(false);
    },
  });

  useArtifactPreferences({
    values: {
      datasetName,
      datasetRows,
      datasetNotes,
      behaviorLabel,
      behaviorObservation,
      tickerBehaviorSymbol,
      tickerBehaviorPattern,
      learningEnvironmentName,
      learningEnvironmentHypothesis,
    },
    setters: {
      setDatasetName,
      setDatasetRows,
      setDatasetNotes,
      setBehaviorLabel,
      setBehaviorObservation,
      setTickerBehaviorSymbol,
      setTickerBehaviorPattern,
      setLearningEnvironmentName,
      setLearningEnvironmentHypothesis,
    },
  });

  const hydrateMemoryCardsFromStorage = useCallback((storedCards: string) => {
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
  }, []);

  const hydrateBranchTrailFromStorage = useCallback((storedBranches: string) => {
    try {
      const parsed = JSON.parse(storedBranches) as BranchTrailEntry[];
      if (Array.isArray(parsed)) {
        setBranchTrail(parsed.slice(0, 18));
      }
    } catch {
      // ignore malformed local storage payload
    }
  }, []);

  useNeuralSessionPersistence({
    values: {
      videoSourceUrl,
      videoInstructionGoal,
      videoCue,
      websiteSourceUrl,
      autopilotFocus,
      autopilotChannels,
      autopilotOpsDraftId,
      autopilotScheduleAt,
      autopilotImpressions,
      autopilotEngagements,
      autopilotClicks,
      memoryCards,
      branchTrail,
    },
    setters: {
      setVideoSourceUrl,
      setVideoInstructionGoal,
      setVideoCue,
      setWebsiteSourceUrl,
      setAutopilotFocus,
      setAutopilotChannels,
      setAutopilotOpsDraftId,
      setAutopilotScheduleAt,
      setAutopilotImpressions,
      setAutopilotEngagements,
      setAutopilotClicks,
    },
    socialChannelIds: SOCIAL_AUTOPILOT_CHANNEL_IDS,
    onHydrateMemoryCards: hydrateMemoryCardsFromStorage,
    onHydrateBranchTrail: hydrateBranchTrailFromStorage,
  });

  useWorkspaceTimelinePersistence({
    values: {
      customPromptPacks,
      sessionPresets,
      workspaceSnapshots,
    },
    setters: {
      setCustomPromptPacks,
      setSessionPresets,
      setWorkspaceSnapshots,
      setSelectedWorkspaceSnapshotId,
    },
  });

  const { replayCursor, replayEntries, activeReplayEntry, stepReplay, restoreReplayEntry } = useBranchReplayControls({
    branchTrail,
    onRestoreEntry: (entry) => {
      setActiveTab("CHAT");
      setChatInput(entry.preview);
      setChatStatus(`Loaded ${entry.kind === "edit-retry" ? "edited" : "retry"} branch #${entry.fromIndex + 1} into input.`);
    },
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handlePayment = async () => {
    if (!connected || !chainAccountId) return;
    setIsPaying(true);
    try {
      // Logic for actual chain-native settlement would go here.
      // For now we mock success after a delay to show UI flow
      await new Promise(r => setTimeout(r, 2000));

      resetUsage();
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
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const latestMessageAnchorRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(1);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<string>("");
  const [workflowTask, setWorkflowTask] = useState<LlmWorkflowTask>("chat");
  const [workflowDepth, setWorkflowDepth] = useState<LlmDepth>("balanced");
  const [workflowCreativity, setWorkflowCreativity] = useState(65);
  const [workflowContext, setWorkflowContext] = useState("");
  const [qualitySnapshot, setQualitySnapshot] = useState<ResponseQualitySnapshot | null>(null);
  const { watchlist, marketStatus, marketFeedUpdatedAt, marketTransport } = useMarketFeed();

  useEffect(() => {
    if (activeTab !== "CHAT") return;

    const hasNewMessage = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;
    if (!hasNewMessage) return;

    latestMessageAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setLatestReplyPulse(true);
    const timeoutId = window.setTimeout(() => setLatestReplyPulse(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [messages, activeTab]);

  const relationshipScore = Math.min(100, 18 + usageCount * 20 + Math.min(messages.length, 12) * 4);
  const hasUserMessages = messages.some((msg) => msg.role === "user");
  const relationshipTier = relationshipScore >= 85
    ? "INNER_CIRCLE"
    : relationshipScore >= 60
      ? "TRUSTED_DISCIPLE"
      : relationshipScore >= 35
        ? "GUIDED_EXPLORER"
        : "NEW_SEEKER";

  const secureSessionLabel = connected ? "Chain-account signed secure session" : "Anon sandbox session (privacy-first)";
  const effectiveOpenMode = openModeEnabled;
  const modeLabel = effectiveOpenMode ? "Mystic Open Mode" : "Guardian Standard Mode";
  const selectedPersona = PERSONA_PRESETS.find((preset) => preset.id === personaPreset) || PERSONA_PRESETS[0];
  const selectedTheme = PERSONA_THEME[personaPreset];
  const shortMemoryCards = memoryCards.filter((card) => card.scope === "short").slice(0, 4);
  const longMemoryCards = memoryCards.filter((card) => card.scope === "long").slice(0, 4);

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
      "",
      `Persona: ${selectedPersona.label}. ${selectedPersona.prompt}`,
      "Build long-term trust: remember user preference cues from this session and keep tone calm, secure, and empowering.",
      styleInstruction,
      riskInstruction,
      `Session focus symbol: ${focusSymbol || "HAX"}.`,
      `Session intention: ${sessionIntent || "Build disciplined consistency"}.`,
      `Detected market regime: ${detectedMarketRegime}.`,
      videoContext,
      memoryContext,
      "Never promise returns. Always include risk controls, invalidation logic, and one concrete next step.",
      effectiveOpenMode
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

  const {
    createSessionPreset,
    applySessionPreset,
    deleteSessionPreset,
    createWorkspaceSnapshot,
    restoreWorkspaceSnapshot,
    restorePreviousWorkspaceSnapshot,
    deleteWorkspaceSnapshot,
    selectedWorkspaceSnapshot,
    selectedWorkspaceSnapshotDiff,
  } = useSessionContinuityControls({
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
    customPromptPacks,
    memoryCards,
    sessionPresets,
    sessionPresetName,
    workspaceSnapshots,
    workspaceSnapshotName,
    selectedWorkspaceSnapshotId,
    setSessionPresets,
    setSessionPresetName,
    setWorkspaceSnapshots,
    setWorkspaceSnapshotName,
    setSelectedWorkspaceSnapshotId,
    setCustomPromptPacks,
    setMemoryCards,
    sessionSetters: {
      setGuideName,
      setResponseStyle,
      setRiskStance,
      setFocusSymbol,
      setSessionIntent,
      setPersonaPreset,
      setWorkflowTask,
      setWorkflowDepth,
      setWorkflowCreativity,
    },
    normalizeSymbol,
    onActivateChat: () => setActiveTab("CHAT"),
    setChatStatus,
  });

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

  const {
    saveDatasetNeuralArtifact,
    saveUserBehaviorNeuralArtifact,
    saveTickerBehaviorNeuralArtifact,
    saveLearningEnvironmentNeuralArtifact,
    exportNeuralVaultDataset,
  } = useNeuralArtifactWorkflows({
    datasetName,
    datasetRows,
    datasetNotes,
    behaviorLabel,
    behaviorObservation,
    tickerBehaviorSymbol,
    tickerBehaviorPattern,
    learningEnvironmentName,
    learningEnvironmentHypothesis,
    buildHubUserId,
    refreshNeuralVaultCount,
    setChatStatus,
  });

  function importSessionSnapshotFromPrompt() {
    const raw = window.prompt("Paste exported session snapshot JSON:");
    if (!raw || !raw.trim()) return;

    const parsed = parseImportedSessionSnapshot(raw);
    if (!parsed) {
      setChatStatus("Invalid snapshot JSON. Import aborted.");
      return;
    }

    if (parsed.settings) {
      const settings = parsed.settings;
      if (settings.guideName) {
        setGuideName(settings.guideName);
      }
      if (settings.responseStyle) {
        setResponseStyle(settings.responseStyle);
      }
      if (settings.riskStance) {
        setRiskStance(settings.riskStance);
      }
      if (settings.focusSymbol) {
        setFocusSymbol(normalizeSymbol(settings.focusSymbol) || "HAX");
      }
      if (settings.sessionIntent) {
        setSessionIntent(settings.sessionIntent);
      }
      if (settings.personaPreset) {
        setPersonaPreset(settings.personaPreset);
      }
      if (settings.workflowTask) {
        setWorkflowTask(settings.workflowTask);
      }
      if (settings.workflowDepth) {
        setWorkflowDepth(settings.workflowDepth);
      }
      if (typeof settings.workflowCreativity === "number") {
        setWorkflowCreativity(settings.workflowCreativity);
      }
    }

    if (parsed.customPromptPacks) {
      setCustomPromptPacks(parsed.customPromptPacks);
    }

    if (parsed.memoryCards) {
      setMemoryCards(parsed.memoryCards);
    }

    if (parsed.sessionPresets) {
      setSessionPresets(parsed.sessionPresets);
    }

    setChatStatus("Session snapshot imported.");
  }

  const { startNewChat, copyLastReply, rememberLastPrompt, pinCurrentFocus } = useChatUtilityActions({
    guideName,
    sessionIntent,
    focusSymbol,
    messages,
    setMessages,
    setChatInput,
    setChatStatus,
    clearBranchTrail,
    cancelEditMessage,
    addMemoryCard,
  });

  const promptLibraryEntries = [...PROMPT_LIBRARY, ...customPromptPacks];
  const { filteredSlashCommands, filteredCommandPaletteEntries, applySlashCommand, runPaletteCommand, tryExecuteSlashInput } =
    useChatCommandControls({
      chatInput,
      commandQuery,
      commandSelectionIndex,
      isCommandPaletteOpen,
      setCommandSelectionIndex,
      setChatInput,
      setChatStatus,
      setIsCommandPaletteOpen,
      setCommandQuery,
      onStartNewChat: startNewChat,
      onTogglePromptLibrary: () => setIsPromptLibraryOpen((prev) => !prev),
      onSetWorkflowTask: setWorkflowTask,
      onSetActiveTab: setActiveTab,
      onSaveSessionPreset: createSessionPreset,
      onExportSession: exportSessionSnapshot,
      onImportSession: importSessionSnapshotFromPrompt,
      onCreateWorkspaceSnapshot: createWorkspaceSnapshot,
      onRestorePreviousWorkspaceSnapshot: restorePreviousWorkspaceSnapshot,
      onCopyLastReply: copyLastReply,
      onExportTranscript: exportTranscript,
    });

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

  function applyMemoryToInput(card: MemoryCard) {
    const suffix = card.scope === "long" ? "(pinned memory)" : "(session memory)";
    setChatInput((prev) => `${prev.trim()} ${card.content} ${suffix}`.trim().slice(0, 500));
    boostMemoryCard(card.id);
    setActiveTab("CHAT");
  }

  function handleSaveEditMemory(id: string) {
    const ok = saveEditMemory(id);
    if (!ok) {
      setChatStatus("Memory title and content are required.");
      return;
    }
    setChatStatus("Memory card updated.");
  }

  const {
    insertVideoInstructionBrief,
    rememberVideoInstructionBrief,
    insertCompetitiveEdgeBrief,
    rememberCompetitiveEdgeBrief,
    insertPostTradeForensicsBrief,
    rememberPostTradeForensicsBrief,
    insertRegimeShiftSentinelBrief,
    rememberRegimeShiftSentinelBrief,
    insertExecutionLatencyGuardBrief,
    rememberExecutionLatencyGuardBrief,
    insertSessionDriftGovernorBrief,
    rememberSessionDriftGovernorBrief,
    insertCapitalPreservationCircuitBrief,
    rememberCapitalPreservationCircuitBrief,
    insertOpportunityCostRadarBrief,
    rememberOpportunityCostRadarBrief,
    insertConvictionCalibrationBrief,
    rememberConvictionCalibrationBrief,
  } = useBriefComposerActions({
    focusSymbol,
    videoSourceUrl,
    setChatInput,
    setChatStatus,
    onActivateChat: () => setActiveTab("CHAT"),
    addMemoryCard,
    normalizeVideoUrl,
    buildVideoInstructionBrief,
  });

  const {
    generateWebsiteAutopilotDraft,
    refreshAutopilotOps,
    saveCurrentAutopilotDraftToOps,
    submitAutopilotForApproval,
    approveAutopilotDraft,
    scheduleAutopilotDraft,
    publishAutopilotNow,
    runDueAutopilotJobs,
    syncAutopilotPerformance,
  } = useWebsiteAutopilotWorkflows({
    websiteSourceUrl,
    autopilotFocus,
    autopilotChannels,
    latestAutopilotDraft,
    autopilotOpsDraftId,
    autopilotScheduleAt,
    autopilotImpressions,
    autopilotEngagements,
    autopilotClicks,
    setIsGeneratingAutopilot,
    setLatestAutopilotDraft,
    setAutopilotOpsLoading,
    setAutopilotOpsSnapshot,
    setAutopilotOpsDraftId,
    setChatInput,
    setChatStatus,
    onActivateChat: () => setActiveTab("CHAT"),
    addMemoryCard,
    normalizeVideoUrl,
    buildAutopilotDraftBlock,
  });

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
            tier: effectiveOpenMode ? "UNCENSORED" : "STANDARD",
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
    const retryMessage = pruneConversationAtUser(messages, index, undefined, setMessages);
    if (!retryMessage) {
      setChatStatus("Could not retry from that message.");
      return;
    }
    logBranch("retry", index, retryMessage);
    await requestAssistantReply(retryMessage, { regenerate: true });
  }

  async function saveEditAndRetry() {
    if (editingMessageIndex === null || isChatLoading || isCharging) return;
    const updated = pruneConversationAtUser(messages, editingMessageIndex, editingMessageDraft, setMessages);
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
    { id: "GROK_X_VISION", name: "Grok X Vision", provider: "xAI-inspired", label: "REASON+VISUAL" },
  ];

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || isImgLoading || isCharging) return;
    setIsImgLoading(true);
    setGeneratedImg(null);
    setImageStatus("");

    const runtimeByModel: Record<string, { style: "general" | "trading" | "nft" | "hero" | "xai_grok"; odinProfile?: "standard" | "alpha" | "overclock" }> = {
      NEURAL_DIFF_V4: { style: "general", odinProfile: "standard" },
      FLUX_CORE_X: { style: "hero", odinProfile: "alpha" },
      ASTRA_LINK: { style: "nft", odinProfile: "alpha" },
      GROK_X_VISION: { style: "xai_grok", odinProfile: "overclock" },
    };

    const selectedRuntime = runtimeByModel[selectedModel] ?? { style: "general" as const, odinProfile: "standard" as const };
    const runtime = selectedRuntime;
    const safePrompt = imgPrompt;

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: safePrompt,
          style: runtime.style,
          odinProfile: runtime.odinProfile,
          model: selectedModel,
          safetyMode: effectiveOpenMode ? "open" : "standard",
        })
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.url) {
        setGeneratedImg(data.url);
        if (data?.fallback) {
          setImageStatus(`Preview mode: ${data?.warning || "provider unavailable"}`);
        } else if (typeof data?.model === "string") {
          setImageStatus(`Generated with ${data.model} • profile ${runtime.style}`);
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
  const latestAssistantReverseIndex = [...messages].reverse().findIndex((item) => item.role === "assistant");
  const latestAssistantIndex = latestAssistantReverseIndex === -1 ? -1 : messages.length - 1 - latestAssistantReverseIndex;

  return (
    <HubShell background={<NeuralBackground />}>

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
                className={`px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black tracking-[0.12em] sm:tracking-widest transition-all ${activeTab === tab
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
            {effectiveOpenMode ? "UNCENSORED_ON" : "STANDARD_MODE"}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/25 bg-[rgba(8,14,20,0.75)] px-4 py-3 text-[11px] text-cyan-100/85">
        <p className="font-semibold uppercase tracking-wide">Quick start</p>
        <p className="mt-1">
          1) Open <strong>AI_CHAT</strong>, 2) ask your goal in simple words, 3) use IMAGE_TOOL or MARKET_TOOLS as needed.
        </p>
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
                  Your 3 free neural sessions have been consumed. To continue accessing uncensored AI models and real-time market pickers, settle a micro-transaction of <span className="text-cyan-400 font-bold">{PAYMENT_AMOUNT_HAX} $HAX</span> or <span className="text-cyan-400 font-bold">{PAYMENT_AMOUNT_SOL} native units</span>.
                </p>
                <div className="flex flex-col gap-4 w-full max-w-md">
                  {!connected ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const generated = `acct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
                          setChainAccountId(generated);
                          setConnected(true);
                          setChatStatus(`Connected chain account: ${generated}`);
                        }}
                        className="w-full px-8 py-4 bg-cyan-500 text-black font-black rounded-2xl text-xs hover:bg-white hover:scale-[1.02] transition-all uppercase italic flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                      >
                        Connect_Chain_Account
                      </button>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                        Chain-agnostic session connector (replace with production signer)
                      </p>
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
                        Alternative:_{PAYMENT_AMOUNT_SOL}_Native
                      </button>
                    </>
                  )}
                  <a
                    href={process.env.NEXT_PUBLIC_HAX_SWAP_URL || "https://tradehax.example/swap"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded-2xl text-[10px] hover:bg-emerald-500/20 transition-all uppercase italic text-center"
                  >
                    Open_$HAX_Swap
                  </a>
                </div>
                <p className="mt-8 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Secure_SSL_Encrypted_Handshake</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === "CHAT" && (
                <HubChatWorkspace>
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col p-6 h-full"
                  >
                    <div ref={chatViewportRef} className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                      <div className="rounded-xl border border-white/10 bg-[rgba(10,14,18,0.75)] px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase">
                          <span className="text-cyan-200">Guide: {guideName}</span>
                          <span className="text-fuchsia-200">Bond {relationshipScore}%</span>
                          <span className="text-emerald-200">Secure Layer: Active</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">Experience Mode</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setBeginnerFocusMode((prev) => !prev);
                                if (beginnerFocusMode) {
                                  setShowOperatorDock(false);
                                } else {
                                  setShowOperatorDock(true);
                                }
                              }}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${beginnerFocusMode
                                  ? "border-cyan-300/35 bg-cyan-500/10 text-cyan-100"
                                  : "border-fuchsia-300/35 bg-fuchsia-500/10 text-fuchsia-100"
                                }`}
                            >
                              {beginnerFocusMode ? "Beginner Focus" : "Pro Operator"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowOperatorDock((prev) => !prev)}
                              className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase text-zinc-200"
                              title="Open or close advanced operator panels"
                            >
                              {showOperatorDock ? "Hide Advanced" : "Show Advanced"}
                            </button>
                            <button
                              type="button"
                              onClick={() => latestMessageAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                              className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-100"
                              title="Jump to latest assistant reply"
                            >
                              Jump to Reply
                            </button>
                          </div>
                        </div>
                        {beginnerFocusMode && !showOperatorDock && (
                          <p className="mt-2 text-[11px] text-zinc-400">
                            Beginner Focus keeps the conversation visible first. Use <strong>Show Advanced</strong> whenever you want full operator controls.
                          </p>
                        )}
                      </div>

                      {(!beginnerFocusMode || showOperatorDock) && (
                        <>

                          {branchTrail.length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-mono uppercase tracking-wide text-zinc-300">Branch Timeline</p>
                                <button
                                  type="button"
                                  onClick={clearBranchTrail}
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
                                  setCommandQuery("");
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
                                    className={`rounded-md border px-2.5 py-1.5 ${selectedWorkspaceSnapshot?.id === snapshot.id
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

                          <HubAutomationWorkspace>
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
                          </HubAutomationWorkspace>

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

                          <HubOpportunityCostRadar
                            focusSymbol={focusSymbol}
                            riskStance={riskStance}
                            marketRegime={detectedMarketRegime}
                            onInjectBrief={insertOpportunityCostRadarBrief}
                            onStoreBrief={rememberOpportunityCostRadarBrief}
                          />

                          <HubConvictionCalibrationEngine
                            focusSymbol={focusSymbol}
                            riskStance={riskStance}
                            marketRegime={detectedMarketRegime}
                            onInjectBrief={insertConvictionCalibrationBrief}
                            onStoreBrief={rememberConvictionCalibrationBrief}
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
                                              onClick={() => handleSaveEditMemory(card.id)}
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

                        </>
                      )}

                      {messages.map((msg, i) => {
                        const isLatestAssistant = msg.role === "assistant" && i === latestAssistantIndex;
                        return (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100"
                                : `bg-zinc-900/80 border ${isLatestAssistant && latestReplyPulse ? "border-cyan-300/60 shadow-[0_0_20px_rgba(34,211,238,0.25)]" : "border-white/5"} text-zinc-300`
                              }`}>
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="font-mono text-[10px] opacity-50 uppercase tracking-widest">{msg.role === "assistant" ? `${guideName}_guide` : msg.role}</p>
                                {msg.role === "user" && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => beginEditMessage(messages, i)}
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
                        );
                      })}
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
                      <div ref={latestMessageAnchorRef} />
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

                    {!hasUserMessages && !isChatLoading && (
                      <div className="mb-3 rounded-xl border border-emerald-400/20 bg-[rgba(6,18,14,0.75)] px-3 py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-200">Quick Start Actions</p>
                          <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
                            1-click setup
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("CHAT");
                              setWorkflowTask("chat");
                              setChatInput("I&apos;m new to trading. Build a beginner-safe 7-day plan with strict risk limits and one daily checklist.");
                              setChatStatus("Starter plan loaded. Press send when ready.");
                            }}
                            className="rounded-full border border-emerald-300/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-100"
                          >
                            Start with Chat Plan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("IMAGE_GEN");
                              setImgPrompt("Create a clean, modern crypto market dashboard hero image with neon cyan accents and clear readability.");
                            }}
                            className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-semibold text-cyan-100"
                          >
                            Open Image Tool
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("MARKET");
                              setChatStatus("Switched to Market Tools.");
                            }}
                            className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/15 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-100"
                          >
                            Open Market Tools
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("CHAT");
                              setIsPromptLibraryOpen(true);
                              setChatStatus("Prompt Library opened.");
                            }}
                            className="rounded-full border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-100"
                          >
                            Browse Prompt Library
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("CHAT");
                              setChatInput("/help");
                              setChatStatus("Slash help ready. Press send.");
                            }}
                            className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-zinc-200"
                          >
                            Show Slash Help
                          </button>
                        </div>
                      </div>
                    )}

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
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${workflowTask === task.id
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
                                className={`rounded-full border px-2 py-0.5 text-[9px] uppercase ${workflowDepth === depth
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
                      <HubLibraryWorkspace>
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
                      </HubLibraryWorkspace>
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
                </HubChatWorkspace>
              )}

              {activeTab === "IMAGE_GEN" && (
                <HubCreateWorkspace>
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
                </HubCreateWorkspace>
              )}

              {activeTab === "MARKET" && (
                <HubMarketWorkspaceView>
                  <HubMarketWorkspace
                    watchlist={watchlist}
                    marketTransport={marketTransport}
                    marketStatus={marketStatus}
                    marketFeedUpdatedAt={marketFeedUpdatedAt}
                    focusSymbol={focusSymbol}
                  />
                </HubMarketWorkspaceView>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: AI Metrics & State */}
        <div className="lg:col-span-4 space-y-6">
          <HubMetricsRail isCharging={isCharging} relationshipTier={relationshipTier} />
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
    </HubShell>
  );
};
