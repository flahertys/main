import { HFChatComponent } from "@/components/ai/HFChatComponent";
import { HFGeneratorComponent } from "@/components/ai/HFGeneratorComponent";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { AlertCircle, Brain, MessageSquare } from "lucide-react";

export const metadata = {
  title: "AI Hub - Hugging Face LLM Integration",
  description: "Generate text, chat, and explore AI capabilities with Hugging Face",
};

export default function AIHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="theme-badge inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold mb-6">
            <Brain className="w-4 h-4" />
            AI HUB
          </div>

          <h1 className="theme-title text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Hugging Face LLM Integration
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Generate text, chat with AI, and explore language models powered by Hugging Face
          </p>
        </div>

        {/* Setup Alert */}
        <div className="theme-panel theme-panel--warning mb-12 p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-yellow-200 mb-2">Setup Required</h3>
            <p className="text-yellow-100/80 text-sm mb-3">
              To use AI features, you need to set up your Hugging Face API token:
            </p>
            <ol className="text-yellow-100/70 text-sm space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline">huggingface.co/settings/tokens</a></li>
              <li>Create a new API token (read access is fine)</li>
              <li>Copy the token and add to <code className="bg-black/40 px-2 py-1 rounded">.env.local</code></li>
              <li>Set <code className="bg-black/40 px-2 py-1 rounded">HF_API_TOKEN=hf_your_token_here</code></li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Chat */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-300">Chat</h2>
            </div>
            <HFChatComponent />
          </div>

          {/* Generator */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-emerald-300">Generator</h2>
            </div>
            <HFGeneratorComponent />
          </div>
        </div>

        {/* Models Info */}
        <div className="theme-panel p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Models</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-emerald-300 mb-3">💰 Free/Fast</h3>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">→</span>
                  <div>
                    <div className="font-semibold">distilgpt2</div>
                    <div className="text-emerald-200/60">Smallest, fastest GPT2</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">→</span>
                  <div>
                    <div className="font-semibold">gpt2</div>
                    <div className="text-emerald-200/60">Classic language model</div>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-cyan-300 mb-3">🚀 Recommended</h3>
              <ul className="space-y-2 text-sm text-cyan-100">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">→</span>
                  <div>
                    <div className="font-semibold">mistralai/Mistral-7B-Instruct-v0.1</div>
                    <div className="text-cyan-200/60">Fast, high-quality (default)</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">→</span>
                  <div>
                    <div className="font-semibold">meta-llama/Llama-2-7b</div>
                    <div className="text-cyan-200/60">Powerful open-source LLM</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-cyan-500/20">
            <h3 className="font-bold text-blue-300 mb-3">📚 Documentation</h3>
            <p className="text-blue-100/80 text-sm mb-4">
              Change models in <code className="bg-black/40 px-2 py-1 rounded">.env.local</code>:
            </p>
            <div className="bg-black/60 border border-blue-500/20 rounded p-4 text-blue-100 text-xs font-mono space-y-1">
              <div># Fastest</div>
              <div>HF_MODEL_ID=distilgpt2</div>
              <div className="mt-2"># Recommended</div>
              <div>HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1</div>
              <div className="mt-2"># Best Quality</div>
              <div>HF_MODEL_ID=meta-llama/Llama-2-7b</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon="🤖"
            title="Text Generation"
            description="Generate creative content, code, and more using state-of-the-art LLMs"
          />
          <FeatureCard
            icon="💬"
            title="Chat Interface"
            description="Have conversations with AI while maintaining context history"
          />
          <FeatureCard
            icon="⚡"
            title="Streaming"
            description="Get real-time token streaming for faster perceived response times"
          />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="theme-panel p-6">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}
