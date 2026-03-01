/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

"use client";

import { Loader2, Mic, MicOff, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

type SearchResult = {
  id?: string;
  author?: string;
  handle?: string;
  text?: string;
  content?: string;
  createdAt?: string;
  timestamp?: string;
  url?: string;
  score?: number;
};

export function VoiceSearchControlPanel() {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [query, setQuery] = useState("");
  const [openPromptMode, setOpenPromptMode] = useState(true);
  const [xSearchEnabled, setXSearchEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = Boolean(
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
    );
    setVoiceSupported(supported);
  }, []);

  const canSearch = useMemo(() => query.trim().length > 1 && xSearchEnabled, [query, xSearchEnabled]);

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
      setError("Voice mode is not available in this browser.");
      return;
    }

    if (recording && recognitionRef.current) {
      recognitionRef.current.stop();
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
        if (typeof transcript === "string" && transcript.trim().length > 0) {
          setQuery((prev) => `${prev}${prev ? " " : ""}${transcript.trim()}`);
        }
      };
      recognition.onerror = () => {
        setError("Voice capture failed. Try again.");
      };
      recognition.onend = () => {
        setRecording(false);
      };
      recognitionRef.current = recognition;
      setRecording(true);
      setError("");
      recognition.start();
    } catch {
      setRecording(false);
      setError("Could not start voice capture.");
    }
  };

  const runSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/ai/x-ecosystem-search?q=${encodeURIComponent(query.trim())}&limit=6`);
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Search failed");
      }
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-panel mb-8 rounded-xl border border-cyan-500/20 bg-cyan-600/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-200/80">Visual Enhancements</p>
          <h3 className="mt-1 text-lg font-bold text-cyan-100">Dynasty Voice + X Context Panel</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/35 bg-fuchsia-500/15 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-100">
          <Sparkles className="h-3.5 w-3.5" />
          Modular UI (shadcn-style)
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="flex items-center justify-between rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-xs text-zinc-200">
          Voice mode beta
          <button
            type="button"
            onClick={toggleVoice}
            disabled={!voiceSupported}
            className="inline-flex items-center gap-1 rounded border border-cyan-400/30 bg-cyan-500/15 px-2 py-1 text-cyan-100 disabled:opacity-50"
          >
            {recording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {recording ? "Stop" : "Start"}
          </button>
        </label>

        <label className="flex items-center justify-between rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-xs text-zinc-200">
          Open prompts mode
          <input
            type="checkbox"
            className="accent-fuchsia-400"
            checked={openPromptMode}
            onChange={(e) => setOpenPromptMode(e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-xs text-zinc-200">
          Real-time X context
          <input
            type="checkbox"
            className="accent-emerald-400"
            checked={xSearchEnabled}
            onChange={(e) => setXSearchEnabled(e.target.checked)}
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search X ecosystem context (signals, sentiment, narratives)..."
          className="flex-1 rounded-lg border border-cyan-500/30 bg-black/35 px-3 py-2 text-sm text-cyan-100 outline-none placeholder:text-cyan-100/45"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={!canSearch || loading}
          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100/90">
        <p className="inline-flex items-center gap-1 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          Open prompts are enabled, but illegal content remains blocked.
        </p>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{error}</div>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {results.map((item, index) => (
            <article key={`${item.id || item.url || "r"}-${index}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-200">{item.author || item.handle || "Source"}</p>
              <p className="mt-1 text-xs text-zinc-200/90">{item.text || item.content || "No content available."}</p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                <span>{item.createdAt || item.timestamp || "live"}</span>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                    open
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
