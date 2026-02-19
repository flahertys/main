"use client";
import { useState, useEffect, useRef } from "react";
import { ingestBehavior } from '@/lib/ai/data-ingestion';

export const NeuralConsole = () => {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([
    "TRADEHAX_NEURAL_KERNEL_V4.0.1_ACTIVE",
    "ESTABLISHING_UNCENSORED_LINK...",
    "DATA_COLLECTION_PROTOCOL: ENABLED",
    "TYPE 'HELP' FOR SYSTEM_COMMANDS"
  ]);
  const [projectedValue, setProjectedValue] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState("guest_terminal");

  function generateGuestUserId() {
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(8);
      window.crypto.getRandomValues(bytes);
      const randomPart = Array.from(bytes)
        .map((b) => b.toString(36).padStart(2, "0"))
        .join("")
        .slice(0, 8);
      return `guest_${randomPart}`;
    }
    // Fallback: retain previous behavior if crypto is unavailable
    return `guest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("tradehax_user_id");
    const resolved =
      stored && stored.trim().length > 0
        ? stored
        : generateGuestUserId();
    window.localStorage.setItem("tradehax_user_id", resolved);
    setUserId(resolved);
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isOverclocked, setIsOverclocked] = useState(false);

  const processCommand = async (cmd: string) => {
    const cleanCmd = cmd.toUpperCase().trim();
    setLogs(prev => [...prev, `> ${cmd}`]);
    setInput("");
    setIsProcessing(true);

    if (cleanCmd === "OVERCLOCK" || cleanCmd === "NEURAL_OVERCLOCK") {
      setIsOverclocked(true);
      setLogs(prev => [...prev, "WARNING: SYSTEM_TEMPERATURE_RISING...", "NEURAL_OVERCLOCK_ENGAGED. (NO_FILTERS_ACTIVE)"]);
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cmd,
          userId,
          tier: isOverclocked ? 'OVERCLOCK' : 'STANDARD'
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setLogs(prev => [
          ...prev,
          data?.message || data?.error || "ERROR: REQUEST_FAILED"
        ]);
      } else {
        setLogs(prev => [...prev, data.response || "ERROR: NO_RESPONSE"]);
      }
      
      // Ingest Behavior for Fine-Tuning (GLM-4.7)
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: cmd.toUpperCase().includes("GUITAR") ? 'GUITAR' : (cmd.toUpperCase().includes("HFT") ? 'HFT' : 'BEHAVIOR'),
        prompt: cmd,
        response: data.response
      });

      if (data.response?.includes("REWARD") || data.response?.includes("YIELD")) {
        setProjectedValue(Math.floor(Math.random() * 5000) + 1000);
      }
    } catch (err) {
      setLogs(prev => [...prev, "ERROR: NEURAL_LINK_TIMEOUT"]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className={`py-24 bg-black relative transition-colors duration-1000 ${isOverclocked ? 'bg-red-950/10' : ''}`}>
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xs font-mono tracking-[0.4em] uppercase transition-colors ${isOverclocked ? 'text-red-500' : 'text-cyan-500'}`}>
              {isOverclocked ? 'Overclock_Terminal' : 'Neural_Terminal'}
            </h2>
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isOverclocked ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500'}`} />
              <span className={`text-[10px] font-mono uppercase ${isOverclocked ? 'text-red-500' : 'text-zinc-600'}`}>
                {isOverclocked ? 'OVERCLOCK_ACTIVE' : 'UNCENSORED_MODE'}
              </span>
            </div>
          </div>

          <div className={`bg-zinc-950 glass-panel rounded-3xl overflow-hidden relative transition-all duration-500 ${isOverclocked ? 'shadow-[0_0_70px_rgba(239,68,68,0.1)] border-red-500/30' : 'shadow-[0_0_50px_rgba(6,182,212,0.05)]'}`}>
            <div className={`scanline ${isOverclocked ? 'bg-red-500/20' : ''}`} />
            {/* Terminal Header */}
            <div className={`px-6 py-3 border-b flex justify-between items-center transition-colors ${isOverclocked ? 'bg-red-900/20 border-red-500/20' : 'bg-zinc-900/50 border-white/5'}`}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">TradeHax_Cognitive_Engine</span>
            </div>

            {/* Terminal Output */}
            <div className="p-5 sm:p-8 h-72 sm:h-80 overflow-y-auto font-mono text-xs space-y-3 custom-scrollbar crt-flicker" aria-live="polite">
              {logs.map((log, i) => (
                <div key={i} className={`${log.startsWith('>') ? 'text-zinc-400' : (isOverclocked ? 'text-red-400' : 'text-cyan-500')} transition-colors`}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Terminal Input */}
            <div className={`p-4 sm:p-6 border-t transition-colors ${isOverclocked ? 'bg-red-950/20 border-red-500/20' : 'bg-zinc-900/20 border-white/5'}`}>
              <form
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isProcessing && input.trim().length > 0) {
                    processCommand(input);
                  }
                }}
              >
                <span className={`${isOverclocked ? 'text-red-500' : 'text-cyan-500'} font-bold transition-colors animate-pulse`}>$</span>
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-700 font-mono disabled:opacity-50"
                  placeholder={isProcessing ? "PROCESSING_NEURAL_STREAMS..." : "Execute neural command or ask AI..."}
                  aria-label="Neural terminal command input"
                />
                <button
                  type="submit"
                  disabled={isProcessing || input.trim().length === 0}
                  className="theme-cta theme-cta--secondary shrink-0 px-4 py-2 text-[10px] uppercase"
                  aria-label="Run neural command"
                >
                  Run
                </button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {["HELP", "STATUS", "PORTFOLIO", "GAMES", "BILLING", "BOOK"].map((shortcut) => (
                  <button
                    key={shortcut}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => processCommand(shortcut)}
                    className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-mono text-zinc-300 hover:text-white hover:border-cyan-400/60"
                    aria-label={`Run ${shortcut} command`}
                  >
                    {shortcut}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Calculator Summary Card */}
          {projectedValue > 0 && (
            <div className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-cyan-500 uppercase font-mono mb-1">Projected_System_Value</p>
                    <p className="text-2xl font-black text-white italic">{projectedValue.toLocaleString()} <span className="text-cyan-500">$HAX</span></p>
                  </div>
                  <button className="px-6 py-2 bg-cyan-500 text-black text-[10px] font-black rounded-lg uppercase">Stake_Now</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
