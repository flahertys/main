/**
 * Multi-Domain Supabase Client Factory
 *
 * Manages Supabase connections for multiple deployment domains:
 * - tradehax.net (primary domain)
 * - tradehaxai.tech (secondary domain)
 * - tradehaxai.me (tertiary domain)
 *
 * Features:
 * - Automatic domain detection from request headers
 * - Domain-specific Supabase instance routing
 * - Fallback to primary instance if domain not recognized
 * - Environment-based configuration
 */

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

/**
 * Represents a Supabase configuration for a specific domain
 */
export interface DomainSupabaseConfig {
  domain: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

/**
 * Multi-domain configuration mapping
 */
const DOMAIN_SUPABASE_CONFIG: Record<string, DomainSupabaseConfig> = {
  "tradehax.net": {
    domain: "tradehax.net",
    supabaseUrl: process.env.SUPABASE_URL || "https://lgatuhmejegzfaucufjt.supabase.co",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  "www.tradehax.net": {
    domain: "tradehax.net",
    supabaseUrl: process.env.SUPABASE_URL || "https://lgatuhmejegzfaucufjt.supabase.co",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  "tradehaxai.tech": {
    domain: "tradehaxai.tech",
    supabaseUrl: process.env.SUPABASE_URL_ALT || "https://epqvhafqrykvohbiiyhv.supabase.co",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_ALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  "www.tradehaxai.tech": {
    domain: "tradehaxai.tech",
    supabaseUrl: process.env.SUPABASE_URL_ALT || "https://epqvhafqrykvohbiiyhv.supabase.co",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_ALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  "tradehaxai.me": {
    domain: "tradehaxai.me",
    supabaseUrl: process.env.SUPABASE_URL_ME || process.env.SUPABASE_URL || "https://lgatuhmejegzfaucufjt.supabase.co",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_ME || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  "www.tradehaxai.me": {
    domain: "tradehaxai.me",
    supabaseUrl: process.env.SUPABASE_URL_ME || process.env.SUPABASE_URL || "https://lgatuhmejegzfaucufjt.supabase.co",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_ME || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
};

/**
 * Cache for Supabase admin clients by domain
 */
const supabaseAdminClients = new Map<string, ReturnType<typeof createClient>>();

/**
 * Extract the domain from the request
 */
export function getDomainFromRequest(req: VercelRequest): string {
  const host = req.headers.host || "tradehax.net";
  // Remove port if present
  return host.split(":")[0];
}

/**
 * Get Supabase configuration for a specific domain
 */
export function getSupabaseConfigForDomain(domain: string): DomainSupabaseConfig {
  // Try exact match first
  if (DOMAIN_SUPABASE_CONFIG[domain]) {
    return DOMAIN_SUPABASE_CONFIG[domain];
  }

  // Try to find a configuration that matches this domain
  for (const [configDomain, config] of Object.entries(DOMAIN_SUPABASE_CONFIG)) {
    if (domain.endsWith(configDomain) || configDomain.endsWith(domain)) {
      return config;
    }
  }

  // Default to primary domain
  return DOMAIN_SUPABASE_CONFIG["tradehax.net"];
}

/**
 * Get or create a Supabase admin client for a specific domain
 */
export function getSupabaseAdminForDomain(domain: string) {
  if (supabaseAdminClients.has(domain)) {
    return supabaseAdminClients.get(domain)!;
  }

  const config = getSupabaseConfigForDomain(domain);

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error(
      `Supabase configuration missing for domain ${domain}. ` +
      `Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.`
    );
  }

  const client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  supabaseAdminClients.set(domain, client);
  return client;
}

/**
 * Get or create a Supabase admin client from a request
 */
export function getSupabaseAdminFromRequest(req: VercelRequest) {
  const domain = getDomainFromRequest(req);
  return getSupabaseAdminForDomain(domain);
}

/**
 * Helper to get all configured Supabase instances
 */
export function getAllSupabaseConfigs(): DomainSupabaseConfig[] {
  const configs = new Map<string, DomainSupabaseConfig>();
  for (const config of Object.values(DOMAIN_SUPABASE_CONFIG)) {
    configs.set(config.domain, config);
  }
  return Array.from(configs.values());
}

/**
 * Verify Supabase connectivity for all configured domains
 */
export async function verifyAllSupabaseConnections(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const config of getAllSupabaseConfigs()) {
    try {
      const client = getSupabaseAdminForDomain(config.domain);
      const { error } = await client.from("ai_behavior_events").select("count", { count: "exact", head: true });
      results[config.domain] = !error;
    } catch (err) {
      results[config.domain] = false;
    }
  }

  return results;
}

export default {
  getDomainFromRequest,
  getSupabaseConfigForDomain,
  getSupabaseAdminForDomain,
  getSupabaseAdminFromRequest,
  getAllSupabaseConfigs,
  verifyAllSupabaseConnections,
};

