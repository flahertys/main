"use client";

import { motion } from "framer-motion";
import { Cpu, RotateCw, Sparkles, Wand2 } from "lucide-react";

type ImageModel = {
  id: string;
  name: string;
  provider: string;
  label: string;
};

type HubImageWorkspaceProps = {
  imageModels: ImageModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  imgPrompt: string;
  onImgPromptChange: (value: string) => void;
  onGenerateImage: () => void;
  isImgLoading: boolean;
  generatedImg: string | null;
  imageStatus: string;
};

export function HubImageWorkspace({
  imageModels,
  selectedModel,
  onSelectModel,
  imgPrompt,
  onImgPromptChange,
  onGenerateImage,
  isImgLoading,
  generatedImg,
  imageStatus,
}: HubImageWorkspaceProps) {
  return (
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
            onClick={() => onSelectModel(model.id)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedModel === model.id
                ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                : "bg-zinc-900/50 border-white/5 hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Cpu className={`w-4 h-4 ${selectedModel === model.id ? "text-cyan-400" : "text-zinc-600"}`} />
              <span
                className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  selectedModel === model.id ? "border-cyan-500/30 text-cyan-400" : "border-white/5 text-zinc-600"
                }`}
              >
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
          onChange={(event) => onImgPromptChange(event.target.value)}
          placeholder="Describe the image you want in one simple sentence..."
          className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-all resize-none"
        />
        <button
          onClick={onGenerateImage}
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
      {imageStatus && <p className="text-[11px] text-cyan-300/80 font-mono">{imageStatus}</p>}
    </motion.div>
  );
}
