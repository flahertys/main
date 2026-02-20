"use client";

import { WalletButton } from "@/components/counter/WalletButton";
import { HAX_TOKEN_CONFIG } from "@/lib/trading/hax-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Coins,
    Cpu,
    Plus,
    RotateCw,
    Send,
    ShieldAlert,
    Sparkles,
    TrendingUp,
    Wand2,
    Zap
} from "lucide-react";
import { useEffect, useState } from "react";

type HubTab = "CHAT" | "IMAGE_GEN" | "MARKET";

interface Message {
  role: "user" | "assistant";
  content: string;
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

const NeuralBackground = () => (
  <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <pattern id="neural-net" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" className="text-cyan-500/40" />
        <path d="M2 2 L100 2 M2 2 L2 100" stroke="currentColor" strokeWidth="0.1" className="text-cyan-500/10" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#neural-net)" />
      <motion.circle
        animate={{
          cx: ["10%", "90%", "10%"],
          cy: ["10%", "50%", "90%", "10%"]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        r="2" fill="cyan" className="blur-[2px]"
      />
      <motion.circle
        animate={{
          cx: ["90%", "10%", "90%"],
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
  }, []);

  useEffect(() => {
    localStorage.setItem("tradehax_ai_chat_model", selectedChatModel);
  }, [selectedChatModel]);

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
    { role: "assistant", content: "NEURAL_LINK_ESTABLISHED. How can I assist with your trading or creative tasks today?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || isCharging) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, userId: "landing_hub", model: selectedChatModel })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response || "ERROR: NO_RESPONSE" }]);
      incrementUsage();
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "ERROR: NEURAL_TIMEOUT" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- IMAGE GEN LOGIC ---
  const [imgPrompt, setImgPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("NEURAL_DIFF_V4");
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isImgLoading, setIsImgLoading] = useState(false);

  const imageModels = [
    { id: "NEURAL_DIFF_V4", name: "Neural Diff V4", provider: "SDXL", label: "UNCENSORED" },
    { id: "FLUX_CORE_X", name: "Flux Core X", provider: "FLUX.1", label: "HIGH_FIDELITY" },
    { id: "ASTRA_LINK", name: "Astra Link", provider: "MIDJ-V6", label: "CREATIVE" },
  ];

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim() || isImgLoading || isCharging) return;
    setIsImgLoading(true);
    setGeneratedImg(null);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt,
          style: "general",
          model: selectedModel
        })
      });
      const data = await res.json();
      if (data.url) {
        setGeneratedImg(data.url);
        incrementUsage();
      }
    } catch (err) {
      console.error("Image gen failed", err);
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
                    {tab === "CHAT" ? "GPT_CHAT" : tab === "IMAGE_GEN" ? "NEURAL_IMG" : "MARKET_PICKER"}
                  </button>
                ))}
              </div>
              <div className="w-full max-w-[280px] sm:max-w-[300px] md:w-[300px] rounded-xl border border-cyan-500/25 bg-[rgba(10,12,16,0.88)] px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-[0_0_18px_rgba(6,182,212,0.12)]">
                <label className="mb-1 block text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.2em] text-cyan-300/85">
                  LLM Model
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
                  {isCharging ? 'CRYPTO_CHARGE_REQUIRED' : `FREE_TIER: ${FREE_USAGE_LIMIT - usageCount}/${FREE_USAGE_LIMIT} REMAINING`}
                </span>
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
                        {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                              msg.role === 'user'
                                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100"
                                : "bg-zinc-900/80 border border-white/5 text-zinc-300"
                            }`}>
                              <p className="font-mono text-[10px] mb-1 opacity-50 uppercase tracking-widest">{msg.role}</p>
                              {msg.content}
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

                      <form onSubmit={handleSendMessage} className="relative">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Command neural engine..."
                          className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-all"
                        />
                        <button
                          type="submit"
                          aria-label="Send chat message"
                          title="Send chat message"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-black hover:scale-105 transition-transform"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
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
                          placeholder="Describe the neural construct to visualize..."
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
                          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500 text-black text-[10px] font-black uppercase italic hover:scale-105 transition-transform">
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
                      <span>Compute_Load</span>
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
                      <span>Context_Retention</span>
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
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Uncensored_Mode: ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                    <Sparkles className="w-4 h-4 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Creative_Bypass: ENABLED</span>
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
