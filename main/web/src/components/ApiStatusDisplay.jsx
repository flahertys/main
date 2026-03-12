import React, { useEffect, useState } from 'react';

const ENDPOINTS = [
  { name: 'Hugging Face', url: 'https://api-inference.huggingface.co/models' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'Supabase', url: process.env.VITE_SUPABASE_URL },
  { name: 'TradeHax AI Chat', url: '/api/ai/chat' },
  { name: 'Crypto Data', url: '/api/data/crypto' },
  { name: 'Unusual Signals', url: '/api/signals/unusual' },
];

function ApiStatusDisplay() {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    async function checkAll() {
      const results = await Promise.all(
        ENDPOINTS.map(async (ep) => {
          try {
            const res = await fetch(ep.url);
            return { name: ep.name, status: res.ok ? 'connected' : `error ${res.status}` };
          } catch (err) {
            return { name: ep.name, status: 'error', error: err.message };
          }
        })
      );
      setStatuses(results);
    }
    checkAll();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>API Connection Status</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td style={{ color: s.status === 'connected' ? 'green' : 'red' }}>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ApiStatusDisplay;

