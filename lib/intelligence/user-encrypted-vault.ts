import { sanitizePlainText } from "@/lib/security";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

type EncryptedEnvelope = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
  updatedAt: string;
};

type VaultStore = Record<string, EncryptedEnvelope>;

export type UserEncryptedVault = {
  userId: string;
  displayName: string;
  profileNotes: string;
  favoriteSymbols: string[];
  preferredTimeframes: string[];
  macroInterests: string[];
  llmContext: string;
  consent: {
    allowLlmTraining: boolean;
    allowPersonalization: boolean;
    updatedAt: string;
  };
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "users");
const DATA_FILE = path.join(DATA_DIR, "encrypted-account-vault.json");

function nowIso() {
  return new Date().toISOString();
}

function normalizeUserId(value: string) {
  return sanitizePlainText(value.toLowerCase(), 96).replace(/[^a-z0-9_:-]/g, "") || "anon_user";
}

function normalizeStringArray(values: unknown, maxItems: number, maxLen: number, upper = false) {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map((value) => sanitizePlainText(String(value || ""), maxLen))
    .map((value) => (upper ? value.toUpperCase() : value))
    .filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, maxItems);
}

function toDefaultVault(userId: string): UserEncryptedVault {
  return {
    userId,
    displayName: "",
    profileNotes: "",
    favoriteSymbols: [],
    preferredTimeframes: [],
    macroInterests: [],
    llmContext: "",
    consent: {
      allowLlmTraining: false,
      allowPersonalization: true,
      updatedAt: nowIso(),
    },
    updatedAt: nowIso(),
  };
}

function getEncryptionKey() {
  const configured = String(process.env.TRADEHAX_USER_DATA_ENCRYPTION_KEY || "").trim();
  if (configured) {
    if (/^[A-Za-z0-9+/=]+$/.test(configured)) {
      const maybeBase64 = Buffer.from(configured, "base64");
      if (maybeBase64.length === 32) {
        return maybeBase64;
      }
    }
    return crypto.createHash("sha256").update(configured).digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("TRADEHAX_USER_DATA_ENCRYPTION_KEY is required in production.");
  }

  const fallback = String(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev-tradehax-user-data-key");
  return crypto.createHash("sha256").update(`fallback:${fallback}`).digest();
}

function encryptVault(payload: UserEncryptedVault): EncryptedEnvelope {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf-8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    updatedAt: nowIso(),
  };
}

function decryptVault(envelope: EncryptedEnvelope): UserEncryptedVault | null {
  if (!envelope || envelope.alg !== "aes-256-gcm" || envelope.v !== 1) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(envelope.iv, "base64");
    const tag = Buffer.from(envelope.tag, "base64");
    const ciphertext = Buffer.from(envelope.ciphertext, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
    const parsed = JSON.parse(decrypted) as Partial<UserEncryptedVault>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const userId = normalizeUserId(String(parsed.userId || "anon_user"));
    return {
      userId,
      displayName: sanitizePlainText(String(parsed.displayName || ""), 80),
      profileNotes: sanitizePlainText(String(parsed.profileNotes || ""), 1600),
      favoriteSymbols: normalizeStringArray(parsed.favoriteSymbols, 40, 20, true),
      preferredTimeframes: normalizeStringArray(parsed.preferredTimeframes, 30, 20, false),
      macroInterests: normalizeStringArray(parsed.macroInterests, 40, 30, true),
      llmContext: sanitizePlainText(String(parsed.llmContext || ""), 4000),
      consent: {
        allowLlmTraining: Boolean(parsed.consent?.allowLlmTraining),
        allowPersonalization:
          parsed.consent?.allowPersonalization === undefined
            ? true
            : Boolean(parsed.consent.allowPersonalization),
        updatedAt:
          typeof parsed.consent?.updatedAt === "string" ? parsed.consent.updatedAt : nowIso(),
      },
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
    };
  } catch {
    return null;
  }
}

async function readStore(): Promise<VaultStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as VaultStore;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeStore(store: VaultStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function getUserEncryptedVault(userId: string) {
  const normalizedId = normalizeUserId(userId);
  const store = await readStore();
  const envelope = store[normalizedId];

  if (!envelope) {
    const initial = toDefaultVault(normalizedId);
    store[normalizedId] = encryptVault(initial);
    await writeStore(store);
    return initial;
  }

  const decrypted = decryptVault(envelope);
  if (!decrypted) {
    const reset = toDefaultVault(normalizedId);
    store[normalizedId] = encryptVault(reset);
    await writeStore(store);
    return reset;
  }

  if (decrypted.userId !== normalizedId) {
    decrypted.userId = normalizedId;
    decrypted.updatedAt = nowIso();
    store[normalizedId] = encryptVault(decrypted);
    await writeStore(store);
  }

  return decrypted;
}

export async function updateUserEncryptedVault(
  userId: string,
  patch: {
    displayName?: string;
    profileNotes?: string;
    favoriteSymbols?: string[];
    preferredTimeframes?: string[];
    macroInterests?: string[];
    llmContext?: string;
    consent?: {
      allowLlmTraining?: boolean;
      allowPersonalization?: boolean;
    };
  },
) {
  const normalizedId = normalizeUserId(userId);
  const current = await getUserEncryptedVault(normalizedId);

  const next: UserEncryptedVault = {
    ...current,
    displayName:
      typeof patch.displayName === "string"
        ? sanitizePlainText(patch.displayName, 80)
        : current.displayName,
    profileNotes:
      typeof patch.profileNotes === "string"
        ? sanitizePlainText(patch.profileNotes, 1600)
        : current.profileNotes,
    favoriteSymbols:
      patch.favoriteSymbols !== undefined
        ? normalizeStringArray(patch.favoriteSymbols, 40, 20, true)
        : current.favoriteSymbols,
    preferredTimeframes:
      patch.preferredTimeframes !== undefined
        ? normalizeStringArray(patch.preferredTimeframes, 30, 20, false)
        : current.preferredTimeframes,
    macroInterests:
      patch.macroInterests !== undefined
        ? normalizeStringArray(patch.macroInterests, 40, 30, true)
        : current.macroInterests,
    llmContext:
      typeof patch.llmContext === "string"
        ? sanitizePlainText(patch.llmContext, 4000)
        : current.llmContext,
    consent: {
      allowLlmTraining:
        typeof patch.consent?.allowLlmTraining === "boolean"
          ? patch.consent.allowLlmTraining
          : current.consent.allowLlmTraining,
      allowPersonalization:
        typeof patch.consent?.allowPersonalization === "boolean"
          ? patch.consent.allowPersonalization
          : current.consent.allowPersonalization,
      updatedAt:
        patch.consent &&
        (typeof patch.consent.allowLlmTraining === "boolean" ||
          typeof patch.consent.allowPersonalization === "boolean")
          ? nowIso()
          : current.consent.updatedAt,
    },
    updatedAt: nowIso(),
  };

  const store = await readStore();
  store[normalizedId] = encryptVault(next);
  await writeStore(store);
  return next;
}
