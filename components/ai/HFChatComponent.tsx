"use client";

import { ArrowUp, Loader2, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export function HFChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      id: `msg-${Date.now()}`,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
            { role: "user", content: input },
          ]),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Generation failed");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message.content,
        id: `msg-${Date.now()}-ai`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [input, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <div className="theme-panel w-full h-[600px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 p-4">
        <div>
          <h3 className="font-bold text-emerald-300">AI Chat</h3>
          <p className="text-xs text-emerald-200/70">Powered by Hugging Face</p>
        </div>
        <button
          onClick={clearChat}
          className="theme-cta theme-cta--muted theme-cta--compact px-2 py-2"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-emerald-200/50 text-center">
            <div>
              <p className="text-lg font-semibold mb-2">Start a conversation</p>
              <p className="text-sm">Ask me anything powered by Hugging Face LLMs</p>
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
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
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
