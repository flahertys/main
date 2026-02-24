"use client";

import { WalletButton } from "@/components/counter/WalletButton";
import { HAX_TOKEN_CONFIG } from "@/lib/trading/hax-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bookmark,
  BookOpen,
  Brain,
  Coins,
  Copy,
  Cpu,
  Download,
  Eraser,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  Video,
  Wand2,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";

type HubTab = "CHAT" | "IMAGE_GEN" | "MARKET";
type ResponseStyle = "concise" | "coach" | "operator";
type RiskStance = "guarded" | "balanced" | "aggressive";
type PersonaPresetId = "mystic" | "analyst" | "mentor";
type MemoryScope = "short" | "long";
type SocialChannel = "youtube" | "discord" | "x" | "linkedin" | "instagram" | "facebook" | "telegram" | "tiktok";

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
const TREASURY_WALLET = "6v6iK8kS1DqXhP9P8s7W6zX5B9Q4p7L3k2j1i0h9g8f7";

const CHAT_MODELS = [
  {
    id: "mistralai/Mistral-7B-Instruct-v0.1",
    label: "🧠 Mistral 7B",
    hint: "Fast instruction model for general market + planning prompts",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    label: "⚡ Llama 3.1 8B",
    hint: "Balanced latency and reasoning depth",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    label: "🔮 Qwen 2.5 7B",
    hint: "Strong structured output for workflows",
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

  async function requestAssistantReply(userMsg: string, options?: { appendUser?: boolean; regenerate?: boolean }) {
    if (!userMsg.trim()) return;

    if (options?.appendUser) {
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    }

    setIsChatLoading(true);
    setChatStatus(options?.regenerate ? "Regenerating response..." : "");

    try {
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
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        if (typeof data?.model === "string") {
          setChatStatus(`Model: ${data.model}${typeof data?.provider === "string" ? ` • Provider: ${data.provider}` : ""}`);
        }
        incrementUsage();
      } else {
        const errorMessage =
          typeof data?.message === "string" && data.message.trim()
            ? data.message
            : typeof data?.error === "string" && data.error.trim()
              ? data.error
              : "AI temporarily unavailable. Please try again.";
        setMessages(prev => [...prev, { role: "assistant", content: `ERROR: ${errorMessage}` }]);
        setChatStatus("The assistant hit an issue. You can retry or switch models.");
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "ERROR: NEURAL_TIMEOUT" }]);
      setChatStatus("Network timeout. Please check connection and retry.");
    } finally {
      setIsChatLoading(false);
    }
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
  const [watchlist, setWatchlist] = useState([
    { symbol: "SOL", price: "142.50", change: "+4.2%", trend: "up" },
    { symbol: "HAX", price: "0.082", change: "+12.5%", trend: "up" },
    { symbol: "BTC", price: "64,210", change: "-1.2%", trend: "down" },
  ]);

  const marketTrendScore = watchlist.reduce((score, asset) => score + (asset.trend === "up" ? 1 : -1), 0);
  const detectedMarketRegime: "BULLISH" | "BEARISH" | "MIXED" = marketTrendScore >= 2 ? "BULLISH" : marketTrendScore <= -2 ? "BEARISH" : "MIXED";
  const activePromptPack = PERSONA_PROMPT_PACKS[personaPreset][detectedMarketRegime];
  const branchGraphEntries = branchTrail.slice(0, 8).reverse();
  const replayEntries = branchTrail;
  const activeReplayEntry = replayEntries.length > 0 ? replayEntries[Math.min(replayCursor, replayEntries.length - 1)] : null;

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
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] text-zinc-300">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              {responseStyle.toUpperCase()} • {riskStance.toUpperCase()}
                            </span>
                          </div>
                        </div>

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
                                onChange={(event) => setVideoSourceUrl(event.target.value.slice(0, 300))}
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
                                onChange={(event) => setVideoInstructionGoal(event.target.value.slice(0, 140))}
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
                              onChange={(event) => setVideoCue(event.target.value.slice(0, 140))}
                              className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
                              placeholder="e.g. Timestamp 03:20 risk management section"
                              maxLength={140}
                            />
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={insertVideoInstructionBrief}
                              className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100"
                              title="Insert video instruction brief into chat input"
                            >
                              Insert Brief
                            </button>
                            <button
                              type="button"
                              onClick={rememberVideoInstructionBrief}
                              className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-fuchsia-100"
                              title="Store video instruction brief in long-term memory"
                            >
                              Store Brief
                            </button>
                          </div>
                        </div>

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
                              onChange={(event) => setWebsiteSourceUrl(event.target.value.slice(0, 300))}
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
                              onChange={(event) => setAutopilotFocus(event.target.value.slice(0, 80))}
                              className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-300/60"
                              placeholder="cross-platform brand growth"
                              maxLength={80}
                            />
                          </div>

                          <div className="mt-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-400">Channels</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {SOCIAL_AUTOPILOT_CHANNELS.map((channel) => {
                                const enabled = autopilotChannels.includes(channel.id);
                                return (
                                  <button
                                    key={channel.id}
                                    type="button"
                                    onClick={() => toggleAutopilotChannel(channel.id)}
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
                              onClick={generateWebsiteAutopilotDraft}
                              disabled={isGeneratingAutopilot}
                              className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100 disabled:opacity-60"
                              title="Generate multi-platform social drafts from website content"
                            >
                              {isGeneratingAutopilot ? "Generating..." : "Generate Drafts"}
                            </button>
                            <button
                              type="button"
                              onClick={saveCurrentAutopilotDraftToOps}
                              disabled={autopilotOpsLoading}
                              className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-cyan-100 disabled:opacity-60"
                              title="Create a managed social ops draft from the generated content"
                            >
                              Save to Ops
                            </button>
                            <button
                              type="button"
                              onClick={refreshAutopilotOps}
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
                                onChange={(event) => setAutopilotOpsDraftId(event.target.value.slice(0, 80))}
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
                                onChange={(event) => setAutopilotScheduleAt(event.target.value)}
                                className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
                              />
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={submitAutopilotForApproval}
                              disabled={autopilotOpsLoading}
                              className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-fuchsia-100 disabled:opacity-60"
                              title="Move draft into pending approval"
                            >
                              Submit Approval
                            </button>
                            <button
                              type="button"
                              onClick={approveAutopilotDraft}
                              disabled={autopilotOpsLoading}
                              className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-100 disabled:opacity-60"
                              title="Approve draft for publishing"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={scheduleAutopilotDraft}
                              disabled={autopilotOpsLoading}
                              className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-amber-100 disabled:opacity-60"
                              title="Schedule channel queue jobs"
                            >
                              Schedule Queue
                            </button>
                            <button
                              type="button"
                              onClick={publishAutopilotNow}
                              disabled={autopilotOpsLoading}
                              className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase text-red-100 disabled:opacity-60"
                              title="Publish now through configured connectors"
                            >
                              Publish Now
                            </button>
                            <button
                              type="button"
                              onClick={runDueAutopilotJobs}
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
                                onChange={(event) => setAutopilotImpressions(event.target.value.replace(/\D/g, "").slice(0, 9))}
                                className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
                                placeholder="Impressions"
                              />
                              <input
                                value={autopilotEngagements}
                                onChange={(event) => setAutopilotEngagements(event.target.value.replace(/\D/g, "").slice(0, 9))}
                                className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
                                placeholder="Engagements"
                              />
                              <input
                                value={autopilotClicks}
                                onChange={(event) => setAutopilotClicks(event.target.value.replace(/\D/g, "").slice(0, 9))}
                                className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
                                placeholder="Clicks"
                              />
                              <button
                                type="button"
                                onClick={syncAutopilotPerformance}
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
                              {SOCIAL_AUTOPILOT_CHANNELS.map((channel) => {
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
                        Try: I&apos;m new to trading. Give me a safe beginner plan for this week.
                      </div>

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
                      {chatStatus && (
                        <p className="mt-3 text-[11px] text-cyan-300/80 font-mono">{chatStatus}</p>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "IMAGE_GEN" && (
                    <motion.div
                      key="img"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-6 h-full flex flex-col gap-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {imageModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              selectedModel === model.id
                                ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Cpu className={`w-4 h-4 ${selectedModel === model.id ? 'text-cyan-400' : 'text-zinc-600'}`} />
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                                selectedModel === model.id ? 'border-cyan-500/30 text-cyan-400' : 'border-white/5 text-zinc-600'
                              }`}>
                                {model.label}
                              </span>
                            </div>
                            <p className="text-xs font-black text-white uppercase italic">{model.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">{model.provider}</p>
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <textarea
                          value={imgPrompt}
                          onChange={(e) => setImgPrompt(e.target.value)}
                          placeholder="Describe the image you want in one simple sentence..."
                          className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-all resize-none"
                        />
                        <button
                          onClick={handleGenerateImage}
                          disabled={isImgLoading || !imgPrompt.trim()}
                          className="absolute bottom-4 right-4 px-6 py-2 bg-cyan-500 text-black font-black text-xs rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2 uppercase italic"
                        >
                          {isImgLoading ? <RotateCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          Visualize
                        </button>
                      </div>

                      <div className="flex-1 min-h-[200px] rounded-2xl border border-white/5 bg-zinc-950/50 flex items-center justify-center relative overflow-hidden">
                        {generatedImg ? (
                          <motion.img
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={generatedImg}
                            className="w-full h-full object-cover"
                            alt="Generated neural construct"
                          />
                        ) : (
                          <div className="text-center">
                            <Sparkles className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Awaiting_Neural_Input</p>
                          </div>
                        )}
                        {isImgLoading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                              <p className="text-[10px] font-mono text-cyan-500 uppercase animate-pulse">Processing_Diffusion_Steps</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {imageStatus && (
                        <p className="text-[11px] text-cyan-300/80 font-mono">{imageStatus}</p>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "MARKET" && (
                    <motion.div
                      key="market"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-6 h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-lg font-black text-white italic uppercase">Market Picker</h3>
                          <p className="text-[10px] font-mono text-zinc-500">REAL-TIME_ASSET_DISCOVERY</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search_Ticker..."
                              className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none w-40"
                            />
                          </div>
                          <button className="flex min-h-[44px] items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500 text-black text-[10px] font-black uppercase italic hover:scale-105 transition-transform">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {watchlist.map((asset) => (
                          <div key={asset.symbol} className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-cyan-500/30 hover:bg-zinc-900/60 transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-black text-sm text-white border border-white/5 shadow-xl group-hover:scale-110 transition-transform">
                                {asset.symbol[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-white uppercase italic">{asset.symbol}</p>
                                  {asset.symbol === "HAX" && <Sparkles className="w-3 h-3 text-cyan-400" />}
                                </div>
                                <p className="text-[10px] text-zinc-600 font-mono">SECURE_SETTLEMENT</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono text-white mb-1">${asset.price}</p>
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${asset.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {asset.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                {asset.change}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2">
                          <Zap className="w-4 h-4 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                              <Zap className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-xs text-emerald-500 uppercase font-black italic mb-1 tracking-widest">Neural Alpha Picker</p>
                              <p className="text-xs text-zinc-400 max-w-[280px]">New institutional signal for <span className="text-white font-bold italic">$HAX/SOL</span> detected with 94% confidence.</p>
                            </div>
                          </div>
                          <button className="px-8 py-3 bg-emerald-500 text-black text-[10px] font-black rounded-xl uppercase italic hover:bg-white transition-all shadow-lg">
                            Fetch_Alpha
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: AI Metrics & State */}
            <div className="lg:col-span-4 space-y-6">
              <div className="theme-panel p-6 border-cyan-500/20">
                <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-[0.2em] mb-6">Neural_Environment</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2 uppercase">
                      <span>Compute Load</span>
                      <span className="text-cyan-400">42.8%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "42.8%" }}
                        className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2 uppercase">
                      <span>Context Memory</span>
                      <span className="text-purple-400">98.2%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "98.2%" }}
                        className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                    <ShieldAlert className="w-4 h-4 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">Open Responses: On</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">Trust Profile: {relationshipTier}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                    <Sparkles className="w-4 h-4 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">Creative Tools: On</span>
                  </div>
                </div>
              </div>

              <div className="theme-panel p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase italic mb-2">Power User Access</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Unlock unlimited neural generations, HFT signals, and custom fine-tuned models by staking $HAX tokens.
                </p>
                <button className="w-full py-3 bg-cyan-500 text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-colors">
                  Review_Staking_Options
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
