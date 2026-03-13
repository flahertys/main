let watchlist = new Set();
let alerts = [];
let lastUpdated = null;

// GET handler: filtering, sorting, pagination, snoozed, timestamp range
export async function GET(req) {
  const url = new URL(req.url);
  const severity = url.searchParams.get('severity');
  const symbol = url.searchParams.get('symbol');
  const delivered = url.searchParams.get('delivered');
  const snoozed = url.searchParams.get('snoozed');
  const sort = url.searchParams.get('sort') || 'timestamp';
  const order = url.searchParams.get('order') || 'desc';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let filteredAlerts = alerts;
  if (severity) filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  if (symbol) filteredAlerts = filteredAlerts.filter(a => a.summary.includes(symbol));
  if (delivered) filteredAlerts = filteredAlerts.filter(a => String(a.delivered) === delivered);
  if (snoozed) filteredAlerts = filteredAlerts.filter(a => String(a.snoozed) === snoozed);
  if (from) filteredAlerts = filteredAlerts.filter(a => new Date(a.timestamp) >= new Date(from));
  if (to) filteredAlerts = filteredAlerts.filter(a => new Date(a.timestamp) <= new Date(to));

  filteredAlerts = filteredAlerts.sort((a, b) => {
    if (sort === 'timestamp') {
      return order === 'desc' ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp);
    }
    return 0;
  });

  const total = filteredAlerts.length;
  const pagedAlerts = filteredAlerts.slice((page - 1) * pageSize, page * pageSize);

  // ETag for caching
  const etag = `${lastUpdated}-${total}`;
  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  // Minimal payload: only send necessary fields
  const minimalAlerts = pagedAlerts.map(({ summary, severity, delivered, snoozed, timestamp }) => ({ summary, severity, delivered, snoozed, timestamp }));

  return new Response(
    JSON.stringify({
      items: Array.from(watchlist).map(symbol => ({ symbol })),
      alerts: minimalAlerts,
      meta: {
        total,
        page,
        pageSize,
        lastUpdated,
        watchlistCount: watchlist.size,
        alertCount: alerts.length
      }
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60, must-revalidate',
        'ETag': etag,
        'Last-Modified': lastUpdated || new Date().toISOString()
      }
    }
  );
}

// POST handler: batch add
export async function POST(req) {
  let { symbol, symbols } = await req.json();
  let added = [];
  if (symbols && Array.isArray(symbols)) {
    for (const sym of symbols) {
      if (typeof sym === 'string' && !watchlist.has(sym)) {
        watchlist.add(sym);
        alerts.push({ summary: `Alert for ${sym}`, severity: 'watch', delivered: false, snoozed: false, timestamp: new Date().toISOString() });
        added.push(sym);
      }
    }
  } else if (symbol && typeof symbol === 'string' && !watchlist.has(symbol)) {
    watchlist.add(symbol);
    alerts.push({ summary: `Alert for ${symbol}`, severity: 'watch', delivered: false, snoozed: false, timestamp: new Date().toISOString() });
    added.push(symbol);
  }
  lastUpdated = new Date().toISOString();
  return Response.json({ ok: true, added });
}

// DELETE handler: batch remove
export async function DELETE(req) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const symbols = url.searchParams.getAll('symbols');
  let removed = [];
  if (symbols && symbols.length > 0) {
    for (const sym of symbols) {
      if (watchlist.has(sym)) {
        watchlist.delete(sym);
        removed.push(sym);
      }
    }
    alerts = alerts.filter(alert => !symbols.some(sym => alert.summary.includes(sym)));
  } else if (symbol && watchlist.has(symbol)) {
    watchlist.delete(symbol);
    removed.push(symbol);
    alerts = alerts.filter(alert => !alert.summary.includes(symbol));
  }
  lastUpdated = new Date().toISOString();
  return Response.json({ ok: true, removed });
}

// PATCH handler: mark alert as delivered/snoozed, support snooze duration
export async function PATCH(req) {
  const { summary, delivered, snoozed, snoozeUntil } = await req.json();
  let updated = false;
  alerts = alerts.map(alert => {
    if (alert.summary === summary) {
      updated = true;
      return {
        ...alert,
        delivered: delivered ?? alert.delivered,
        snoozed: snoozed ?? alert.snoozed,
        snoozeUntil: snoozeUntil ?? alert.snoozeUntil
      };
    }
    return alert;
  });
  lastUpdated = new Date().toISOString();
  return Response.json({ ok: updated });
}
