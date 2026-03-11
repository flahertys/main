"use client";

import { RotateCw, Sparkles, Wand2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface GeneratedImageResult {
  url: string;
  prompt: string;
  style: string;
  model?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  openMode?: boolean;
  timestamp: number;
}

export function ImageGeneratorComponent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"trading" | "nft" | "hero" | "general">(
    "general",
  );
  const [negativePrompt, setNegativePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageResult | null>(null);
  const [error, setError] = useState("");
  const [safetyMode, setSafetyMode] = useState<"open" | "standard">("open");
  const [mode, setMode] = useState<"simple" | "pro">("simple");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("tradehax_user_id") || "";
      if (stored.trim().length > 0) {
        setUserId(stored.trim());
      }
    }
  }, []);

  useEffect(() => {
    const starter = searchParams.get("starter");
    if (starter === "content-engine") {
      setPrompt("Design a clean social hero visual for a beginner trading education post with title-safe spacing");
      setStyle("hero");
      setMode("simple");
    }
  }, [searchParams]);

  const quickPrompts = [
    "A clean beginner trading dashboard with clear risk controls and green/red candles",
    "A minimal hero image for a finance app with AI assistant theme",
    "A modern crypto education thumbnail with simple visual icons and bold title area",
  ] as const;

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          style,
          width: style === "hero" ? 1920 : 1024,
          height: style === "hero" ? 1080 : 1024,
          safetyMode,
          userId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.error === "INSUFFICIENT_CREDITS") {
          const balance =
            typeof data?.credits?.balance === "number" ? Math.max(0, Math.floor(data.credits.balance)) : null;
          const suffix = balance !== null ? ` Current balance: ${balance} credits.` : "";
          throw new Error(`Insufficient AI credits for image generation.${suffix} Top up from Billing.`);
        }
        throw new Error(data?.error || `API error: ${response.statusText}`);
      }

      if (!data.ok) {
        throw new Error(data.error || "Generation failed");
      }

      const nextImage: GeneratedImageResult = {
        url: data.url,
        prompt: data.prompt || prompt,
        style: data.style || style,
        model: data.model,
        width: data.width,
        height: data.height,
        mimeType: data.mimeType,
        openMode: Boolean(data.openMode),
        timestamp: Date.now(),
      };

      setGeneratedImage(nextImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-panel p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
          <Wand2 className="w-6 h-6" />
          Image Generator
        </h2>

        <p className="text-sm text-cyan-100/75 mb-3">
          3-step flow: pick a quick prompt, choose style, click <strong>Generate Image</strong>.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setMode("simple")}
            disabled={loading}
            className={`rounded border px-3 py-2 text-xs font-semibold transition ${
              mode === "simple"
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                : "border-cyan-500/20 bg-black/30 text-cyan-100/75"
            } disabled:opacity-50`}
          >
            Simple mode
          </button>
          <button
            onClick={() => setMode("pro")}
            disabled={loading}
            className={`rounded border px-3 py-2 text-xs font-semibold transition ${
              mode === "pro"
                ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100"
                : "border-cyan-500/20 bg-black/30 text-cyan-100/75"
            } disabled:opacity-50`}
          >
            Pro controls
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-4">
          {quickPrompts.map((item) => (
            <button
              key={item}
              onClick={() => setPrompt(item)}
              disabled={loading}
              className="rounded border border-cyan-500/20 bg-black/30 px-3 py-2 text-left text-xs text-cyan-100/85 hover:border-cyan-400/40 disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className={mode === "pro" ? "" : "hidden"}>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Generation mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSafetyMode("open")}
                disabled={loading}
                className={`rounded border px-3 py-2 text-xs font-semibold transition ${
                  safetyMode === "open"
                    ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100"
                    : "border-cyan-500/20 bg-black/30 text-cyan-100/75"
                } disabled:opacity-50`}
              >
                Uncensored (prioritized)
              </button>
              <button
                onClick={() => setSafetyMode("standard")}
                disabled={loading}
                className={`rounded border px-3 py-2 text-xs font-semibold transition ${
                  safetyMode === "standard"
                    ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                    : "border-cyan-500/20 bg-black/30 text-cyan-100/75"
                } disabled:opacity-50`}
              >
                Standard safety
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">
              Describe your image (plain language)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Professional crypto trading chart showing bullish trend..."
              rows={4}
              disabled={loading}
              className="w-full rounded border border-cyan-500/30 bg-black/40 px-4 py-3 text-cyan-100 placeholder-cyan-200/40 outline-none resize-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">
              Negative prompt (optional)
            </label>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Elements to avoid, e.g. blurry, watermark, low quality"
              disabled={loading}
              className="w-full rounded border border-cyan-500/30 bg-black/40 px-4 py-3 text-cyan-100 placeholder-cyan-200/40 outline-none disabled:opacity-50"
            />
          </div>

          {/* Style Selector */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">
              Image style
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                ["general", "trading", "nft", "hero"] as const
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  disabled={loading}
                  className={`px-3 py-2 rounded text-xs font-bold uppercase transition ${
                    style === s
                      ? "bg-cyan-600 text-white"
                      : "bg-cyan-600/20 text-cyan-200 hover:bg-cyan-600/40"
                  } disabled:opacity-50`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || loading}
            className="theme-cta theme-cta--loud w-full px-6 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="rounded border border-red-500/30 bg-red-600/20 px-4 py-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="space-y-3">
              <div className="rounded border border-cyan-500/30 overflow-hidden bg-black/40">
                <img
                  src={generatedImage.url}
                  alt={generatedImage.prompt}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="w-full h-auto"
                />
              </div>
              <div className="text-xs text-cyan-200/70">
                <p>
                  <strong>Prompt:</strong> {generatedImage.prompt}
                </p>
                <p>
                  <strong>Style:</strong> {generatedImage.style}
                </p>
                {generatedImage.model ? (
                  <p>
                    <strong>Model:</strong> {generatedImage.model}
                  </p>
                ) : null}
                {generatedImage.width && generatedImage.height ? (
                  <p>
                    <strong>Resolution:</strong> {generatedImage.width}x{generatedImage.height}
                  </p>
                ) : null}
                <p>
                  <strong>Mode:</strong>{" "}
                  {generatedImage.openMode ? "Uncensored (Open)" : "Standard"}
                </p>
              </div>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = generatedImage.url;
                  link.download = `tradehax-${generatedImage.style}-${Date.now()}.png`;
                  link.click();
                }}
                className="theme-cta theme-cta--secondary w-full py-2 text-sm"
              >
                Download Image
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-cyan-200/60 space-y-1 border-t border-cyan-500/20 pt-4">
        <p>💡 Best results:</p>
        <p>• Keep prompts specific and short (1-2 sentences)</p>
        <p>• Mention visual style + purpose (thumbnail, hero, chart)</p>
        <p>• Trading charts and visualizations</p>
        <p>• NFT artwork generation</p>
        <p>• Hero images for websites</p>
        <p>• General creative images</p>
      </div>
    </div>
  );
}
