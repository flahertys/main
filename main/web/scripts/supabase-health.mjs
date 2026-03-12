import { createClient } from "@supabase/supabase-js";

const required = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL;
const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;

const browserLikeClient = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const adminClient = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("Supabase health check starting...");

  const anonCheck = await browserLikeClient.auth.getUser();
  const anonStatus = anonCheck.error
    ? `anon auth reachable (expected unauthenticated): ${anonCheck.error.message}`
    : "anon auth reachable";
  console.log(`- ${anonStatus}`);

  const bucketCheck = await adminClient.storage.listBuckets();
  if (bucketCheck.error) {
    console.error(`- admin check failed: ${bucketCheck.error.message}`);
    process.exit(1);
  }

  console.log(`- admin check ok, buckets visible: ${bucketCheck.data.length}`);
  console.log("Supabase health check passed.");
}

main().catch((error) => {
  console.error(`Health check failed: ${error.message}`);
  process.exit(1);
});

