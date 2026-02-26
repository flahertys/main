import { NextRequest } from "next/server";

export type OdinProfileId = "standard" | "alpha" | "overclock";

export type OdinRuntimeProfile = {
  id: OdinProfileId;
  label: string;
  chat: {
    temperatureDelta: number;
    maxTokensDelta: number;
    topPDelta: number;
  };
  image: {
    guidanceScaleMultiplier: number;
    stepsMultiplier: number;
    forceOpenMode: boolean;
  };
  market: {
    streamIntervalMs: number;
    pollingFallbackMs: number;
  };
};

const ODIN_PROFILES: Record<OdinProfileId, OdinRuntimeProfile> = {
  standard: {
    id: "standard",
    label: "ODIN Standard",
    chat: {
      temperatureDelta: 0,
      maxTokensDelta: 0,
      topPDelta: 0,
    },
    image: {
      guidanceScaleMultiplier: 1,
      stepsMultiplier: 1,
      forceOpenMode: false,
    },
    market: {
      streamIntervalMs: 5000,
      pollingFallbackMs: 10000,
    },
  },
  alpha: {
    id: "alpha",
    label: "ODIN Alpha",
    chat: {
      temperatureDelta: 0.08,
      maxTokensDelta: 120,
      topPDelta: 0.03,
    },
    image: {
      guidanceScaleMultiplier: 1.05,
      stepsMultiplier: 1.12,
      forceOpenMode: false,
    },
    market: {
      streamIntervalMs: 4000,
      pollingFallbackMs: 9000,
    },
  },
  overclock: {
    id: "overclock",
    label: "ODIN Overclock",
    chat: {
      temperatureDelta: 0.16,
      maxTokensDelta: 220,
      topPDelta: 0.06,
    },
    image: {
      guidanceScaleMultiplier: 1.15,
      stepsMultiplier: 1.2,
      forceOpenMode: true,
    },
    market: {
      streamIntervalMs: 3000,
      pollingFallbackMs: 7000,
    },
  },
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toProfileId(value: unknown): OdinProfileId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "standard" || normalized === "alpha" || normalized === "overclock") {
    return normalized;
  }
  return null;
}

export function resolveOdinRuntimeProfile(args: {
  request: NextRequest;
  requestedProfile?: unknown;
}) {
  const requested =
    toProfileId(args.requestedProfile)
    || toProfileId(args.request.headers.get("x-tradehax-odin"))
    || toProfileId(process.env.TRADEHAX_ODIN_PROFILE)
    || "standard";

  return ODIN_PROFILES[requested];
}

export function applyOdinChatTuning(profile: OdinRuntimeProfile, input: {
  temperature: number;
  maxTokens: number;
  topP: number;
}) {
  return {
    temperature: clampNumber(input.temperature + profile.chat.temperatureDelta, 0, 2),
    maxTokens: Math.round(clampNumber(input.maxTokens + profile.chat.maxTokensDelta, 64, 4096)),
    topP: clampNumber(input.topP + profile.chat.topPDelta, 0.1, 1),
  };
}

export function applyOdinImageTuning(profile: OdinRuntimeProfile, input: {
  guidanceScale: number;
  numInferenceSteps: number;
  openMode: boolean;
}) {
  return {
    guidanceScale: clampNumber(input.guidanceScale * profile.image.guidanceScaleMultiplier, 1, 20),
    numInferenceSteps: Math.round(clampNumber(input.numInferenceSteps * profile.image.stepsMultiplier, 10, 80)),
    openMode: profile.image.forceOpenMode ? true : input.openMode,
  };
}
