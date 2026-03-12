const BASE_URL = (process.env.HANDSHAKE_BASE_URL || "https://tradehax.net").replace(/\/$/, "");
const WWW_URL = "https://www.tradehax.net";

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, text, json };
}

async function run() {
  const failures = [];

  const checks = [
    {
      name: "root",
      run: async () => {
        const { response, text } = await fetchJson(`${BASE_URL}/`);
        if (!response.ok || !text.toLowerCase().includes("<div id=\"root\"")) {
          throw new Error(`Expected HTML app shell with #root (status ${response.status})`);
        }
      },
    },
    {
      name: "trading route",
      run: async () => {
        const { response } = await fetchJson(`${BASE_URL}/trading`);
        if (!response.ok) {
          throw new Error(`Expected 2xx response (status ${response.status})`);
        }
      },
    },
    {
      name: "tradehax route",
      run: async () => {
        const { response } = await fetchJson(`${BASE_URL}/tradehax`);
        if (!response.ok) {
          throw new Error(`Expected 2xx response (status ${response.status})`);
        }
      },
    },
    {
      name: "health",
      run: async () => {
        const { response, json } = await fetchJson(`${BASE_URL}/__health`);
        if (!response.ok || !json || json.ok !== true) {
          throw new Error(`Expected { ok: true } JSON payload (status ${response.status})`);
        }
      },
    },
    {
      name: "crypto api",
      run: async () => {
        const { response, json } = await fetchJson(`${BASE_URL}/api/data/crypto?symbol=BTC`);
        if (!response.ok || !json || json.symbol !== "BTC") {
          throw new Error(`Expected BTC payload (status ${response.status})`);
        }
      },
    },
    {
      name: "ai chat api",
      run: async () => {
        const { response, json, text } = await fetchJson(`${BASE_URL}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "health handshake" }] }),
        });

        if (!response.ok || !json || typeof json.response !== "string") {
          const payloadPreview = (json ? JSON.stringify(json) : text || "<empty>").slice(0, 300);
          throw new Error(`Expected AI response payload (status ${response.status}) payload=${payloadPreview}`);
        }
      },
    },
    {
      name: "www domain",
      run: async () => {
        const { response } = await fetchJson(`${WWW_URL}/`);
        if (!response.ok) {
          throw new Error(`Expected 2xx response (status ${response.status})`);
        }
      },
    },
  ];

  for (const check of checks) {
    try {
      await check.run();
      console.log(`OK: ${check.name}`);
    } catch (error) {
      failures.push(`FAIL: ${check.name} - ${error.message}`);
      console.error(`FAIL: ${check.name} - ${error.message}`);
    }
  }

  if (failures.length > 0) {
    process.exit(1);
  }

  console.log(`Handshake checks passed for ${BASE_URL}`);
}

run().catch((error) => {
  console.error(`Handshake script crashed: ${error.message}`);
  process.exit(1);
});

