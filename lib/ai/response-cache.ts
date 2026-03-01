import crypto from "crypto";

export type CacheKey = string;
export type CachedResponse = {
  id: string;
  responseText: string;
  model: string;
  qualityScore: number;
  qualityClassification: "elite" | "strong" | "moderate" | "weak";
  tokensUsed: number;
  createdAt: number;
  expiresAt: number;
};

/**
 * Generate a deterministic cache key from user context and request parameters.
 * Key format: sha256(userId | userPrompt | sloProfile | preset | freedomMode | objective)
 */
export function generateCacheKey(params: {
  userId: string;
  userPrompt: string;
  sloProfile: "latency" | "balanced" | "quality";
  preset: string;
  freedomMode: "uncensored" | "standard";
  objective?: string;
}): CacheKey {
  const keyComponents = [
    params.userId,
    params.userPrompt,
    params.sloProfile,
    params.preset,
    params.freedomMode,
    params.objective || "default",
  ];

  const hash = crypto
    .createHash("sha256")
    .update(keyComponents.join("|"))
    .digest("hex");

  return `cache:${hash}`;
}

/**
 * In-memory cache with TTL support (for free tier / session scope).
 * This is a simple, fast fallback; production should use Redis or dedicated cache backend.
 */
class ResponseMemoryCache {
  private store = new Map<CacheKey, CachedResponse>();
  private timers = new Map<CacheKey, NodeJS.Timeout>();

  set(key: CacheKey, value: CachedResponse, ttlSeconds: number) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Store value
    this.store.set(key, {
      ...value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Set expiry timer
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  get(key: CacheKey): CachedResponse | undefined {
    const value = this.store.get(key);
    if (!value) return undefined;

    // Check if expired
    if (value.expiresAt < Date.now()) {
      this.store.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
        this.timers.delete(key);
      }
      return undefined;
    }

    return value;
  }

  has(key: CacheKey): boolean {
    return this.get(key) !== undefined;
  }

  clear() {
    this.store.clear();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

// Singleton instance
const memoryCache = new ResponseMemoryCache();

/**
 * Cache interface abstraction: memory or DB backend (extensible).
 */
export interface CacheBackend {
  get(key: CacheKey): Promise<CachedResponse | null>;
  set(key: CacheKey, value: CachedResponse, ttlSeconds: number): Promise<void>;
  has(key: CacheKey): Promise<boolean>;
}

/**
 * Memory cache backend (suitable for session/free tier caching).
 */
export class MemoryCacheBackend implements CacheBackend {
  async get(key: CacheKey): Promise<CachedResponse | null> {
    return memoryCache.get(key) || null;
  }

  async set(key: CacheKey, value: CachedResponse, ttlSeconds: number): Promise<void> {
    memoryCache.set(key, value, ttlSeconds);
  }

  async has(key: CacheKey): Promise<boolean> {
    return memoryCache.has(key);
  }
}

/**
 * Determine cache TTL based on user tier and session freshness.
 * Free tier: 30 min (session-scoped).
 * Premium tier: 7 days (user-global).
 */
export function resolveCacheTtl(tier: string): number {
  if (tier === "premium" || tier === "enterprise") {
    return 7 * 24 * 60 * 60; // 7 days
  }
  return 30 * 60; // 30 minutes
}

/**
 * Context-aware cache module for response replay.
 * Handles cache key generation, lookup, and storage.
 */
export class ResponseCacheManager {
  private backend: CacheBackend;

  constructor(backend?: CacheBackend) {
    this.backend = backend || new MemoryCacheBackend();
  }

  async lookup(params: {
    userId: string;
    userPrompt: string;
    sloProfile: "latency" | "balanced" | "quality";
    preset: string;
    freedomMode: "uncensored" | "standard";
    objective?: string;
  }): Promise<CachedResponse | null> {
    const key = generateCacheKey(params);
    return this.backend.get(key);
  }

  async store(params: {
    userId: string;
    userPrompt: string;
    sloProfile: "latency" | "balanced" | "quality";
    preset: string;
    freedomMode: "uncensored" | "standard";
    objective?: string;
    tier: string;
    response: {
      responseText: string;
      model: string;
      qualityScore: number;
      qualityClassification: "elite" | "strong" | "moderate" | "weak";
      tokensUsed: number;
    };
  }): Promise<void> {
    const key = generateCacheKey({
      userId: params.userId,
      userPrompt: params.userPrompt,
      sloProfile: params.sloProfile,
      preset: params.preset,
      freedomMode: params.freedomMode,
      objective: params.objective,
    });

    const ttl = resolveCacheTtl(params.tier);

    const cacheEntry: CachedResponse = {
      id: `${key}:${Date.now()}`,
      responseText: params.response.responseText,
      model: params.response.model,
      qualityScore: params.response.qualityScore,
      qualityClassification: params.response.qualityClassification,
      tokensUsed: params.response.tokensUsed,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
    };

    await this.backend.set(key, cacheEntry, ttl);
  }
}

// Export singleton instance
export const cacheManager = new ResponseCacheManager();
