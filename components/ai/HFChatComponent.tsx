"use client";

import { ArrowUp, Compass, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

type ChatMode = "navigator" | "custom" | "chat";

type PipelineMemory = {
  objective: string;
  selectedStep: number;
  mode: ChatMode;
  responseStyle: ResponseStyle;
  autoFallback: boolean;
};

type ResponseStyle = "concise" | "coach" | "operator";

const PIPELINE_MEMORY_KEY = "tradehax-ai-pipeline-memory-v1";

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

export function HFChatComponent() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
    } catch {
      // Ignore malformed memory payloads
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const memory: PipelineMemory = {
      objective: objective.trim().slice(0, 200),
      selectedStep,
      mode,
      responseStyle,
      autoFallback,
    };
    window.localStorage.setItem(PIPELINE_MEMORY_KEY, JSON.stringify(memory));
  }, [objective, selectedStep, mode, responseStyle, autoFallback]);

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
              messages: messages.map((m) => ({ role: m.role, content: m.content })).concat([
                { role: "user", content: trimmedInput },
              ]),
              context: {
                pipelineStep: PIPELINE_STEPS[selectedStep]?.title,
                objective: objectiveForRequest,
                responseStyle,
              },
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
              }
            : {
                message: trimmedInput,
                currentPath: routeContext,
                sessionId: `session-${Date.now()}`,
                objective: objectiveForRequest,
                responseStyle,
              };

      const callEndpoint = async (targetEndpoint: string, targetPayload: unknown) => {
        const response = await fetch(targetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetPayload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
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
          messages: messages.map((m) => ({ role: m.role, content: m.content })).concat([
            { role: "user", content: trimmedInput },
          ]),
          context: {
            pipelineStep: PIPELINE_STEPS[selectedStep]?.title,
            objective: objectiveForRequest,
            responseStyle,
            fallbackFromMode: mode,
          },
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
  }, [input, messages, mode, objective, selectedStep, responseStyle, autoFallback]);

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

  return (
    <div className="theme-panel w-full h-[600px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 p-4">
        <div>
          <h3 className="font-bold text-emerald-300">AI Chat Pipeline</h3>
          <p className="text-xs text-emerald-200/70">Choose a mode, then follow the 4-step flow</p>
        </div>
        <button
          onClick={clearChat}
          className="theme-cta theme-cta--muted theme-cta--compact px-2 py-2"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-emerald-500/20 p-4 space-y-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-emerald-200/70 mb-1">
            Conversation objective (memory)
          </label>
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value.slice(0, 200))}
            placeholder="e.g. Get from onboarding to funded trading setup"
            className="w-full rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-100 placeholder-emerald-200/40 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(MODE_META) as ChatMode[]).map((modeKey) => {
            const active = mode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => setMode(modeKey)}
                className={`text-left rounded border px-3 py-2 transition ${
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

        <div className="grid sm:grid-cols-2 gap-2">
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
            Auto-fallback to General Chat on endpoint failure
          </label>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-emerald-200/50 text-center">
            <div>
              <p className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                <Compass className="w-4 h-4" />
                Start with Step {selectedStep + 1}: {PIPELINE_STEPS[selectedStep]?.title}
              </p>
              <p className="text-sm">Tap a step above to auto-fill a high-signal prompt.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-emerald-600/40 text-emerald-100 border border-emerald-500/30"
                  : "bg-cyan-600/20 text-cyan-100 border border-cyan-500/20"
              }`}
            >
              {msg.content}
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

      {/* Input */}
      <div className="border-t border-emerald-500/20 p-4">
        <div className="flex items-center justify-between mb-2 text-[11px] text-emerald-200/70">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Mode: {MODE_META[mode].label}
          </span>
          <span>Current step: {selectedStep + 1}/4</span>
        </div>
        {objective && (
          <div className="mb-2 text-[11px] text-cyan-200/70">Objective memory: {objective}</div>
        )}
        {autoAdvanceMessage && (
          <div className="mb-2 text-[11px] text-emerald-200/80">{autoAdvanceMessage}</div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or choose a step template above..."
            rows={3}
            disabled={loading}
            className="flex-1 rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-emerald-100 placeholder-emerald-200/40 outline-none resize-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="theme-cta theme-cta--loud px-4 py-2 h-14 disabled:opacity-50 flex items-center justify-center"
            title="Send message (Ctrl+Enter)"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
