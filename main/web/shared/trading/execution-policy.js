export const EXECUTION_PROFILES = {
  "polygon-evm": {
    id: "polygon-evm",
    label: "Polygon EVM",
    chainKind: "evm",
    chainIdHex: "0x89",
    tokenModel: "external-liquidity",
    settlementAdapter: "polygon",
    notes: "Current default for TradeHax live execution.",
  },
  "agnostic-sandbox": {
    id: "agnostic-sandbox",
    label: "Agnostic Sandbox",
    chainKind: "abstract",
    chainIdHex: "*",
    tokenModel: "to-be-decided",
    settlementAdapter: "l2-stub",
    notes: "Use this while evaluating custom L1/L2/token models.",
  },
};

export const DEFAULT_EXECUTION_PROFILE_ID = "polygon-evm";

export const SIGNATURE_MODES = {
  AUTO: "auto",
  PERSONAL_SIGN: "personal_sign",
  EIP712: "eip712",
};

export const DEFAULT_SIGNATURE_MODE = SIGNATURE_MODES.AUTO;

export function resolveExecutionProfile(profileId) {
  return EXECUTION_PROFILES[profileId] || EXECUTION_PROFILES[DEFAULT_EXECUTION_PROFILE_ID];
}

export function normalizeHexChainId(chainId) {
  return typeof chainId === "string" ? chainId.toLowerCase() : "";
}

export function isChainAllowed(profile, chainId) {
  if (!profile) return false;
  if (profile.chainIdHex === "*") return true;
  return normalizeHexChainId(chainId) === normalizeHexChainId(profile.chainIdHex);
}

