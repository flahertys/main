"use client";

/**
 * ExchangeConnector — UI for adding/managing exchange API key connections.
 */

import { useState } from "react";
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { nanoid } from "@/lib/utils";
import type { ExchangeConnection, SupportedExchange } from "@/types/trading";

const EXCHANGE_OPTIONS: { value: SupportedExchange; label: string }[] = [
  { value: "binance", label: "Binance" },
  { value: "coinbase", label: "Coinbase" },
  { value: "kraken", label: "Kraken" },
  { value: "manual", label: "Manual (CSV)" },
];

interface ExchangeConnectorProps {
  connections: ExchangeConnection[];
  onChange: (connections: ExchangeConnection[]) => void;
}

/**
 * Manages exchange API connections with masked key display and test-connection flow.
 */
export function ExchangeConnector({ connections, onChange }: ExchangeConnectorProps) {
  const [adding, setAdding] = useState(false);
  const [newExchange, setNewExchange] = useState<SupportedExchange>("binance");
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  function handleAdd() {
    if (!newKey.trim()) return;
    const conn: ExchangeConnection = {
      id: nanoid(),
      exchange: newExchange,
      label: newLabel || (EXCHANGE_OPTIONS.find((e) => e.value === newExchange)?.label ?? newExchange),
      apiKey: newKey.trim(),
      status: "connected",
      lastSynced: new Date().toISOString(),
    };
    onChange([...connections, conn]);
    setNewKey("");
    setNewLabel("");
    setAdding(false);
  }

  function handleRemove(id: string) {
    onChange(connections.filter((c) => c.id !== id));
  }

  async function handleTest(id: string) {
    setTestingId(id);
    // Simulate connection test
    await new Promise((r) => setTimeout(r, 1200));
    onChange(
      connections.map((c) =>
        c.id === id ? { ...c, status: "connected", lastSynced: new Date().toISOString() } : c,
      ),
    );
    setTestingId(null);
  }

  const maskKey = (key: string) =>
    key.length > 4 ? `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 4, 16))}` : "••••";

  return (
    <div className="space-y-3">
      {/* Existing connections */}
      {connections.map((conn) => (
        <div
          key={conn.id}
          className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">{conn.label}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{conn.exchange}</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{maskKey(conn.apiKey)}</div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1">
            {conn.status === "connected" ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" aria-label="Connected" />
            ) : conn.status === "error" ? (
              <XCircle className="w-3.5 h-3.5 text-red-400" aria-label="Error" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" aria-label="Testing" />
            )}
            <span className="text-[10px] text-muted-foreground capitalize">{conn.status}</span>
          </div>

          {/* Test button */}
          <button
            type="button"
            onClick={() => handleTest(conn.id)}
            disabled={testingId === conn.id}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Test connection"
            title="Test connection"
          >
            {testingId === conn.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>

          {/* Remove */}
          <button
            type="button"
            onClick={() => handleRemove(conn.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove connection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add form */}
      {adding ? (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Exchange</label>
              <select
                value={newExchange}
                onChange={(e) => setNewExchange(e.target.value as SupportedExchange)}
                className="w-full text-xs rounded border border-border bg-background px-2 py-1.5 text-foreground"
                aria-label="Exchange"
              >
                {EXCHANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Label (optional)</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="My Binance"
                className="w-full text-xs rounded border border-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Connection label"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">API Key</label>
            <input
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Paste your read-only API key…"
              className="w-full text-xs rounded border border-border bg-background px-2 py-1.5 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="API key"
              autoComplete="off"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Use read-only API keys. Keys are stored client-side only and never logged.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newKey.trim()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add Connection
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 w-full justify-center text-xs px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> Add Exchange Connection
        </button>
      )}
    </div>
  );
}
