/**
 * Grok-4 Client Integration
 * Example usage and utilities for integrating Grok-4 in React components
 */

interface GrokStreamChunk {
  chunk?: string;
  done?: boolean;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Stream a message to Grok-4 and handle the response
 * @param message - The user message to send
 * @param onChunk - Callback for each streamed chunk
 * @param onComplete - Callback when stream is complete
 * @param sessionId - Optional session ID for conversation history
 */
export async function streamGrokMessage(
  message: string,
  onChunk: (chunk: string) => void,
  onComplete: (usage: any) => void,
  sessionId?: string
): Promise<void> {
  try {
    const response = await fetch("/api/ai/grok", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response stream available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Process all complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];

        if (line.startsWith("data: ")) {
          try {
            const data: GrokStreamChunk = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.chunk) {
              onChunk(data.chunk);
            }

            if (data.done && data.usage) {
              onComplete(data.usage);
            }
          } catch (e) {
            console.error("Failed to parse stream chunk:", e);
          }
        }
      }

      // Keep the incomplete line in the buffer
      buffer = lines[lines.length - 1];
    }

    // Process any remaining data in buffer
    if (buffer.trim().startsWith("data: ")) {
      try {
        const data: GrokStreamChunk = JSON.parse(buffer.slice(6));
        if (data.done && data.usage) {
          onComplete(data.usage);
        }
      } catch (e) {
        console.error("Failed to parse final stream chunk:", e);
      }
    }
  } catch (error) {
    console.error("Grok streaming error:", error);
    throw error;
  }
}

/**
 * React Hook for using Grok-4 in components
 */
export function useGrok() {
  const [response, setResponse] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<any>(null);

  const askGrok = async (
    message: string,
    sessionId?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      await streamGrokMessage(
        message,
        (chunk) => {
          setResponse((prev) => prev + chunk);
        },
        (usage) => {
          setUsage(usage);
          setLoading(false);
        },
        sessionId
      );
    } catch (err: any) {
      setError(err.message || "Failed to get response from Grok-4");
      setLoading(false);
    }
  };

  return { response, loading, error, usage, askGrok };
}

/**
 * Example React component using Grok-4
 */
export function GrokChat() {
  const [input, setInput] = React.useState("");
  const { response, loading, error, usage, askGrok } = useGrok();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await askGrok(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-purple-500">⚡</span>
          Grok-4 Trading Assistant
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Powered by xAI Grok-4 for cryptocurrency analysis
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {response && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Grok-4:</div>
            <div className="whitespace-pre-wrap break-words">{response}</div>
            {usage && (
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                <div>
                  Tokens: {usage.promptTokens} input + {usage.completionTokens}{" "}
                  output
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="animate-spin">⚙️</div>
            Thinking...
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
            Error: {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-black">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crypto markets, trading strategies, DeFi..."
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg px-6 py-2 font-semibold transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

