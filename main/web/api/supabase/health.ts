import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, ensureMethod, handleOptions } from "../_shared/http.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, { methods: "GET,OPTIONS" });

  if (handleOptions(req, res)) {
    return;
  }

  if (!ensureMethod(req, res, "GET")) {
    return;
  }

  try {
    const started = Date.now();
    const { data, error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      return res.status(500).json({
        ok: false,
        provider: "supabase",
        projectUrl: process.env.VITE_SUPABASE_URL,
        error: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      provider: "supabase",
      projectUrl: process.env.VITE_SUPABASE_URL,
      latencyMs: Date.now() - started,
      buckets: data.map((bucket) => ({ id: bucket.id, name: bucket.name, public: bucket.public })),
      bucketCount: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      provider: "supabase",
      projectUrl: process.env.VITE_SUPABASE_URL,
      error: error?.message || "Unknown error",
    });
  }
}
