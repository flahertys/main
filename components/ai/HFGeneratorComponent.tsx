"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

export function HFGeneratorComponent() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [model, setModel] = useState("mistralai/Mistral-7B-Instruct-v0.1");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);

  const promptTemplates = [
    {
      label: "Beginner trading checklist",
      value: "Create a beginner-friendly daily trading checklist with risk limits and a simple review routine.",
    },
    {
      label: "Social post",
      value: "Write a short, clear social post explaining today's market plan in plain English.",
    },
    {
      label: "Learning plan",
      value: "Build a 7-day learning plan for someone new to crypto and stock trading.",
    },
  ] as const;

  const generateText = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setOutput("");
    setStatus("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          temperature,
          maxTokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.hint || data?.error || `API error: ${response.statusText}`);
      }

      if (!data.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setOutput(data.text);
      setStatus(`Model: ${data.model || model}`);
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

        <p className="text-sm text-emerald-100/75 mb-4">
          Simple mode: choose a template, edit one sentence, then click <strong>Generate</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          {promptTemplates.map((template) => (
            <button
              key={template.label}
              onClick={() => setPrompt(template.value)}
              disabled={loading}
              className="rounded border border-emerald-500/20 bg-black/30 px-3 py-2 text-left text-xs text-emerald-100/85 hover:border-emerald-400/40 disabled:opacity-50"
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="hf-generator-model" className="block text-sm font-medium text-emerald-200 mb-2">Model (advanced)</label>
              <input
                id="hf-generator-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className="w-full rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-emerald-100 outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="hf-generator-temperature" className="block text-sm font-medium text-emerald-200 mb-2">Creativity</label>
              <input
                id="hf-generator-temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                disabled={loading}
                className="w-full rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-emerald-100 outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="hf-generator-max-tokens" className="block text-sm font-medium text-emerald-200 mb-2">Response length</label>
              <input
                id="hf-generator-max-tokens"
                type="number"
                min={16}
                max={2048}
                step={16}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                disabled={loading}
                className="w-full rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-emerald-100 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              What do you want to generate?
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

          {status && (
            <div className="rounded border border-cyan-500/30 bg-cyan-600/10 px-4 py-2 text-cyan-100 text-sm">
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-emerald-200/60 space-y-1">
        <p>• Powered by Hugging Face Inference API</p>
        <p>• Supports multiple LLM models</p>
        <p>• Built for low-cost usage (small prompts + right-sized output)</p>
        <p>• Set HF_API_TOKEN in .env.local to enable</p>
      </div>
    </div>
  );
}
