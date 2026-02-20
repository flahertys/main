import type {
    TradeOutcomeRecord,
    TradingBehaviorProfile,
} from "@/lib/ai/trading-personalization";
import type { TrainingBenchmarkStage } from "@/lib/ai/training-benchmarks";

type TrainingStorageMode = "memory" | "supabase";

type SupabaseConfig = {
	baseUrl: string;
	serviceKey: string;
	benchmarksTable: string;
	profilesTable: string;
	outcomesTable: string;
};

type PersistedBenchmarkStageRow = {
	id: string;
	updated_at: string;
	payload: TrainingBenchmarkStage;
};

type PersistedProfileRow = {
	id: string;
	user_id: string;
	updated_at: string;
	profile_json: TradingBehaviorProfile;
	trades_tracked: number;
	wins: number;
	losses: number;
	avg_pnl_percent: number;
	confidence_avg: number;
	user_lift: number;
};

type PersistedOutcomeRow = {
	id: string;
	user_id: string;
	timestamp: string;
	symbol: string;
	regime: string;
	side: string;
	pnl_percent: number;
	confidence: number;
	indicators_used: string[];
	notes: string;
	payload: TradeOutcomeRecord;
};

function nowIso() {
	return new Date().toISOString();
}

function resolveStorageMode(): TrainingStorageMode {
	const explicit = String(process.env.TRADEHAX_AI_TRAINING_STORAGE || "")
		.trim()
		.toLowerCase();
	if (explicit === "memory" || explicit === "supabase") {
		return explicit;
	}

	const behavior = String(process.env.TRADEHAX_AI_BEHAVIOR_STORAGE || "")
		.trim()
		.toLowerCase();
	if (behavior === "memory" || behavior === "supabase") {
		return behavior as TrainingStorageMode;
	}

	if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
		return "supabase";
	}

	return "memory";
}

function getSupabaseConfig(): SupabaseConfig | null {
	const baseUrl = String(process.env.SUPABASE_URL || "").trim();
	const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
	if (!baseUrl || !serviceKey) {
		return null;
	}

	return {
		baseUrl: baseUrl.replace(/\/$/, ""),
		serviceKey,
		benchmarksTable: String(process.env.TRADEHAX_SUPABASE_AI_BENCHMARKS_TABLE || "ai_training_benchmarks").trim(),
		profilesTable: String(
			process.env.TRADEHAX_SUPABASE_AI_PERSONALIZATION_TABLE || "ai_trading_personalization_profiles",
		).trim(),
		outcomesTable: String(process.env.TRADEHAX_SUPABASE_AI_TRADE_OUTCOMES_TABLE || "ai_trading_trade_outcomes").trim(),
	};
}

function getConfig() {
	const mode = resolveStorageMode();
	const supabase = getSupabaseConfig();
	return {
		mode,
		supabase,
		shouldUseSupabase: mode === "supabase" && Boolean(supabase),
	};
}

function headers(config: SupabaseConfig, extra?: HeadersInit) {
	return {
		apikey: config.serviceKey,
		Authorization: `Bearer ${config.serviceKey}`,
		"Content-Type": "application/json",
		...(extra || {}),
	};
}

async function requestJson<T>(
	config: SupabaseConfig,
	path: string,
	init: RequestInit,
	timeoutMs = 10_000,
) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
			...init,
			headers: headers(config, init.headers),
			signal: controller.signal,
			cache: "no-store",
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Supabase ${response.status}: ${text.slice(0, 280)}`);
		}

		if (response.status === 204) {
			return null as T;
		}

		const text = await response.text();
		if (!text) {
			return null as T;
		}

		return JSON.parse(text) as T;
	} finally {
		clearTimeout(timer);
	}
}

function encodeEq(value: string) {
	return `eq.${encodeURIComponent(value)}`;
}

function toUserLift(profile: TradingBehaviorProfile) {
	const trades = Math.max(1, profile.tradesTracked);
	const winRate = profile.wins / trades;
	const pnlComponent = profile.avgPnlPercent / 100;
	const lift = (winRate - 0.5) + pnlComponent;
	return Number.parseFloat(lift.toFixed(4));
}

export async function getTrainingPersistenceStatus() {
	const config = getConfig();
	return {
		mode: config.mode,
		configured: Boolean(config.supabase),
		shouldUseSupabase: config.shouldUseSupabase,
		benchmarksTable: config.supabase?.benchmarksTable || "memory_store_only",
		profilesTable: config.supabase?.profilesTable || "memory_store_only",
		outcomesTable: config.supabase?.outcomesTable || "memory_store_only",
		generatedAt: nowIso(),
	};
}

export async function persistTrainingBenchmarkStages(stages: TrainingBenchmarkStage[]) {
	const config = getConfig();
	if (!config.shouldUseSupabase || !config.supabase) {
		return {
			persisted: false,
			mode: "memory" as const,
			reason: "supabase_not_configured",
		};
	}

	const rows: PersistedBenchmarkStageRow[] = stages.map((stage) => ({
		id: stage.id,
		updated_at: stage.updatedAt || nowIso(),
		payload: stage,
	}));

	await requestJson<unknown>(
		config.supabase,
		`${config.supabase.benchmarksTable}?on_conflict=id`,
		{
			method: "POST",
			headers: {
				Prefer: "resolution=merge-duplicates,return=minimal",
			},
			body: JSON.stringify(rows),
		},
	);

	return {
		persisted: true,
		mode: "supabase" as const,
		rows: rows.length,
	};
}

export async function listPersistedTrainingBenchmarkStages() {
	const config = getConfig();
	if (!config.shouldUseSupabase || !config.supabase) {
		return [] as TrainingBenchmarkStage[];
	}

	const rows = await requestJson<PersistedBenchmarkStageRow[]>(
		config.supabase,
		`${config.supabase.benchmarksTable}?select=*&order=id.asc&limit=64`,
		{ method: "GET" },
	);

	return (rows || [])
		.map((row) => (row && typeof row.payload === "object" ? row.payload : null))
		.filter((row): row is TrainingBenchmarkStage => Boolean(row));
}

export async function persistTradingBehaviorProfile(profile: TradingBehaviorProfile) {
	const config = getConfig();
	if (!config.shouldUseSupabase || !config.supabase) {
		return {
			persisted: false,
			mode: "memory" as const,
			reason: "supabase_not_configured",
		};
	}

	const row: PersistedProfileRow = {
		id: `profile_${profile.userId}`,
		user_id: profile.userId,
		updated_at: profile.updatedAt || nowIso(),
		profile_json: profile,
		trades_tracked: profile.tradesTracked,
		wins: profile.wins,
		losses: profile.losses,
		avg_pnl_percent: profile.avgPnlPercent,
		confidence_avg: profile.confidenceAvg,
		user_lift: toUserLift(profile),
	};

	await requestJson<unknown>(
		config.supabase,
		`${config.supabase.profilesTable}?on_conflict=id`,
		{
			method: "POST",
			headers: {
				Prefer: "resolution=merge-duplicates,return=minimal",
			},
			body: JSON.stringify([row]),
		},
	);

	return {
		persisted: true,
		mode: "supabase" as const,
		id: row.id,
	};
}

export async function getPersistedTradingBehaviorProfile(userId: string) {
	const config = getConfig();
	if (!config.shouldUseSupabase || !config.supabase) {
		return null as TradingBehaviorProfile | null;
	}

	const rows = await requestJson<PersistedProfileRow[]>(
		config.supabase,
		`${config.supabase.profilesTable}?user_id=${encodeEq(userId)}&limit=1`,
		{ method: "GET" },
	);

	const row = Array.isArray(rows) ? rows[0] : null;
	if (!row || !row.profile_json || typeof row.profile_json !== "object") {
		return null;
	}
	return row.profile_json;
}

export async function listPersistedTradingBehaviorProfiles(limit = 120) {
	const config = getConfig();
	if (!config.shouldUseSupabase || !config.supabase) {
		return [] as TradingBehaviorProfile[];
	}

	const boundedLimit = Math.min(1000, Math.max(1, Math.floor(limit)));
	const rows = await requestJson<PersistedProfileRow[]>(
		config.supabase,
		`${config.supabase.profilesTable}?select=*&order=trades_tracked.desc&limit=${boundedLimit}`,
		{ method: "GET" },
	);

	return (rows || [])
		.map((row) => (row && typeof row.profile_json === "object" ? row.profile_json : null))
		.filter((row): row is TradingBehaviorProfile => Boolean(row));
}

export async function persistTradeOutcome(userId: string, outcome: TradeOutcomeRecord) {
	const config = getConfig();
	if (!config.shouldUseSupabase || !config.supabase) {
		return {
			persisted: false,
			mode: "memory" as const,
			reason: "supabase_not_configured",
		};
	}

	const row: PersistedOutcomeRow = {
		id: outcome.id,
		user_id: userId,
		timestamp: outcome.timestamp,
		symbol: outcome.symbol,
		regime: outcome.regime,
		side: outcome.side,
		pnl_percent: outcome.pnlPercent,
		confidence: outcome.confidence,
		indicators_used: outcome.indicatorsUsed,
		notes: outcome.notes || "",
		payload: outcome,
	};

	await requestJson<unknown>(
		config.supabase,
		`${config.supabase.outcomesTable}?on_conflict=id`,
		{
			method: "POST",
			headers: {
				Prefer: "resolution=merge-duplicates,return=minimal",
			},
			body: JSON.stringify([row]),
		},
	);

	return {
		persisted: true,
		mode: "supabase" as const,
		id: row.id,
	};
}
/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

