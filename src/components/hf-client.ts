// src/components/hf-client.ts - Client-side wrapper for HF API calls in TradeHax.net
import { useState } from 'react';

export const useHfClient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callHfApi = async (prompt: string, task: string = 'text-generation', parameters: object = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hf-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, task, parameters }),
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data.output;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callHfApi, loading, error };
};

// Usage example in a component:
// const { callHfApi } = useHfClient();
// const result = await callHfApi('Generate a trading strategy', 'text-generation');
