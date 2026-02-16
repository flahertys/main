"use client";
import React, { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const processCommand = (cmd: string) => {
    const cleanCmd = cmd.toUpperCase().trim();
    let response = "";

    if (cleanCmd.startsWith("CALC ")) {
      const amount = parseFloat(cleanCmd.split(" ")[1]);
      if (!isNaN(amount)) {
        const reward = amount * 1.25; // Simulated yield multiplier
        response = `CALCULATION_COMPLETE: PROX_REWARD = ${reward.toLocaleString()} $HAX [ROI: 25%]`;
        setProjectedValue(reward);
      } else {
        response = "ERROR: INVALID_INPUT_FORMAT. USE 'CALC [AMOUNT]'";
      }
    } else if (cleanCmd === "AI_STATUS") {
      response = "LLM_STATUS: TRAINING_PHASE_01 // BEHAVIORAL_INGESTION: ACTIVE // SENSOR_MOD: UNCENSORED";
    } else if (cleanCmd === "HELP") {
      response = "COMMANDS: CALC [AMT], AI_STATUS, MARKET_SENTIMENT, SYSTEM_STATS";
    } else {
      response = `AI_RESPONSE: ANALYZING_QUERY '${cmd}'... DATA_POINT_LOGGED. (LEARNING_IN_PROGRESS)`;
    }

    setLogs(prev => [...prev, `> ${cmd}`, response]);
    setInput("");
  };

  return (
    <section className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-mono text-cyan-500 tracking-[0.4em] uppercase">Neural_Terminal</h2>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-600">UNCENSORED_MODE</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.05)]">
            {/* Terminal Header */}
            <div className="bg-zinc-900/50 px-6 py-3 border-b border-white/5 flex justify-between items-center">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">TradeHax_Cognitive_Engine</span>
            </div>

            {/* Terminal Output */}
            <div className="p-8 h-80 overflow-y-auto font-mono text-xs space-y-3 custom-scrollbar crt-flicker">
              {logs.map((log, i) => (
                <div key={i} className={`${log.startsWith('>') ? 'text-zinc-400' : 'text-cyan-500'}`}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Terminal Input */}
            <div className="p-6 bg-zinc-900/20 border-t border-white/5">
              <div className="flex gap-4">
                <span className="text-cyan-500 font-bold">$</span>
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && processCommand(input)}
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-700 font-mono"
                  placeholder="Execute neural command or ask AI..."
                />
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
