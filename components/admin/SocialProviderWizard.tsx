"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy, Download, ExternalLink, RefreshCcw, ShieldCheck, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

type SocialProvider = {
  id: string;
  label: string;
  description: string;
  keys: string[];
};

const PROVIDERS: SocialProvider[] = [
  {
    id: "x",
    label: "X / Twitter",
    description: "Post threads and monitor engagement via X API.",
    keys: ["X_API_KEY", "X_API_KEY_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET", "X_BEARER_TOKEN"],
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Publish and fetch account insights via Instagram Graph API.",
    keys: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET", "INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Manage publishing workflows with TikTok API.",
    keys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_ACCESS_TOKEN"],
  },
  {
    id: "youtube",
    label: "YouTube",
    description: "Read channel analytics and upload metadata via YouTube Data API.",
    keys: ["YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"],
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Schedule page posts and retrieve page insights.",
    keys: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET", "FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Publish to company pages and track social performance.",
    keys: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_ORGANIZATION_ID"],
  },
  {
    id: "reddit",
    label: "Reddit",
    description: "Post updates and participate in selected communities.",
    keys: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD", "REDDIT_USER_AGENT"],
  },
  {
    id: "discord",
    label: "Discord",
    description: "Broadcast announcements into your Discord channels.",
    keys: ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID", "DISCORD_ANNOUNCEMENTS_CHANNEL_ID"],
  },
];

const DEFAULT_TARGETS = ["production", "preview", "development"];

export function SocialProviderWizard() {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PROVIDERS.map((provider) => [provider.id, false])),
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>("");
  const [adminKey, setAdminKey] = useState("");
  const [superuserCode, setSuperuserCode] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [isValidatingHook, setIsValidatingHook] = useState(false);
  const [deployAfterSync, setDeployAfterSync] = useState(false);
  const [deployTarget, setDeployTarget] = useState<"production" | "preview">("production");

  const selectedProviders = useMemo(
    () => PROVIDERS.filter((provider) => selected[provider.id]),
    [selected],
  );

  const requiredKeys = useMemo(() => {
    const unique = new Set<string>();
    for (const provider of selectedProviders) {
      for (const key of provider.keys) {
        unique.add(key);
      }
    }
    return Array.from(unique);
  }, [selectedProviders]);

  const providerList = useMemo(
    () => selectedProviders.map((provider) => provider.id).join(","),
    [selectedProviders],
  );

  const envPayload = useMemo(() => {
    if (selectedProviders.length === 0) {
      return "TRADEHAX_SOCIAL_PROVIDERS=";
    }

    const lines = [`TRADEHAX_SOCIAL_PROVIDERS=${providerList}`];
    for (const key of requiredKeys) {
      lines.push(`${key}=${values[key] ?? ""}`);
    }
    return lines.join("\n");
  }, [providerList, requiredKeys, selectedProviders.length, values]);

  const vercelJsonPayload = useMemo(
    () =>
      JSON.stringify(
        [
          {
            key: "TRADEHAX_SOCIAL_PROVIDERS",
            value: providerList,
            target: DEFAULT_TARGETS,
            type: "encrypted",
          },
          ...requiredKeys.map((key) => ({
            key,
            value: values[key] ?? "",
            target: DEFAULT_TARGETS,
            type: "encrypted",
          })),
        ],
        null,
        2,
      ),
    [providerList, requiredKeys, values],
  );

  const completion = useMemo(() => {
    if (requiredKeys.length === 0) return { filled: 0, total: 0 };
    const filled = requiredKeys.filter((key) => (values[key] ?? "").trim().length > 0).length;
    return { filled, total: requiredKeys.length };
  }, [requiredKeys, values]);

  async function copyToClipboard(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`Copied ${label} to clipboard.`);
    } catch {
      setStatus(`Could not copy ${label}. Please copy manually.`);
    }
  }

  function downloadVercelPayload() {
    const blob = new Blob([vercelJsonPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tradehax-social-vercel-env.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded Vercel payload JSON.");
  }

  function resetWizard() {
    setSelected(Object.fromEntries(PROVIDERS.map((provider) => [provider.id, false])));
    setValues({});
    setStatus("Wizard reset. Start fresh with provider selection.");
  }

  async function pushToVercel() {
    if (selectedProviders.length === 0) {
      setStatus("Select at least one provider before pushing to Vercel.");
      return;
    }

    const missingKeys = requiredKeys.filter((key) => !(values[key] ?? "").trim());
    if (missingKeys.length > 0) {
      setStatus(`Fill all required keys first. Missing: ${missingKeys.slice(0, 5).join(", ")}${missingKeys.length > 5 ? "..." : ""}`);
      return;
    }

    setIsPushing(true);
    setStatus("");

    try {
      const payloadVariables = [
        {
          key: "TRADEHAX_SOCIAL_PROVIDERS",
          value: providerList,
          target: DEFAULT_TARGETS,
          type: "encrypted",
        },
        ...requiredKeys.map((key) => ({
          key,
          value: values[key] ?? "",
          target: DEFAULT_TARGETS,
          type: "encrypted",
        })),
      ];

      const response = await fetch("/api/admin/vercel/social-env", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey.trim() ? { "x-tradehax-admin-key": adminKey.trim() } : {}),
          ...(superuserCode.trim() ? { "x-tradehax-superuser-code": superuserCode.trim() } : {}),
        },
        body: JSON.stringify({
          variables: payloadVariables,
          deployAfterSync,
          deployTarget,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        synced?: number;
        failed?: number;
        error?: string;
        deploy?: {
          attempted?: boolean;
          ok?: boolean;
          message?: string;
        };
      };

      if (!response.ok && !data.ok) {
        throw new Error(data.error || `Sync failed with status ${response.status}`);
      }

      const synced = typeof data.synced === "number" ? data.synced : 0;
      const failed = typeof data.failed === "number" ? data.failed : 0;
      const deployMessage = data.deploy?.attempted
        ? ` Deploy: ${data.deploy?.ok ? "triggered" : "not triggered"}${data.deploy?.message ? ` (${data.deploy.message})` : ""}`
        : "";

      if (failed > 0) {
        setStatus(`Partial sync complete. Synced ${synced}, failed ${failed}. Check server response/logs.${deployMessage}`);
      } else {
        setStatus(`✅ Synced ${synced} variables to Vercel successfully.${deployMessage}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Push to Vercel failed.");
    } finally {
      setIsPushing(false);
    }
  }

  async function validateHook(pingHook: boolean) {
    setIsValidatingHook(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/vercel/social-env", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey.trim() ? { "x-tradehax-admin-key": adminKey.trim() } : {}),
          ...(superuserCode.trim() ? { "x-tradehax-superuser-code": superuserCode.trim() } : {}),
        },
        body: JSON.stringify({
          validateHook: true,
          pingHook,
          deployTarget,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || data.message || `Hook validation failed (${response.status})`);
      }

      setStatus(data.message || (pingHook ? "Deploy hook ping succeeded." : "Deploy hook URL is valid."));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Deploy hook validation failed.");
    } finally {
      setIsValidatingHook(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="theme-panel p-6 sm:p-8">
        <span className="theme-kicker mb-3">Social API Ops</span>
        <h1 className="theme-title text-3xl sm:text-4xl mb-3">Social Provider Wizard</h1>
        <p className="text-[#a6bdd0] max-w-3xl">
          Pick providers, fill credentials, and copy a ready-to-paste Vercel payload in one click.
        </p>
      </section>

      <section className="theme-panel p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-cyan-200">1) Select providers</h2>
          <Button variant="outline" size="sm" onClick={resetWizard}>
            <RefreshCcw className="size-4" /> Reset
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {PROVIDERS.map((provider) => {
            const active = selected[provider.id];
            return (
              <label
                key={provider.id}
                className={cn(
                  "rounded-lg border p-4 transition cursor-pointer",
                  active
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : "border-cyan-500/20 bg-black/30 hover:border-cyan-400/40",
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={active}
                    onCheckedChange={(checked) => {
                      setSelected((prev) => ({ ...prev, [provider.id]: Boolean(checked) }));
                    }}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-cyan-100">{provider.label}</div>
                    <p className="text-xs text-cyan-100/70 mt-1">{provider.description}</p>
                    <p className="text-[11px] text-cyan-200/60 mt-2">{provider.keys.length} required keys</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section className="theme-panel p-6 sm:p-8 space-y-5">
        <h2 className="text-xl font-semibold text-emerald-200">2) Enter credential values</h2>
        {requiredKeys.length === 0 ? (
          <p className="text-sm text-emerald-100/70">Select at least one provider to generate required fields.</p>
        ) : (
          <>
            <div className="text-xs text-emerald-100/70">
              Completion: <span className="font-semibold text-emerald-200">{completion.filled}/{completion.total}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {requiredKeys.map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-emerald-100/80">{key}</label>
                  <Input
                    value={values[key] ?? ""}
                    onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))}
                    placeholder={`Enter ${key}`}
                    className="bg-black/40 border-emerald-500/30"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="theme-panel p-6 sm:p-8 space-y-5">
        <h2 className="text-xl font-semibold text-fuchsia-200">3) Export for Vercel in one click</h2>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copyToClipboard(envPayload, ".env payload")}>
            <Copy className="size-4" /> Copy .env Payload
          </Button>
          <Button variant="secondary" onClick={() => copyToClipboard(vercelJsonPayload, "Vercel JSON payload")}>
            <Copy className="size-4" /> Copy Vercel JSON
          </Button>
          <Button variant="outline" onClick={downloadVercelPayload}>
            <Download className="size-4" /> Download JSON
          </Button>
          <Button variant="ghost" asChild>
            <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Vercel Env Docs
            </a>
          </Button>
        </div>

        <div className="rounded-lg border border-fuchsia-500/20 bg-black/40 p-4">
          <p className="text-xs text-fuchsia-100/70 mb-2">.env payload preview</p>
          <pre className="text-xs text-fuchsia-100/90 whitespace-pre-wrap break-all">{envPayload}</pre>
        </div>

        <div className="rounded-lg border border-cyan-500/20 bg-black/40 p-4">
          <p className="text-xs text-cyan-100/70 mb-2">Vercel JSON payload preview</p>
          <pre className="text-xs text-cyan-100/90 whitespace-pre-wrap break-all">{vercelJsonPayload}</pre>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-black/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-100">4) Push directly to Vercel</h3>
          <p className="text-xs text-emerald-100/70">
            Enter admin credentials for this app route. The server uses secure Vercel env vars (<code className="rounded bg-black/60 px-1">VERCEL_TOKEN</code>, <code className="rounded bg-black/60 px-1">VERCEL_PROJECT_ID</code>) to sync.
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-100/80">x-tradehax-admin-key</label>
              <Input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Enter admin key"
                className="bg-black/40 border-emerald-500/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-100/80">x-tradehax-superuser-code</label>
              <Input
                type="password"
                value={superuserCode}
                onChange={(event) => setSuperuserCode(event.target.value)}
                placeholder="Optional fallback code"
                className="bg-black/40 border-emerald-500/30"
              />
            </div>
          </div>

          <div className="rounded border border-emerald-500/20 bg-emerald-600/10 p-3 space-y-3">
            <label className="flex items-start gap-2 text-sm text-emerald-100/90">
              <Checkbox
                checked={deployAfterSync}
                onCheckedChange={(checked) => setDeployAfterSync(Boolean(checked))}
                className="mt-0.5"
              />
              <span>
                Trigger deploy after env sync
                <span className="block text-xs text-emerald-100/70 mt-1">
                  Requires deploy hook env vars on server. Useful for immediate rollout.
                </span>
              </span>
            </label>

            {deployAfterSync && (
              <div className="space-y-1">
                <label htmlFor="deploy-target" className="text-xs font-medium text-emerald-100/80">Deploy target</label>
                <select
                  id="deploy-target"
                  title="Deploy target"
                  value={deployTarget}
                  onChange={(event) => setDeployTarget(event.target.value === "preview" ? "preview" : "production")}
                  className="w-full rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm text-emerald-100 outline-none"
                >
                  <option value="production">Production</option>
                  <option value="preview">Preview</option>
                </select>
              </div>
            )}
          </div>

          <Button onClick={pushToVercel} disabled={isPushing}>
            <UploadCloud className="size-4" /> {isPushing ? "Pushing to Vercel..." : "Push to Vercel"}
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => validateHook(false)} disabled={isValidatingHook}>
              <ShieldCheck className="size-4" /> {isValidatingHook ? "Validating..." : "Validate Hook URL"}
            </Button>
            <Button variant="outline" onClick={() => validateHook(true)} disabled={isValidatingHook}>
              <ShieldCheck className="size-4" /> {isValidatingHook ? "Pinging..." : "Ping Hook"}
            </Button>
          </div>
        </div>

        {status && (
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-600/15 px-3 py-2 text-sm text-emerald-100">
            <CheckCircle2 className="size-4" /> {status}
          </div>
        )}
      </section>
    </div>
  );
}
