"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

export function HFGeneratorComponent() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateText = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setOutput(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-panel w-full p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-300 mb-4">
          Text Generator
        </h2>

        <div className="space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
              disabled={loading}
              className="w-full rounded border border-emerald-500/30 bg-black/40 px-4 py-3 text-emerald-100 placeholder-emerald-200/40 outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateText}
            disabled={!prompt.trim() || loading}
            className="theme-cta theme-cta--loud w-full px-6 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Generating..." : "Generate"}
          </button>

          {/* Error */}
          {error && (
            <div className="rounded border border-red-500/30 bg-red-600/20 px-4 py-3 text-red-200">
              {error}
            </div>
          )}

          {/* Output */}
          {output && (
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Generated Output
              </label>
              <div className="rounded border border-cyan-500/30 bg-cyan-600/10 px-4 py-3 text-cyan-100 whitespace-pre-wrap">
                {output}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-emerald-200/60 space-y-1">
        <p>• Powered by Hugging Face Inference API</p>
        <p>• Supports multiple LLM models</p>
        <p>• Set HF_API_TOKEN in .env.local to enable</p>
      </div>
    </div>
  );
}
