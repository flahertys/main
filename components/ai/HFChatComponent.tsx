"use client";

import {
    Archive,
    ArrowUp,
    Compass,
    Copy,
    FileJson,
    FileText,
    Loader2,
    PanelLeft,
    Pencil,
    Pin,
    Plus,
    Search,
    Sparkles,
    Trash2,
    X
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  meta?: {
    step: number;
    mode: ChatMode;
    timestamp: number;
    predictionDomain?: "stock" | "crypto" | "kalshi" | "general";
    predictionConfidence?: number;
  };
}

type ChatMode = "navigator" | "custom" | "chat";

type PipelineMemory = {
  objective: string;
  selectedStep: number;
  mode: ChatMode;
  responseStyle: ResponseStyle;
  autoFallback: boolean;
  freedomMode: FreedomMode;
};

type ResponseStyle = "concise" | "coach" | "operator";
type FreedomMode = "uncensored" | "standard";
type PromptCategory = "onboarding" | "trading" | "content" | "ops";

type PinnedPrompt = {
  id: string;
  label: string;
  prompt: string;
  category: PromptCategory;
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  archived: boolean;
  messages: Message[];
  objective: string;
  selectedStep: number;
  mode: ChatMode;
  responseStyle: ResponseStyle;
  autoFallback: boolean;
  freedomMode: FreedomMode;
};

const PIPELINE_MEMORY_KEY = "tradehax-ai-pipeline-memory-v1";
const CHAT_SESSIONS_KEY = "tradehax-ai-chat-sessions-v1";
const PINNED_PROMPTS_KEY = "tradehax-ai-pinned-prompts-v1";

const MODE_META: Record<
  ChatMode,
  {
    label: string;
    description: string;
    endpoint: string;
  }
> = {
  navigator: {
    label: "Navigator",
    description: "Find where to go on TradeHax with clear next steps.",
    endpoint: "/api/ai/navigator",
  },
  custom: {
    label: "TradeHax Expert",
    description: "Use the site-tuned assistant for platform and workflow guidance.",
    endpoint: "/api/ai/custom",
  },
  chat: {
    label: "General Chat",
    description: "Open chat with retrieval + command fallback.",
    endpoint: "/api/ai/chat",
  },
};

const PIPELINE_STEPS = [
  {
    title: "Define goal",
    lane: "onboarding",
    starterPrompt: "I am new. What should I do first on TradeHax based on my goals?",
  },
  {
    title: "Get route plan",
    lane: "navigation",
    starterPrompt: "Give me the exact pages to visit in order and why.",
  },
  {
    title: "Execute task",
    lane: "execution",
    starterPrompt: "Walk me step-by-step through this task and what to click next.",
  },
  {
    title: "Next action",
    lane: "conversion",
    starterPrompt: "What is the smartest next action for me now?",
  },
] as const;

const QUICK_START_PROMPTS = [
  {
    label: "New user setup",
    prompt: "I am brand new. Give me a simple 10-minute setup checklist and where to click first.",
  },
  {
    label: "First trade plan",
    prompt: "Build me a beginner-friendly trade plan with risk limits and exact next steps.",
  },
  {
    label: "Portfolio check",
    prompt: "Review my portfolio process and give me a safer weekly routine I can follow.",
  },
  {
    label: "Pricing help",
    prompt: "Explain the lowest-cost plan for me and when I should upgrade.",
  },
] as const;

type DecisionSignals = {
  confidence: number;
  risk: number;
  priority: "High" | "Medium" | "Low";
  nextAction: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildSessionTitle(messages: Message[], fallback = "New session") {
  const firstUserMessage = messages.find((message) => message.role === "user")?.content?.trim();
  if (!firstUserMessage) return fallback;
  return firstUserMessage.length > 48
    ? `${firstUserMessage.slice(0, 48).trim()}…`
    : firstUserMessage;
}

function createEmptySession(overrides?: Partial<ChatSession>): ChatSession {
  const now = Date.now();
  return {
    id: `session-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New session",
    updatedAt: now,
    archived: false,
    messages: [],
    objective: "",
    selectedStep: 0,
    mode: "navigator",
    responseStyle: "coach",
    autoFallback: true,
    freedomMode: "uncensored",
    ...overrides,
  };
}

function sanitizePinnedPrompt(raw: unknown): PinnedPrompt | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<PinnedPrompt>;
  if (typeof item.id !== "string" || typeof item.label !== "string" || typeof item.prompt !== "string") {
    return null;
  }
  const category = item.category;
  if (category !== "onboarding" && category !== "trading" && category !== "content" && category !== "ops") {
    return null;
  }

  return {
    id: item.id,
    label: item.label.trim().slice(0, 40),
    prompt: item.prompt.trim().slice(0, 220),
    category,
  };
}

function scoreAssistantResponse(content: string, step: number, mode: ChatMode): DecisionSignals {
  const text = content.toLowerCase();
  const actionableMatches = (text.match(/\b(step|next|then|open|visit|click|start|do this|checklist)\b/g) || []).length;
  const uncertaintyMatches = (text.match(/\b(maybe|might|could|possibly|depends|uncertain|not sure)\b/g) || []).length;
  const riskMatches = (text.match(/\b(leverage|margin|all-in|borrow|high risk|volatile|liquidation)\b/g) || []).length;
  const safetyMatches = (text.match(/\b(risk|stop[- ]?loss|limit|safe|discipline|position size|conservative)\b/g) || []).length;
  const routeMatches = (text.match(/\/(ai|ai-hub|pricing|schedule|services|dashboard|trading)/g) || []).length;

  let confidence = 58 + actionableMatches * 6 + routeMatches * 5 + safetyMatches * 3 - uncertaintyMatches * 8;
  if (mode === "navigator") confidence += 5;
  if (step >= 2) confidence += 4;

  let risk = 34 + riskMatches * 9 + uncertaintyMatches * 5 - safetyMatches * 4;
  if (mode === "custom") risk -= 3;
  if (routeMatches > 0) risk -= 2;

  confidence = clamp(confidence, 25, 98);
  risk = clamp(risk, 5, 95);

  let priority: DecisionSignals["priority"] = "Medium";
  if (step >= 2 || routeMatches > 0 || actionableMatches >= 4) {
    priority = "High";
  }
  if (uncertaintyMatches >= 3 && actionableMatches <= 1) {
    priority = "Low";
  }

  let nextAction = "Confirm your objective, then ask for one concrete next click.";
  if (step === 0) nextAction = "Lock your objective in one sentence and request a 3-step start plan.";
  if (step === 1) nextAction = "Ask for exact page order and complete the first page now.";
  if (step === 2) nextAction = "Execute the top action now, then return with result feedback.";
  if (step >= 3) nextAction = "Choose one CTA (pricing, schedule, or service) and complete it.";

  return {
    confidence,
    risk,
    priority,
    nextAction,
  };
}

export function HFChatComponent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [showArchivedSessions, setShowArchivedSessions] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [isRenamingSession, setIsRenamingSession] = useState(false);
  const [sessionDraftName, setSessionDraftName] = useState("");
  const [pinnedPrompts, setPinnedPrompts] = useState<PinnedPrompt[]>([]);
  const [pinLabel, setPinLabel] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinCategory, setPinCategory] = useState<PromptCategory>("onboarding");
  const [storageWarning, setStorageWarning] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ChatMode>("navigator");
  const [selectedStep, setSelectedStep] = useState(0);
  const [objective, setObjective] = useState("");
  const [autoAdvanceMessage, setAutoAdvanceMessage] = useState("");
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>("coach");
  const [autoFallback, setAutoFallback] = useState(true);
  const [freedomMode, setFreedomMode] = useState<FreedomMode>("uncensored");
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const applySession = useCallback((session: ChatSession) => {
    setMessages(session.messages);
    setObjective(session.objective);
    setSelectedStep(session.selectedStep);
    setMode(session.mode);
    setResponseStyle(session.responseStyle);
    setAutoFallback(session.autoFallback);
    setFreedomMode(session.freedomMode);
    setAutoAdvanceMessage("");
    setError("");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUserId = window.localStorage.getItem("tradehax_user_id") || "";
    if (storedUserId.trim().length > 0) {
      setUserId(storedUserId.trim());
    }

    try {
      const rawSessions = window.localStorage.getItem(CHAT_SESSIONS_KEY);
      if (rawSessions) {
        const parsedSessions = JSON.parse(rawSessions) as ChatSession[];
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          const sortedSessions = [...parsedSessions]
            .filter((session) => typeof session?.id === "string" && session.id.length > 0)
            .sort((a, b) => b.updatedAt - a.updatedAt);

          if (sortedSessions.length > 0) {
            setSessions(sortedSessions);
            setActiveSessionId(sortedSessions[0].id);
            applySession(sortedSessions[0]);
          }
        }
      }
    } catch {
      setStorageWarning("Session history could not be loaded. Starting with a clean workspace.");
    }

    try {
      const rawPinned = window.localStorage.getItem(PINNED_PROMPTS_KEY);
      if (rawPinned) {
        const parsedPinned = JSON.parse(rawPinned) as unknown[];
        if (Array.isArray(parsedPinned)) {
          // Backward compatibility with previous string-only format
          const normalized = parsedPinned
            .map((item, index) => {
              if (typeof item === "string" && item.trim().length > 0) {
                return {
                  id: `legacy-${index}-${item.slice(0, 8)}`,
                  label: item.trim().slice(0, 40),
                  prompt: item.trim().slice(0, 220),
                  category: "onboarding" as PromptCategory,
                };
              }
              return sanitizePinnedPrompt(item);
            })
            .filter((item): item is PinnedPrompt => Boolean(item));

          if (normalized.length > 0) {
            setPinnedPrompts(normalized.slice(0, 24));
          }
        }
      }
    } catch {
      setStorageWarning((prev) => prev || "Pinned prompts could not be loaded from local storage.");
    }

    try {
      const rawMemory = window.localStorage.getItem(PIPELINE_MEMORY_KEY);
      if (!rawMemory) return;

      const parsed = JSON.parse(rawMemory) as Partial<PipelineMemory>;
      if (typeof parsed.objective === "string") {
        setObjective(parsed.objective.slice(0, 200));
      }
      if (typeof parsed.selectedStep === "number") {
        setSelectedStep(Math.min(PIPELINE_STEPS.length - 1, Math.max(0, Math.floor(parsed.selectedStep))));
      }
      if (parsed.mode === "navigator" || parsed.mode === "custom" || parsed.mode === "chat") {
        setMode(parsed.mode);
      }
      if (parsed.responseStyle === "concise" || parsed.responseStyle === "coach" || parsed.responseStyle === "operator") {
        setResponseStyle(parsed.responseStyle);
      }
      if (typeof parsed.autoFallback === "boolean") {
        setAutoFallback(parsed.autoFallback);
      }
      if (parsed.freedomMode === "uncensored" || parsed.freedomMode === "standard") {
        setFreedomMode(parsed.freedomMode);
      }
    } catch {
      // Ignore malformed memory payloads
    }
  }, [applySession]);

  useEffect(() => {
    if (sessions.length > 0 || activeSessionId) return;

    const initialSession = createEmptySession({
      mode,
      responseStyle,
      autoFallback,
      freedomMode,
      selectedStep,
      objective,
      messages,
      title: buildSessionTitle(messages),
    });

    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, [sessions.length, activeSessionId, mode, responseStyle, autoFallback, freedomMode, selectedStep, objective, messages]);

  useEffect(() => {
    const starter = searchParams.get("starter");
    if (!starter) return;

    if (starter === "new-user-setup") {
      setMode("navigator");
      setSelectedStep(0);
      setObjective("Get fully onboarded as a new user with clear first actions");
      setInput("I am brand new. Give me a 10-minute setup checklist and the first page I should open.");
      return;
    }

    if (starter === "first-trade-plan") {
      setMode("custom");
      setSelectedStep(1);
      setObjective("Build a beginner-safe first trade plan with risk limits");
      setInput("Create my first beginner trade plan with risk controls and exact step-by-step actions.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const memory: PipelineMemory = {
      objective: objective.trim().slice(0, 200),
      selectedStep,
      mode,
      responseStyle,
      autoFallback,
      freedomMode,
    };
    try {
      window.localStorage.setItem(PIPELINE_MEMORY_KEY, JSON.stringify(memory));
    } catch {
      setStorageWarning((prev) => prev || "Pipeline memory could not be saved locally.");
    }
  }, [objective, selectedStep, mode, responseStyle, autoFallback, freedomMode]);

  useEffect(() => {
    if (!activeSessionId) return;

    setSessions((prev) =>
      prev
        .map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                title: buildSessionTitle(messages, session.title),
                updatedAt: Date.now(),
                messages,
                objective: objective.trim().slice(0, 200),
                selectedStep,
                mode,
                responseStyle,
                autoFallback,
                freedomMode,
              }
            : session,
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }, [activeSessionId, messages, objective, selectedStep, mode, responseStyle, autoFallback, freedomMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessions.length === 0) return;

    try {
      window.localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
      setStorageWarning((prev) => prev || "Session history could not be saved due to local storage limits.");
    }
  }, [sessions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PINNED_PROMPTS_KEY, JSON.stringify(pinnedPrompts));
    } catch {
      setStorageWarning((prev) => prev || "Pinned prompts could not be saved.");
    }
  }, [pinnedPrompts]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const objectiveForRequest = (objective.trim() || trimmedInput).slice(0, 200);
    if (!objective.trim()) {
      setObjective(objectiveForRequest);
    }

    setAutoAdvanceMessage("");

    const userMessage: Message = {
      role: "user",
      content: trimmedInput,
      id: `msg-${Date.now()}`,
      meta: {
        step: selectedStep,
        mode,
        timestamp: Date.now(),
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const endpoint = MODE_META[mode].endpoint;
      const routeContext = typeof window !== "undefined" ? window.location.pathname : "/ai";

      const payload =
        mode === "chat"
          ? {
              message: trimmedInput,
              tier: freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD",
              messages: messages.map((m) => ({ role: m.role, content: m.content })).concat([
                { role: "user", content: trimmedInput },
              ]),
              context: {
                pipelineStep: PIPELINE_STEPS[selectedStep]?.title,
                objective: objectiveForRequest,
                responseStyle,
              },
              userId,
            }
          : mode === "custom"
            ? {
                message: trimmedInput,
                lane: PIPELINE_STEPS[selectedStep]?.lane,
                context: {
                  pipelineStep: PIPELINE_STEPS[selectedStep]?.title,
                  path: routeContext,
                  objective: objectiveForRequest,
                  responseStyle,
                },
                userId,
              }
            : {
                message: trimmedInput,
                currentPath: routeContext,
                sessionId: `session-${Date.now()}`,
                objective: objectiveForRequest,
                responseStyle,
                userId,
              };

      const callEndpoint = async (targetEndpoint: string, targetPayload: unknown) => {
        const response = await fetch(targetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetPayload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (data?.error === "INSUFFICIENT_CREDITS") {
            const balance =
              typeof data?.credits?.balance === "number" ? Math.max(0, Math.floor(data.credits.balance)) : null;
            const suffix = balance !== null ? ` Current balance: ${balance} credits.` : "";
            throw new Error(`Insufficient AI credits.${suffix} Top up from the Billing page.`);
          }
          throw new Error(data?.error || data?.message || `API error: ${response.statusText}`);
        }
        return data;
      };

      let data: any;
      try {
        data = await callEndpoint(endpoint, payload);
      } catch (primaryError) {
        if (!autoFallback || mode === "chat") {
          throw primaryError;
        }

        data = await callEndpoint("/api/ai/chat", {
          message: trimmedInput,
          tier: freedomMode === "uncensored" ? "UNCENSORED" : "STANDARD",
          messages: messages.map((m) => ({ role: m.role, content: m.content })).concat([
            { role: "user", content: trimmedInput },
          ]),
          context: {
            pipelineStep: PIPELINE_STEPS[selectedStep]?.title,
            objective: objectiveForRequest,
            responseStyle,
            fallbackFromMode: mode,
          },
          userId,
        });
      }

      if (!data.ok) {
        throw new Error(data.error || "Generation failed");
      }

      const coreResponse =
        typeof data?.message?.content === "string"
          ? data.message.content
          : typeof data?.response === "string"
            ? data.response
            : "No response received.";

      const suggestionText =
        Array.isArray(data?.suggestions) && data.suggestions.length > 0
          ? `\n\nSuggested routes:\n${data.suggestions
              .slice(0, 3)
              .map(
                (item: { title?: string; path?: string }) =>
                  `• ${item?.title || "Recommended"} ${item?.path ? `(${item.path})` : ""}`,
              )
              .join("\n")}`
          : "";

      const assistantMessage: Message = {
        role: "assistant",
        content: `${coreResponse}${suggestionText}`,
        id: `msg-${Date.now()}-ai`,
        meta: {
          step: selectedStep,
          mode,
          timestamp: Date.now(),
          predictionDomain:
            data?.prediction?.domain === "stock" ||
            data?.prediction?.domain === "crypto" ||
            data?.prediction?.domain === "kalshi" ||
            data?.prediction?.domain === "general"
              ? data.prediction.domain
              : "general",
          predictionConfidence:
            typeof data?.prediction?.confidence === "number"
              ? Math.max(0, Math.min(100, Math.round(data.prediction.confidence)))
              : undefined,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (selectedStep < PIPELINE_STEPS.length - 1) {
        const nextStep = selectedStep + 1;
        setSelectedStep(nextStep);
        setAutoAdvanceMessage(`Advanced to Step ${nextStep + 1}: ${PIPELINE_STEPS[nextStep].title}`);
      } else {
        setAutoAdvanceMessage("Pipeline complete. You can refine objective or continue in current stage.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [input, messages, mode, objective, selectedStep, responseStyle, autoFallback, freedomMode, userId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
    setAutoAdvanceMessage("");
  };

  const createSession = () => {
    const newSession = createEmptySession({
      mode,
      responseStyle,
      autoFallback,
      freedomMode,
    });
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    applySession(newSession);
  };

  const archiveActiveSession = () => {
    if (!activeSessionId) return;

    const archivedSession = sessions.find((session) => session.id === activeSessionId);
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? { ...session, archived: true, updatedAt: Date.now() }
          : session,
      ),
    );

    const fallbackSession = sessions.find((session) => session.id !== activeSessionId && !session.archived);
    if (fallbackSession) {
      setActiveSessionId(fallbackSession.id);
      applySession(fallbackSession);
      return;
    }

    const freshSession = createEmptySession({
      mode,
      responseStyle,
      autoFallback,
      freedomMode,
    });
    setSessions((prev) => [freshSession, ...prev]);
    setActiveSessionId(freshSession.id);
    applySession(freshSession);
    if (archivedSession) {
      setStorageWarning(`Archived session: ${archivedSession.title}`);
    }
  };

  const deleteActiveSession = () => {
    if (!activeSessionId) return;
    const remaining = sessions.filter((session) => session.id !== activeSessionId);
    setSessions(remaining);

    const fallback = remaining.find((session) => !session.archived) ?? remaining[0];
    if (fallback) {
      setActiveSessionId(fallback.id);
      applySession(fallback);
    } else {
      const fresh = createEmptySession({
        mode,
        responseStyle,
        autoFallback,
        freedomMode,
      });
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      applySession(fresh);
    }
  };

  const toggleArchivedSession = (sessionId: string) => {
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) return;

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, archived: !session.archived, updatedAt: Date.now() }
          : session,
      ),
    );
  };

  const switchSession = (sessionId: string) => {
    const targetSession = sessions.find((session) => session.id === sessionId);
    if (!targetSession) return;
    setActiveSessionId(targetSession.id);
    setIsRenamingSession(false);
    setSessionDraftName("");
    applySession(targetSession);
  };

  const startRenameSession = () => {
    const activeSession = sessions.find((session) => session.id === activeSessionId);
    if (!activeSession) return;
    setSessionDraftName(activeSession.title);
    setIsRenamingSession(true);
  };

  const saveRenameSession = () => {
    const trimmed = sessionDraftName.trim().slice(0, 60);
    if (!trimmed) {
      setIsRenamingSession(false);
      setSessionDraftName("");
      return;
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              title: trimmed,
              updatedAt: Date.now(),
            }
          : session,
      ),
    );

    setIsRenamingSession(false);
    setSessionDraftName("");
  };

  const addPinnedPrompt = () => {
    const trimmed = pinInput.trim().replace(/\s+/g, " ");
    const trimmedLabel = (pinLabel.trim() || trimmed).replace(/\s+/g, " ").slice(0, 40);
    if (!trimmed) return;
    if (trimmed.length > 220) {
      setStorageWarning("Pinned prompt is too long. Keep it under 220 characters.");
      return;
    }

    setPinnedPrompts((prev) => {
      if (prev.some((item) => item.prompt.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const entry: PinnedPrompt = {
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: trimmedLabel,
        prompt: trimmed,
        category: pinCategory,
      };
      return [entry, ...prev].slice(0, 24);
    });

    setStorageWarning("");
    setPinLabel("");
    setPinInput("");
  };

  const removePinnedPrompt = (promptId: string) => {
    setPinnedPrompts((prev) => prev.filter((item) => item.id !== promptId));
  };

  const exportActiveSession = (format: "json" | "md") => {
    const active = sessions.find((session) => session.id === activeSessionId);
    if (!active || typeof window === "undefined") return;

    try {
      const timestamp = new Date(active.updatedAt).toISOString().replace(/[:.]/g, "-");
      const filenameBase = `tradehax-session-${active.id}-${timestamp}`;

      const payload =
        format === "json"
          ? JSON.stringify(active, null, 2)
          : [
              `# ${active.title}`,
              "",
              `- Updated: ${new Date(active.updatedAt).toLocaleString()}`,
              `- Mode: ${active.mode}`,
              `- Objective: ${active.objective || "(none)"}`,
              "",
              ...active.messages.map((message) => `## ${message.role === "assistant" ? "Assistant" : "User"}\n\n${message.content}\n`),
            ].join("\n");

      const blob = new Blob([payload], { type: format === "json" ? "application/json" : "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${filenameBase}.${format === "json" ? "json" : "md"}`;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setStorageWarning("Export failed. Please try again.");
    }
  };

  const promptQualityScore = (() => {
    const text = input.trim();
    if (!text) return 0;
    let score = 28;
    if (text.length >= 45) score += 18;
    if (text.length >= 120) score += 12;
    if (/\b(goal|objective|risk|timeline|step|budget|constraint)\b/i.test(text)) score += 22;
    if (/\?|\bhow\b|\bwhat\b|\bwhy\b/i.test(text)) score += 12;
    if (objective.trim().length > 0) score += 10;
    return clamp(score, 0, 100);
  })();

  const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === "assistant");

  const copyLastAssistant = async () => {
    if (!lastAssistantMessage?.content || typeof window === "undefined") return;
    try {
      await window.navigator.clipboard.writeText(lastAssistantMessage.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // no-op fallback
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (session.archived !== showArchivedSessions) return false;
    if (!sessionSearch.trim()) return true;
    const query = sessionSearch.trim().toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.messages.some((message) => message.content.toLowerCase().includes(query))
    );
  });

  const filteredPinnedPrompts = pinnedPrompts.filter((item) => item.category === pinCategory);

  return (
    <div className="theme-panel w-full h-[80vh] min-h-[620px] max-h-[980px] overflow-hidden">
      <div className="grid h-full lg:grid-cols-[320px_1fr]">
        {showControlPanel && (
          <aside className="border-b lg:border-b-0 lg:border-r border-emerald-500/20 bg-black/35 p-4 overflow-y-auto">
            <div className="mb-3 rounded border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wide text-emerald-200/80">Sessions</p>
                <button
                  onClick={createSession}
                  className="rounded border border-emerald-500/30 bg-emerald-600/10 px-2 py-1 text-[11px] text-emerald-100 hover:border-emerald-300/50"
                  title="Create session"
                >
                  <Plus className="w-3 h-3 inline mr-1" />New
                </button>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 absolute left-2 top-1.5 text-emerald-200/60" />
                  <input
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search sessions"
                    className="w-full rounded border border-white/15 bg-black/30 py-1 pl-6 pr-2 text-[11px] text-emerald-100 outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowArchivedSessions((prev) => !prev)}
                  className="rounded border border-white/15 bg-black/25 px-2 py-1 text-[11px] text-emerald-100/80"
                >
                  {showArchivedSessions ? "Active" : "Archived"}
                </button>
              </div>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {filteredSessions.map((session) => {
                  const active = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`rounded px-2 py-1.5 text-[11px] border transition ${
                        active
                          ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                          : "border-white/10 bg-black/25 text-emerald-100/80"
                      }`}
                    >
                      <button
                        onClick={() => switchSession(session.id)}
                        className="w-full text-left"
                      >
                        <div className="font-semibold truncate">{session.title}</div>
                        <div className="opacity-70">{new Date(session.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </button>
                      <div className="mt-1 flex gap-1">
                        <button
                          onClick={() => toggleArchivedSession(session.id)}
                          className="rounded border border-white/15 px-1.5 py-0.5 text-[10px]"
                          title={session.archived ? "Restore session" : "Archive session"}
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <button
                  onClick={() => exportActiveSession("json")}
                  className="rounded border border-white/15 bg-black/20 px-2 py-1 text-[11px] text-emerald-100/85"
                  title="Export active session as JSON"
                >
                  <FileJson className="w-3 h-3 inline mr-1" />JSON
                </button>
                <button
                  onClick={() => exportActiveSession("md")}
                  className="rounded border border-white/15 bg-black/20 px-2 py-1 text-[11px] text-emerald-100/85"
                  title="Export active session as Markdown"
                >
                  <FileText className="w-3 h-3 inline mr-1" />MD
                </button>
                <button
                  onClick={archiveActiveSession}
                  className="rounded border border-white/15 bg-black/20 px-2 py-1 text-[11px] text-emerald-100/85"
                  title="Archive active session"
                >
                  <Archive className="w-3 h-3 inline mr-1" />Archive
                </button>
                <button
                  onClick={deleteActiveSession}
                  className="rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100"
                  title="Delete active session"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />Delete
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {isRenamingSession ? (
                  <>
                    <input
                      value={sessionDraftName}
                      onChange={(e) => setSessionDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRenameSession();
                        if (e.key === "Escape") {
                          setIsRenamingSession(false);
                          setSessionDraftName("");
                        }
                      }}
                      className="flex-1 rounded border border-cyan-500/30 bg-black/40 px-2 py-1 text-[11px] text-cyan-100 outline-none"
                      placeholder="Rename session"
                    />
                    <button
                      onClick={saveRenameSession}
                      className="rounded border border-cyan-400/40 bg-cyan-500/15 px-2 py-1 text-[11px] text-cyan-100"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startRenameSession}
                    disabled={!activeSessionId}
                    className="rounded border border-white/15 bg-black/20 px-2 py-1 text-[11px] text-emerald-100/85 disabled:opacity-50"
                  >
                    <Pencil className="w-3 h-3 inline mr-1" />Rename active
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3 rounded border border-cyan-500/20 bg-cyan-600/10 px-3 py-2 text-xs text-cyan-100/90">
              <p className="font-semibold">Start here if you&apos;re new</p>
              <p className="mt-1 text-cyan-100/75">Pick a quick prompt, send it, then follow the 4-step flow.</p>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wide text-emerald-200/70 mb-1">
                Objective memory
              </label>
              <input
                value={objective}
                onChange={(e) => setObjective(e.target.value.slice(0, 200))}
                placeholder="e.g. Build a safe first trade plan"
                className="w-full rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder-emerald-200/40 outline-none"
              />
            </div>

            <div className="mb-3 space-y-2">
              {(Object.keys(MODE_META) as ChatMode[]).map((modeKey) => {
                const active = mode === modeKey;
                return (
                  <button
                    key={modeKey}
                    onClick={() => setMode(modeKey)}
                    className={`w-full text-left rounded border px-3 py-2 transition ${
                      active
                        ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                        : "border-emerald-500/20 bg-black/30 text-emerald-200/70 hover:border-emerald-400/40"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide">{MODE_META[modeKey].label}</div>
                    <div className="text-[11px] mt-1 opacity-80 leading-relaxed">{MODE_META[modeKey].description}</div>
                  </button>
                );
              })}
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              {PIPELINE_STEPS.map((step, index) => {
                const active = selectedStep === index;
                return (
                  <button
                    key={step.title}
                    onClick={() => {
                      setSelectedStep(index);
                      setInput(step.starterPrompt);
                      setAutoAdvanceMessage("");
                    }}
                    className={`rounded border px-2 py-2 text-xs transition ${
                      active
                        ? "border-emerald-300/50 bg-emerald-500/20 text-emerald-100"
                        : "border-emerald-500/20 bg-black/30 text-emerald-200/70 hover:border-emerald-400/40"
                    }`}
                  >
                    <div className="font-semibold">{index + 1}. {step.title}</div>
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wide text-emerald-200/70 mb-1">
                Quick prompts
              </label>
              <div className="space-y-2">
                {QUICK_START_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setInput(item.prompt);
                      if (!objective.trim()) {
                        setObjective(item.label);
                      }
                    }}
                    className="w-full rounded border border-emerald-500/20 bg-black/30 px-2 py-2 text-left text-[11px] text-emerald-100/85 hover:border-emerald-400/40"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 rounded border border-fuchsia-500/20 bg-fuchsia-600/10 p-2">
              <label className="block text-[11px] uppercase tracking-wide text-fuchsia-100/80 mb-1">
                Pinned prompts
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  value={pinLabel}
                  onChange={(e) => setPinLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="rounded border border-fuchsia-500/30 bg-black/35 px-2 py-1 text-[11px] text-fuchsia-100 outline-none"
                />
                <select
                  title="Pinned prompt category"
                  aria-label="Pinned prompt category"
                  value={pinCategory}
                  onChange={(e) => setPinCategory(e.target.value as PromptCategory)}
                  className="rounded border border-fuchsia-500/30 bg-black/35 px-2 py-1 text-[11px] text-fuchsia-100 outline-none"
                >
                  <option value="onboarding">Onboarding</option>
                  <option value="trading">Trading</option>
                  <option value="content">Content</option>
                  <option value="ops">Ops</option>
                </select>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPinnedPrompt();
                    }
                  }}
                  placeholder="Add reusable prompt"
                  className="flex-1 rounded border border-fuchsia-500/30 bg-black/35 px-2 py-1 text-[11px] text-fuchsia-100 outline-none"
                />
                <button
                  onClick={addPinnedPrompt}
                  title="Pin prompt"
                  aria-label="Pin prompt"
                  className="rounded border border-fuchsia-400/40 bg-fuchsia-500/20 px-2 py-1 text-[11px] text-fuchsia-100"
                >
                  <Pin className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {filteredPinnedPrompts.length === 0 && (
                  <p className="text-[11px] text-fuchsia-100/60">No pinned prompts yet.</p>
                )}
                {filteredPinnedPrompts.map((prompt) => (
                  <div key={prompt.id} className="flex items-start gap-1 rounded border border-fuchsia-500/20 bg-black/25 px-2 py-1">
                    <button
                      onClick={() => setInput(prompt.prompt)}
                      className="flex-1 text-left text-[11px] text-fuchsia-100/90 hover:text-fuchsia-50"
                    >
                      <span className="font-semibold">{prompt.label}</span>
                      <span className="block opacity-80">{prompt.prompt}</span>
                    </button>
                    <button
                      onClick={() => removePinnedPrompt(prompt.id)}
                      className="text-fuchsia-100/70 hover:text-fuchsia-50"
                      title="Remove pinned prompt"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="rounded border border-emerald-500/20 bg-black/30 p-2">
                <label htmlFor="response-style" className="block text-[11px] font-semibold text-emerald-100/80 mb-1">
                  Response style
                </label>
                <select
                  id="response-style"
                  value={responseStyle}
                  onChange={(e) => setResponseStyle((e.target.value as ResponseStyle) || "coach")}
                  className="w-full rounded border border-emerald-500/30 bg-black/40 px-2 py-1 text-xs text-emerald-100 outline-none"
                >
                  <option value="concise">Concise</option>
                  <option value="coach">Coach</option>
                  <option value="operator">Operator</option>
                </select>
              </div>

              <label className="rounded border border-emerald-500/20 bg-black/30 p-2 flex items-center gap-2 text-xs text-emerald-100/85">
                <input
                  type="checkbox"
                  checked={autoFallback}
                  onChange={(e) => setAutoFallback(e.target.checked)}
                  className="accent-emerald-400"
                />
                Auto-fallback to General Chat
              </label>

              <div className="rounded border border-fuchsia-500/20 bg-fuchsia-600/10 p-2">
                <label htmlFor="freedom-mode" className="block text-[11px] font-semibold text-fuchsia-100/90 mb-1">
                  Freedom mode
                </label>
                <select
                  id="freedom-mode"
                  value={freedomMode}
                  onChange={(e) => setFreedomMode((e.target.value as FreedomMode) || "uncensored")}
                  className="w-full rounded border border-fuchsia-500/30 bg-black/40 px-2 py-1 text-xs text-fuchsia-100 outline-none"
                >
                  <option value="uncensored">Uncensored</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
          </aside>
        )}

        <section className="flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-emerald-500/20 px-4 py-3">
            <div>
              <h3 className="font-bold text-emerald-300">AI Assistant Console</h3>
              <p className="text-xs text-emerald-200/70">
                {sessions.find((session) => session.id === activeSessionId)?.title || "Session"} • Mode: {MODE_META[mode].label} • Step {selectedStep + 1}/4
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowControlPanel((prev) => !prev)}
                className="theme-cta theme-cta--muted theme-cta--compact px-2 py-2"
                title="Toggle controls"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <button
                onClick={copyLastAssistant}
                disabled={!lastAssistantMessage}
                className="theme-cta theme-cta--muted theme-cta--compact px-2 py-2 disabled:opacity-50"
                title="Copy last assistant response"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={clearChat}
                className="theme-cta theme-cta--muted theme-cta--compact px-2 py-2"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-emerald-500/20 px-4 py-2 text-[11px] text-emerald-200/75 flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />Prompt quality: {promptQualityScore}%</span>
            <span>Response style: {responseStyle}</span>
            <span>{freedomMode === "uncensored" ? "Uncensored lane" : "Standard lane"}</span>
            {copied && <span className="text-cyan-200">Copied last response.</span>}
            {storageWarning && <span className="text-amber-200">{storageWarning}</span>}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-emerald-200/50 text-center">
                <div>
                  <p className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                    <Compass className="w-4 h-4" />
                    Start with Step {selectedStep + 1}: {PIPELINE_STEPS[selectedStep]?.title}
                  </p>
                  <p className="text-sm">Use the control panel to seed a prompt, then iterate here.</p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[95%] sm:max-w-[88%] lg:max-w-2xl px-4 py-2 rounded-xl ${
                    msg.role === "user"
                      ? "bg-emerald-600/35 text-emerald-100 border border-emerald-500/30"
                      : "bg-cyan-600/15 text-cyan-100 border border-cyan-500/20"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && (
                    <div className="mt-3 rounded border border-cyan-400/25 bg-black/30 p-2 text-[11px]">
                      {(() => {
                        const signals = scoreAssistantResponse(
                          msg.content,
                          msg.meta?.step ?? selectedStep,
                          msg.meta?.mode ?? mode,
                        );

                        return (
                          <>
                            <div className="mb-2 font-semibold text-cyan-200">Decision Signals</div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.meta?.predictionDomain && msg.meta.predictionDomain !== "general" ? (
                                <SignalPill
                                  label={`Domain ${msg.meta.predictionDomain.toUpperCase()}`}
                                  tone="mid"
                                />
                              ) : null}
                              {typeof msg.meta?.predictionConfidence === "number" ? (
                                <SignalPill
                                  label={`Domain conf ${msg.meta.predictionConfidence}%`}
                                  tone={msg.meta.predictionConfidence >= 70 ? "good" : "mid"}
                                />
                              ) : null}
                              <SignalPill
                                label={`Confidence ${signals.confidence}%`}
                                tone={signals.confidence >= 75 ? "good" : signals.confidence >= 55 ? "mid" : "warn"}
                              />
                              <SignalPill
                                label={`Risk ${signals.risk}%`}
                                tone={signals.risk <= 30 ? "good" : signals.risk <= 55 ? "mid" : "warn"}
                              />
                              <SignalPill
                                label={`Priority ${signals.priority}`}
                                tone={signals.priority === "High" ? "good" : signals.priority === "Medium" ? "mid" : "warn"}
                              />
                            </div>
                            <p className="text-cyan-100/75">
                              <span className="font-semibold text-cyan-200">Next action:</span> {signals.nextAction}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-cyan-600/20 border border-cyan-500/20 rounded-lg px-4 py-2 flex items-center gap-2 text-cyan-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 justify-start">
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-200 text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-emerald-500/20 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/35">
            {objective && (
              <div className="mb-2 text-[11px] text-cyan-200/70">Objective memory: {objective}</div>
            )}
            {autoAdvanceMessage && (
              <div className="mb-2 text-[11px] text-emerald-200/80">{autoAdvanceMessage}</div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask naturally: goal, constraints, risk level, and desired next step."
                rows={3}
                disabled={loading}
                className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-3 py-2 text-emerald-100 placeholder-emerald-200/40 outline-none resize-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="theme-cta theme-cta--loud px-4 py-2 h-14 disabled:opacity-50 flex items-center justify-center"
                title="Send message"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SignalPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "mid" | "warn";
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
      : tone === "mid"
        ? "border-amber-400/30 bg-amber-500/20 text-amber-100"
        : "border-rose-400/30 bg-rose-500/20 text-rose-100";

  return <span className={`rounded px-2 py-1 border ${toneClasses}`}>{label}</span>;
}
