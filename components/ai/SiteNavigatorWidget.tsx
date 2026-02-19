"use client";

import { MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type Suggestion = {
  path: string;
  title: string;
  reason: string;
  confidence: number;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  suggestions?: Suggestion[];
};

function createSessionId() {
  return `nav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const STARTER_PROMPTS = [
  "I am new. Where should I start?",
  "Take me to AI tools",
  "How do I find pricing and billing?",
  "I want trading intelligence",
];

export function SiteNavigatorWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId] = useState(createSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I can help you navigate TradeHax. Ask me what you want to do, and I’ll point you to the right pages.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const trackEvent = async (eventName: string, metadata?: Record<string, unknown>) => {
    try {
      await fetch("/api/ai/behavior/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: eventName,
          source: "ai_navigator",
          userId: sessionId,
          metadata: {
            path: pathname,
            ...metadata,
          },
          consent: {
            analytics: true,
            training: false,
          },
        }),
      });
    } catch {
      // Non-blocking analytics
    }
  };

  const sendPrompt = async (prompt: string) => {
    const message = prompt.trim();
    if (!message) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    await trackEvent("navigator_prompt_sent", {
      prompt_length: message.length,
    });

    try {
      const response = await fetch("/api/ai/navigator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId,
          currentPath: pathname,
          consent: {
            analytics: true,
            training: false,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Navigator request failed");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: payload.response,
        suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "I hit a temporary issue. Try /, /ai-hub, /intelligence, or /pricing while I recover.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80]">
      {open && (
        <div className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-cyan-500/30 bg-black/95 shadow-[0_0_24px_rgba(6,182,212,0.28)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-500/20 px-3 py-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Site Navigator</div>
              <div className="text-[10px] text-cyan-100/70">AI guide for new users</div>
            </div>
            <button
              type="button"
              className="rounded p-1 text-cyan-200/80 hover:bg-cyan-500/10 hover:text-white"
              aria-label="Close navigator"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[52vh] space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                      : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.suggestions.slice(0, 4).map((item) => (
                      <Link
                        key={`${msg.id}-${item.path}`}
                        href={item.path}
                        onClick={() => {
                          void trackEvent("navigator_suggestion_clicked", {
                            target_path: item.path,
                            target_title: item.title,
                          });
                        }}
                        className="rounded border border-cyan-400/30 bg-black/40 px-2 py-1 text-[10px] text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/20"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-xs text-cyan-200/70">Thinking…</div>
            )}
          </div>

          <div className="border-t border-cyan-500/20 px-3 py-2">
            <div className="mb-2 flex flex-wrap gap-1">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[10px] text-cyan-100/80 hover:bg-cyan-500/15"
                  onClick={() => {
                    void sendPrompt(prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSend) {
                    event.preventDefault();
                    void sendPrompt(input);
                  }
                }}
                placeholder="Ask where to go…"
                className="w-full rounded border border-cyan-500/30 bg-black/60 px-2.5 py-2 text-xs text-cyan-100 outline-none placeholder:text-cyan-200/40"
              />
              <button
                type="button"
                onClick={() => {
                  void sendPrompt(input);
                }}
                disabled={!canSend}
                className="rounded border border-cyan-400/40 bg-cyan-500/20 p-2 text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:bg-cyan-500/30"
        onClick={() => {
          setOpen((prev) => !prev);
          void trackEvent("navigator_widget_toggled", {
            open_next: !open,
          });
        }}
      >
        <MessageCircle className="h-4 w-4" />
        {open ? "Close Guide" : "Need Help?"}
      </button>
    </div>
  );
}
