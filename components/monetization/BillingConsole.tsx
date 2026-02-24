"use client";

import { PlanDefinition } from "@/lib/monetization/types";
import { Crown, Loader2, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CheckoutProvider =
  | "stripe"
  | "coinbase"
  | "paypal"
  | "square"
  | "venmo"
  | "cashapp"
  | "ebay"
  | "crypto";

const CHECKOUT_PROVIDERS: Array<{
  id: CheckoutProvider;
  label: string;
  loud?: boolean;
}> = [
  { id: "stripe", label: "Stripe", loud: true },
  { id: "coinbase", label: "Coinbase" },
  { id: "paypal", label: "PayPal" },
  { id: "square", label: "Square" },
  { id: "venmo", label: "Venmo" },
  { id: "cashapp", label: "Cash App" },
  { id: "ebay", label: "eBay" },
  { id: "crypto", label: "Crypto" },
];

type Snapshot = {
  userId: string;
  subscription: {
    tier: string;
    status: string;
    billingCycle: string;
    provider: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  };
  plan: PlanDefinition;
  usage: Array<{
    feature: string;
    usedToday: number;
    dailyLimit: number;
    remainingToday: number;
  }>;
};

type AICreditSnapshot = {
  userId: string;
  balance: number;
  costs: {
    STANDARD: number;
    UNCENSORED: number;
    IMAGE_GEN: number;
    OVERCLOCK: number;
    HFT_SIGNAL: number;
    GUITAR_LESSON: number;
  };
  estimatedRequestsRemaining: {
    standard: number;
    uncensored: number;
    image: number;
  };
  packs: Array<{
    id: "starter" | "pro" | "elite";
    label: string;
    credits: number;
    priceUsd: number;
  }>;
};

function defaultUserId() {
  // Use cryptographically secure randomness for the guest identifier
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes)
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 8);
    return `guest_${randomPart}`;
  }
  // Fallback: still generate something reasonable if crypto is unavailable
  return `guest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function featureLabel(feature: string) {
  switch (feature) {
    case "ai_chat":
      return "AI chats/day";
    case "hax_runner":
      return "Runner plays/day";
    case "signal_alert":
      return "Signal alerts/day";
    case "bot_create":
      return "Bot creates/day";
    default:
      return feature;
  }
}

export function BillingConsole() {
  const [userId, setUserId] = useState("");
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [aiCredits, setAiCredits] = useState<AICreditSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem("tradehax_user_id") : null;
    const resolved = stored && stored.trim().length > 0 ? stored : defaultUserId();
    setUserId(resolved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tradehax_user_id", resolved);
    }
  }, []);

  async function loadData(targetUserId: string) {
    setLoading(true);
    try {
      const [plansRes, snapshotRes, creditsRes] = await Promise.all([
        fetch("/api/monetization/plans", { cache: "no-store" }),
        fetch(`/api/monetization/subscription?userId=${encodeURIComponent(targetUserId)}`, {
          cache: "no-store",
        }),
        fetch(`/api/monetization/ai-credits?userId=${encodeURIComponent(targetUserId)}`, {
          cache: "no-store",
        }),
      ]);

      const plansJson = await plansRes.json();
      const snapshotJson = await snapshotRes.json();
      const creditsJson = await creditsRes.json();
      setPlans(plansJson.plans ?? []);
      setSnapshot(snapshotJson.snapshot ?? null);
      setAiCredits(creditsJson.snapshot ?? null);
    } catch (error) {
      setMessage("Unable to load billing data right now.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    loadData(userId);
  }, [userId]);

  const currentTier = snapshot?.subscription.tier ?? "free";

  const renewalText = useMemo(() => {
    if (!snapshot?.subscription.currentPeriodEnd) return "No billing cycle active";
    const date = new Date(snapshot.subscription.currentPeriodEnd);
    return `Renews ${date.toLocaleDateString()}`;
  }, [snapshot?.subscription.currentPeriodEnd]);

  async function handleCheckout(tier: string, provider: CheckoutProvider) {
    if (!userId) return;
    setBusy(`${tier}:${provider}`);
    setMessage("");
    try {
      const response = await fetch("/api/monetization/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          tier,
          provider,
          billingCycle: "monthly",
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Checkout could not be started.");
        return;
      }

      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
      }
    } catch (error) {
      setMessage("Checkout failed. Please retry.");
      console.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleSetFreeTier() {
    if (!userId) return;
    setBusy("free:none");
    setMessage("");
    try {
      const response = await fetch("/api/monetization/subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "set-tier",
          tier: "free",
          provider: "none",
          metadata: {
            source: "billing_console_free_tier",
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Unable to activate free tier right now.");
        return;
      }

      setSnapshot(payload.snapshot ?? null);
      setMessage("Free tier is active. No checkout required.");
    } catch (error) {
      setMessage("Unable to activate free tier right now.");
      console.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!userId) return;
    setBusy("cancel");
    setMessage("");
    try {
      const response = await fetch("/api/monetization/subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "cancel",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Unable to cancel right now.");
        return;
      }
      setSnapshot(payload.snapshot ?? null);
      setMessage("Subscription set to cancel at period end.");
    } catch (error) {
      setMessage("Cancel request failed.");
      console.error(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleBuyCredits(packId: "starter" | "pro" | "elite") {
    if (!userId) return;
    setBusy(`credits:${packId}`);
    setMessage("");

    try {
      const response = await fetch("/api/monetization/ai-credits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          packId,
          provider: "stripe",
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Unable to purchase AI credits right now.");
        if (payload.snapshot) {
          setAiCredits(payload.snapshot);
        }
        return;
      }

      if (payload.snapshot) {
        setAiCredits(payload.snapshot);
      }
      setMessage(`AI credits added: +${payload.purchased?.credits ?? 0}.`);
    } catch (error) {
      setMessage("AI credit purchase failed. Please retry.");
      console.error(error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="theme-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="theme-kicker mb-3">Billing Console</span>
            <h2 className="theme-title text-2xl sm:text-3xl mb-2">Subscription Control Center</h2>
            <p className="text-[#a7bdd0] max-w-2xl">
              Launch-ready billing with Stripe/Coinbase routing, plan gating, and daily usage controls.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
            <div className="text-[#8fb5ca]">Profile ID</div>
            <div className="font-mono text-white">{userId || "resolving..."}</div>
          </div>
        </div>
        {message ? (
          <p className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            {message}
          </p>
        ) : null}
      </section>

      {loading ? (
        <section className="theme-panel p-8 flex items-center gap-3 text-[#9bb3c6]">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading subscription data...
        </section>
      ) : null}

      {!loading && snapshot ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="theme-grid-card">
            <div className="flex items-center gap-2 text-[#9efdc4]">
              <ShieldCheck className="w-4 h-4" />
              Current Tier
            </div>
            <h3 className="text-2xl font-bold text-white uppercase">{snapshot.plan.name}</h3>
            <p className="text-[#9eb5c8]">
              Status: <span className="text-white">{snapshot.subscription.status}</span>
            </p>
            <p className="text-[#9eb5c8]">{renewalText}</p>
            {snapshot.subscription.tier !== "free" ? (
              <button
                onClick={handleCancel}
                disabled={busy === "cancel"}
                className="theme-cta theme-cta--secondary mt-3 self-start"
              >
                {busy === "cancel" ? "Processing..." : "Cancel At Period End"}
              </button>
            ) : null}
          </article>

          <article className="theme-grid-card">
            <div className="flex items-center gap-2 text-[#86d6ff]">
              <Zap className="w-4 h-4" />
              Daily Usage
            </div>
            <div className="space-y-2">
              {snapshot.usage.map((item) => (
                <div key={item.feature} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#b6c8d8]">{featureLabel(item.feature)}</span>
                    <span className="text-white">
                      {item.usedToday} / {item.dailyLimit}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-cyan-400"
                      style={{
                        width: `${item.dailyLimit > 0 ? Math.min(100, (item.usedToday / item.dailyLimit) * 100) : 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="theme-grid-card">
            <div className="flex items-center gap-2 text-[#f9c27d]">
              <Zap className="w-4 h-4" />
              AI Credits
            </div>
            <h3 className="text-2xl font-bold text-white">
              {typeof aiCredits?.balance === "number" ? aiCredits.balance : 0}
            </h3>
            <p className="text-[#9eb5c8] text-sm">Low-cost top-ups for AI chat + image generation.</p>
            <div className="space-y-1 text-xs text-[#c9d7e5]">
              <p>Standard chats left: {aiCredits?.estimatedRequestsRemaining.standard ?? 0}</p>
              <p>Uncensored chats left: {aiCredits?.estimatedRequestsRemaining.uncensored ?? 0}</p>
              <p>Image generations left: {aiCredits?.estimatedRequestsRemaining.image ?? 0}</p>
            </div>
            <div className="pt-2 space-y-2">
              {(aiCredits?.packs ?? []).map((pack) => {
                const packBusy = busy === `credits:${pack.id}`;
                return (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyCredits(pack.id)}
                    disabled={packBusy}
                    className="theme-cta theme-cta--secondary w-full"
                  >
                    {packBusy
                      ? "Processing..."
                      : `${pack.label} · +${pack.credits} credits · $${pack.priceUsd}`}
                  </button>
                );
              })}
            </div>
          </article>
        </section>
      ) : null}

      {!loading ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const freeBusy = busy === "free:none";
            const isFreePlan = plan.id === "free";

            return (
              <article
                key={plan.id}
                className={`theme-grid-card ${isCurrent ? "border-cyan-300/60 shadow-[0_0_24px_rgba(34,211,238,0.18)]" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-[#9eb5c8] text-sm">{plan.description}</p>
                  </div>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                      <Crown className="w-3.5 h-3.5" />
                      ACTIVE
                    </span>
                  ) : null}
                </div>
                <p className="text-3xl font-bold text-white">
                  ${plan.monthlyPriceUsd}
                  <span className="text-base text-[#9eb5c8]"> /month</span>
                </p>
                <ul className="space-y-1 text-sm text-[#c9d7e5]">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  {isFreePlan ? (
                    <>
                      <button
                        onClick={handleSetFreeTier}
                        disabled={isCurrent || freeBusy}
                        className="theme-cta theme-cta--loud"
                      >
                        {isCurrent ? "Free Tier Active" : freeBusy ? "Activating..." : "Use Free Tier"}
                      </button>
                      <span className="self-center text-xs text-[#9eb5c8]">
                        No checkout required.
                      </span>
                    </>
                  ) : (
                    <>
                      {CHECKOUT_PROVIDERS.map((provider) => {
                        const providerBusy = busy === `${plan.id}:${provider.id}`;
                        return (
                          <button
                            key={provider.id}
                            onClick={() => handleCheckout(plan.id, provider.id)}
                            disabled={providerBusy}
                            className={`theme-cta ${provider.loud ? "theme-cta--loud" : "theme-cta--secondary"}`}
                          >
                            {providerBusy ? "Starting..." : `Checkout with ${provider.label}`}
                          </button>
                        );
                      })}
                      <span className="w-full text-xs text-[#9eb5c8]">
                        Choose any available payment rail. If a provider is not configured yet, you&apos;ll see a setup prompt.
                      </span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
