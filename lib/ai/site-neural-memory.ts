"use client";

export type NeuralEventSource = "ai_chat" | "ai_custom" | "ai_image" | "intelligence" | "discord" | "system" | "ai_navigator";

export type NeuralArtifactType = "dataset" | "user_behavior" | "ticker_behavior" | "learning_environment" | "event";

export type NeuralConsent = {
  analytics?: boolean;
  training?: boolean;
};

export type NeuralVaultRecord = {
  id: string;
  createdAt: string;
  type: NeuralArtifactType;
  event: string;
  userId: string;
  source: NeuralEventSource;
  route: string;
  prompt: string;
  response: string;
  metadata: Record<string, unknown>;
};

export type TrackNeuralEventInput = {
  event: string;
  userId: string;
  prompt: string;
  response: string;
  source?: NeuralEventSource;
  route?: string;
  metadata?: Record<string, unknown>;
  consent?: NeuralConsent;
  type?: NeuralArtifactType;
};

const NEURAL_VAULT_STORAGE_KEY = "tradehax_neural_vault_v1";
const NEURAL_VAULT_MAX_RECORDS = 200;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeString(value: unknown, fallback: string, maxLength: number) {
  const text = String(value ?? fallback).trim();
  if (!text) return fallback;
  return text.slice(0, maxLength);
}

function normalizeMetadata(input?: Record<string, unknown>) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input).slice(0, 20)) {
    const safeKey = normalizeString(key, "key", 50).toLowerCase();
    if (!safeKey) continue;

    if (typeof value === "string") {
      output[safeKey] = normalizeString(value, "", 250);
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      output[safeKey] = value;
      continue;
    }

    if (value && typeof value === "object") {
      output[safeKey] = normalizeString(JSON.stringify(value), "", 500);
    }
  }

  return output;
}

function getNeuralVault() {
  if (!canUseBrowserStorage()) return [] as NeuralVaultRecord[];

  try {
    const raw = window.localStorage.getItem(NEURAL_VAULT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NeuralVaultRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, NEURAL_VAULT_MAX_RECORDS);
  } catch {
    return [];
  }
}

function setNeuralVault(records: NeuralVaultRecord[]) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(NEURAL_VAULT_STORAGE_KEY, JSON.stringify(records.slice(0, NEURAL_VAULT_MAX_RECORDS)));
}

function pushNeuralVaultRecord(record: NeuralVaultRecord) {
  const existing = getNeuralVault();
  setNeuralVault([record, ...existing].slice(0, NEURAL_VAULT_MAX_RECORDS));
}

function toRecord(input: TrackNeuralEventInput): NeuralVaultRecord {
  const createdAt = new Date().toISOString();
  const type = input.type || "event";
  const route = normalizeString(input.route, "unknown", 120);
  const userId = normalizeString(input.userId, "anonymous", 120).toLowerCase();
  const source = input.source || "system";
  const event = normalizeString(input.event, "event", 120);

  return {
    id: `nvr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    type,
    event,
    route,
    userId,
    source,
    prompt: normalizeString(input.prompt, event, 1000),
    response: normalizeString(input.response, "tracked", 1000),
    metadata: normalizeMetadata(input.metadata),
  };
}

export async function trackNeuralEvent(input: TrackNeuralEventInput) {
  const record = toRecord(input);
  pushNeuralVaultRecord(record);

  try {
    const response = await fetch("/api/ai/behavior/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: record.event,
        source: record.source,
        userId: record.userId,
        prompt: record.prompt,
        response: record.response,
        metadata: {
          type: record.type,
          route: record.route,
          ...record.metadata,
        },
        consent: {
          analytics: input.consent?.analytics !== false,
          training: input.consent?.training === true,
        },
      }),
    });

    const payload = await response.json();
    return {
      ok: response.ok && payload?.ok === true,
      accepted: payload?.accepted === true,
      record,
    };
  } catch {
    return {
      ok: false,
      accepted: false,
      record,
    };
  }
}

export function getLocalNeuralVault() {
  return getNeuralVault();
}

export function exportLocalNeuralVault() {
  const records = getNeuralVault();
  if (!canUseBrowserStorage()) {
    return { ok: false, count: 0 };
  }

  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tradehax-neural-vault-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    ok: true,
    count: records.length,
  };
}

export async function saveDatasetArtifact(input: {
  name: string;
  rows: number;
  notes?: string;
  userId: string;
  source?: NeuralEventSource;
  route?: string;
  consent?: NeuralConsent;
}) {
  const title = normalizeString(input.name, "dataset", 80);
  const notes = normalizeString(input.notes, "", 220);
  return trackNeuralEvent({
    type: "dataset",
    event: "dataset_saved",
    userId: input.userId,
    source: input.source || "system",
    route: input.route,
    consent: input.consent,
    prompt: `DATASET ${title}`,
    response: notes || "Dataset snapshot saved.",
    metadata: {
      dataset_name: title,
      row_count: Math.max(0, Math.floor(input.rows || 0)),
      notes,
    },
  });
}

export async function saveUserBehaviorArtifact(input: {
  behavior: string;
  observation: string;
  userId: string;
  source?: NeuralEventSource;
  route?: string;
  consent?: NeuralConsent;
}) {
  const behavior = normalizeString(input.behavior, "user behavior", 100);
  const observation = normalizeString(input.observation, "behavior captured", 240);

  return trackNeuralEvent({
    type: "user_behavior",
    event: "user_behavior_saved",
    userId: input.userId,
    source: input.source || "system",
    route: input.route,
    consent: input.consent,
    prompt: behavior,
    response: observation,
    metadata: {
      behavior,
      observation,
    },
  });
}

export async function saveTickerBehaviorArtifact(input: {
  ticker: string;
  pattern: string;
  userId: string;
  source?: NeuralEventSource;
  route?: string;
  consent?: NeuralConsent;
}) {
  const ticker = normalizeString(input.ticker, "TICKER", 20).toUpperCase();
  const pattern = normalizeString(input.pattern, "Pattern captured", 240);

  return trackNeuralEvent({
    type: "ticker_behavior",
    event: "ticker_behavior_saved",
    userId: input.userId,
    source: input.source || "system",
    route: input.route,
    consent: input.consent,
    prompt: `${ticker} behavior`,
    response: pattern,
    metadata: {
      ticker,
      pattern,
    },
  });
}

export async function saveLearningEnvironmentArtifact(input: {
  environment: string;
  hypothesis: string;
  userId: string;
  source?: NeuralEventSource;
  route?: string;
  consent?: NeuralConsent;
}) {
  const environment = normalizeString(input.environment, "environment", 120);
  const hypothesis = normalizeString(input.hypothesis, "No hypothesis provided", 260);

  return trackNeuralEvent({
    type: "learning_environment",
    event: "learning_environment_saved",
    userId: input.userId,
    source: input.source || "system",
    route: input.route,
    consent: input.consent,
    prompt: environment,
    response: hypothesis,
    metadata: {
      environment,
      hypothesis,
    },
  });
}
