import type { VercelRequest, VercelResponse } from "@vercel/node";

interface CorsOptions {
  methods: string;
  headers?: string;
  origin?: string;
}

export function applyCors(res: VercelResponse, options: CorsOptions): void {
  res.setHeader("Access-Control-Allow-Origin", options.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", options.methods);
  res.setHeader("Access-Control-Allow-Headers", options.headers || "Content-Type");
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }

  return false;
}

export function ensureMethod(
  req: VercelRequest,
  res: VercelResponse,
  method: string
): boolean {
  if (req.method !== method) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }

  return true;
}

export function ensureAllowedMethods(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[]
): boolean {
  if (!methods.includes(req.method || "")) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }

  return true;
}
