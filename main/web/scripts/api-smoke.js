const baseUrl = (
  process.env.API_BASE_URL ||
  process.env.HANDSHAKE_BASE_URL ||
  "https://tradehaxai.tech"
).replace(/\/$/, "");

async function withTimeout(promise, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const checks = [];

  const health = await withTimeout((signal) =>
    fetch(`${baseUrl}/__health`, { signal })
  );
  checks.push({
    name: "GET /__health",
    ok: health.ok,
    detail: `status=${health.status}`,
  });

  const crypto = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/data/crypto?symbol=BTC`, { signal })
  );
  let cryptoOk = crypto.ok;
  let cryptoDetail = `status=${crypto.status}`;

  if (crypto.ok) {
    const cryptoJson = await crypto.json();
    cryptoOk = cryptoJson?.symbol === "BTC";
    cryptoDetail = `status=${crypto.status}, symbol=${cryptoJson?.symbol || "n/a"}`;
  }

  checks.push({
    name: "GET /api/data/crypto?symbol=BTC",
    ok: cryptoOk,
    detail: cryptoDetail,
  });

  const chat = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Quick BTC setup summary" }],
      }),
      signal,
    })
  );

  let chatOk = chat.ok;
  let chatDetail = `status=${chat.status}`;

  if (chat.ok) {
    const chatJson = await chat.json();
    chatOk = Boolean(chatJson?.response);
    chatDetail = `status=${chat.status}, provider=${chatJson?.provider || "n/a"}`;
  }

  checks.push({
    name: "POST /api/ai/chat",
    ok: chatOk,
    detail: chatDetail,
  });

  const supabase = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/supabase/health`, { signal })
  );
  checks.push({
    name: "GET /api/supabase/health",
    ok: [200, 500].includes(supabase.status),
    detail: `status=${supabase.status}`,
  });

  const unusual = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/signals/unusual?symbols=BTC,ETH,SOL&limit=5`, { signal })
  );

  let unusualOk = unusual.ok;
  let unusualDetail = `status=${unusual.status}`;

  if (unusual.ok) {
    const unusualJson = await unusual.json();
    unusualOk = Array.isArray(unusualJson?.opportunities);
    unusualDetail = `status=${unusual.status}, flagged=${unusualJson?.totalFlagged ?? "n/a"}`;
  }

  checks.push({
    name: "GET /api/signals/unusual",
    ok: unusualOk,
    detail: unusualDetail,
  });

  console.log(`API smoke base: ${baseUrl}`);
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"}  ${check.name} (${check.detail})`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(`FAIL  api-smoke crashed: ${error.message}`);
  process.exit(1);
});

