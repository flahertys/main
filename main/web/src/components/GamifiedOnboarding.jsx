import React, { useMemo, useState } from "react";
import { userProfileStorage } from "../lib/api-client";

const COLORS = {
  bg: "#07111F",
  surface: "#0D1726",
  panel: "#101D31",
  border: "#1A2B44",
  accent: "#21C8FF",
  accentSoft: "rgba(33, 200, 255, 0.16)",
  success: "#00D68F",
  warning: "#FFB020",
  text: "#E6F1FF",
  textDim: "#93A8C3",
};

const STEPS = [
  {
    id: "welcome",
    eyebrow: "Launch Sequence",
    title: "Configure your TradeHax workspace",
    body: "Set your operating profile once so the copilot can tailor risk, execution, and market focus from the first session.",
  },
  {
    id: "profile",
    eyebrow: "Profile",
    title: "Tell us how you trade",
    body: "This controls default sizing language, market context, and execution guidance.",
  },
  {
    id: "focus",
    eyebrow: "Focus",
    title: "Set your preferred market coverage",
    body: "Choose what you want to monitor so the dashboard starts with relevant assets.",
  },
  {
    id: "complete",
    eyebrow: "Ready",
    title: "Your console is provisioned",
    body: "You can still change these preferences later, but this is enough to start using the live experience.",
  },
];

const ASSET_OPTIONS = ["BTC", "ETH", "SOL", "DOGE", "ADA", "LINK"];

const defaultForm = {
  firstName: "",
  experienceLevel: "intermediate",
  riskTolerance: "moderate",
  tradingStyle: "swing",
  portfolioValue: "25000",
  goal: "Generate structured trading plans with disciplined risk",
  persona: "Execution Coach",
  preferredAssets: ["BTC", "ETH", "SOL"],
};

function buildProfile(form) {
  return {
    userId: `guest-${form.firstName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "trader"}`,
    firstName: form.firstName.trim() || "Trader",
    experienceLevel: form.experienceLevel,
    riskTolerance: form.riskTolerance,
    tradingStyle: form.tradingStyle,
    portfolioValue: Number(form.portfolioValue) || 25000,
    preferredAssets: form.preferredAssets,
    goal: form.goal.trim(),
    persona: form.persona.trim() || "Execution Coach",
    onboardingCompletedAt: Date.now(),
  };
}

async function persistOnboarding(profile) {
  await userProfileStorage.save(profile); // always syncs to backend as well
  localStorage.setItem("onboardingComplete", "true");
  localStorage.setItem("tradehax_onboarding", JSON.stringify(profile));
  localStorage.setItem(
    "userStats",
    JSON.stringify({
      goal: profile.goal,
      persona: profile.persona,
      daysActive: 1,
      walletConnected: false,
      paperTrades: 0,
      signalsGenerated: 0,
      creationsCount: 0,
      referralsCount: 0,
      earnedAchievements: {},
    })
  );
}

function StepIndicator({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      {STEPS.map((item, index) => {
        const active = index === step;
        const complete = index < step;

        return (
          <React.Fragment key={item.id}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: complete ? COLORS.success : active ? COLORS.accent : COLORS.surface,
                color: complete || active ? "#04111F" : COLORS.textDim,
                border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                fontWeight: 700,
              }}
            >
              {complete ? "✓" : index + 1}
            </div>
            {index < STEPS.length - 1 ? (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: complete ? COLORS.success : COLORS.border,
                  minWidth: 16,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const STEP_TOOLTIPS = [
  "Set up your workspace for personalized AI guidance.",
  "Tell us about your trading style and experience. This helps tailor risk and execution advice.",
  "Choose your preferred assets and set your primary goal. The dashboard will focus on these.",
  "Review your profile and get started! Next: Try paper trading or generate your first AI signal.",
];

export default function GamifiedOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);

  const current = STEPS[step];
  const profilePreview = useMemo(() => buildProfile(form), [form]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAsset(asset) {
    setForm((prev) => {
      const exists = prev.preferredAssets.includes(asset);
      const preferredAssets = exists
        ? prev.preferredAssets.filter((item) => item !== asset)
        : [...prev.preferredAssets, asset].slice(0, 4);
      return { ...prev, preferredAssets };
    });
  }

  function goNext() {
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function finish() {
    const profile = buildProfile(form);
    await persistOnboarding(profile);
    onComplete?.(profile);
  }

  const canAdvance =
    step === 0 ||
    (step === 1 && form.firstName.trim() && form.portfolioValue) ||
    (step === 2 && form.preferredAssets.length > 0) ||
    step === 3;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(33,200,255,0.18), transparent 32%), linear-gradient(180deg, #07111F 0%, #040B14 100%)",
        color: COLORS.text,
        padding: "32px 20px",
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.8fr)",
          gap: 24,
        }}
      >
        <div
          style={{
            background: "rgba(7, 17, 31, 0.82)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ color: COLORS.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {current.eyebrow}
          </div>
          <h1 style={{ margin: "12px 0 10px", fontSize: 38, lineHeight: 1.1 }}>{current.title}</h1>
          <p style={{ margin: "0 0 28px", color: COLORS.textDim, maxWidth: 700, lineHeight: 1.7 }}>{current.body}</p>
          {/* Tooltip/help for each step */}
          <div style={{ marginBottom: 18, color: COLORS.warning, fontSize: 14, fontWeight: 500 }}>
            {STEP_TOOLTIPS[step]}
          </div>
          <StepIndicator step={step} />

          {step === 0 ? (
            <div style={{ display: "grid", gap: 18 }}>
              <div style={cardStyle}>
                <strong>Execution-focused intelligence</strong>
                <p style={supportStyle}>Structured signals, risk controls, and execution playbooks instead of generic chatbot output.</p>
              </div>
              <div style={cardStyle}>
                <strong>Customer-safe defaults</strong>
                <p style={supportStyle}>Your live UI will start in a stable public mode without hidden admin dependencies.</p>
              </div>
              <div style={cardStyle}>
                <strong>Personalized market coverage</strong>
                <p style={supportStyle}>The dashboard loads your preferred assets and adapts the AI guidance to your profile.</p>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="First name">
                <input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} style={inputStyle} placeholder="Avery" />
              </Field>
              <div style={twoColStyle}>
                <Field label="Experience level">
                  <select value={form.experienceLevel} onChange={(event) => updateField("experienceLevel", event.target.value)} style={inputStyle}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </Field>
                <Field label="Portfolio size (USD)">
                  <input value={form.portfolioValue} onChange={(event) => updateField("portfolioValue", event.target.value.replace(/[^\d]/g, ""))} style={inputStyle} placeholder="25000" />
                </Field>
              </div>
              <div style={twoColStyle}>
                <Field label="Risk tolerance">
                  <select value={form.riskTolerance} onChange={(event) => updateField("riskTolerance", event.target.value)} style={inputStyle}>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </Field>
                <Field label="Trading style">
                  <select value={form.tradingStyle} onChange={(event) => updateField("tradingStyle", event.target.value)} style={inputStyle}>
                    <option value="scalp">Scalp</option>
                    <option value="swing">Swing</option>
                    <option value="position">Position</option>
                  </select>
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div style={{ display: "grid", gap: 20 }}>
              <Field label="Primary goal">
                <textarea value={form.goal} onChange={(event) => updateField("goal", event.target.value)} style={{ ...inputStyle, minHeight: 104, resize: "vertical" }} />
              </Field>
              <Field label="AI persona">
                <input value={form.persona} onChange={(event) => updateField("persona", event.target.value)} style={inputStyle} placeholder="Execution Coach" />
              </Field>
              <Field label="Preferred assets">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {ASSET_OPTIONS.map((asset) => {
                    const active = form.preferredAssets.includes(asset);
                    return (
                      <button
                        key={asset}
                        type="button"
                        onClick={() => toggleAsset(asset)}
                        style={{
                          borderRadius: 999,
                          border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                          background: active ? COLORS.accentSoft : COLORS.surface,
                          color: active ? COLORS.accent : COLORS.textDim,
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {asset}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={cardStyle}>
                <strong>Profile summary</strong>
                <p style={supportStyle}>
                  {profilePreview.firstName} will start with a {profilePreview.riskTolerance} risk profile, {profilePreview.tradingStyle} execution cadence,
                  and live focus on {profilePreview.preferredAssets.join(", ")}.
                </p>
              </div>
              <div style={cardStyle}>
                <strong>Operating goal</strong>
                <p style={supportStyle}>{profilePreview.goal}</p>
              </div>
              <div style={cardStyle}>
                <strong>Assistant persona</strong>
                <p style={supportStyle}>{profilePreview.persona}</p>
              </div>
              {/* Next Steps section after onboarding completion */}
              <div style={{ ...cardStyle, background: COLORS.accentSoft, color: COLORS.accent }}>
                <strong>Next Steps</strong>
                <ul style={{ color: COLORS.text, margin: '10px 0 0 18px', fontSize: 15 }}>
                  <li>Try paper trading on BTC/USD (<span style={{ color: COLORS.accent }}>Start Paper Trading</span>)</li>
                  <li>Generate your first AI signal (<span style={{ color: COLORS.accent }}>Generate AI Signal</span>)</li>
                  <li>Connect your wallet for real execution (<span style={{ color: COLORS.accent }}>Connect Wallet</span>)</li>
                  <li>Unlock badges and credits by completing actions</li>
                </ul>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
            <button type="button" onClick={goBack} disabled={step === 0} style={{ ...secondaryButtonStyle, opacity: step === 0 ? 0.45 : 1 }}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext} disabled={!canAdvance} style={{ ...primaryButtonStyle, opacity: canAdvance ? 1 : 0.45 }}>
                Continue
              </button>
            ) : (
              <button type="button" onClick={finish} style={primaryButtonStyle}>
                Enter TradeHax
              </button>
            )}
          </div>
        </div>

        <aside
          style={{
            background: "rgba(16, 29, 49, 0.9)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 24,
            padding: 24,
            display: "grid",
            gap: 18,
            alignSelf: "start",
            boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
          }}
        >
          <div>
            <div style={{ color: COLORS.warning, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Provisioning Preview
            </div>
            <h2 style={{ margin: "10px 0 6px", fontSize: 24 }}>Live customer workspace</h2>
            <p style={{ margin: 0, color: COLORS.textDim, lineHeight: 1.7 }}>
              This onboarding writes a reusable profile so the frontend and backend can share the same customer context.
            </p>
          </div>
          <div style={metricCardStyle}>
            <span style={{ color: COLORS.textDim }}>Default profile</span>
            <strong>{profilePreview.firstName}</strong>
          </div>
          <div style={metricCardStyle}>
            <span style={{ color: COLORS.textDim }}>Mode</span>
            <strong>{profilePreview.persona}</strong>
          </div>
          <div style={metricCardStyle}>
            <span style={{ color: COLORS.textDim }}>Assets</span>
            <strong>{profilePreview.preferredAssets.join(", ")}</strong>
          </div>
          <div style={metricCardStyle}>
            <span style={{ color: COLORS.textDim }}>Portfolio baseline</span>
            <strong>${profilePreview.portfolioValue.toLocaleString("en-US")}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ color: COLORS.text, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const cardStyle = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 18,
  padding: 18,
};

const metricCardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
};

const supportStyle = {
  margin: "8px 0 0",
  color: COLORS.textDim,
  lineHeight: 1.6,
};

const inputStyle = {
  width: "100%",
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  color: COLORS.text,
  padding: "14px 16px",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #21C8FF 0%, #0A84FF 100%)",
  color: "#04111F",
  fontWeight: 700,
  fontSize: 15,
  padding: "14px 18px",
  cursor: "pointer",
  minWidth: 160,
};

const secondaryButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  background: COLORS.surface,
  color: COLORS.text,
  fontWeight: 600,
  fontSize: 15,
  padding: "14px 18px",
  cursor: "pointer",
  minWidth: 120,
};
