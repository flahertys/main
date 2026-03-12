import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../lib/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
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

