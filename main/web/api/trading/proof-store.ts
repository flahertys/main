import { randomBytes } from 'node:crypto';
import { getSnapshot, incrementCounter } from './telemetry-repository.js';
import type { TelemetryEvent } from './telemetry-repository.js';
import {
  issueChallenge as durableIssueChallenge,
  getChallenge as durableGetChallenge,
  consumeChallenge as durableConsumeChallenge,
  finalizeChallengeProof as durableFinalizeChallengeProof,
  saveProof as durableSaveProof,
  getProof as durableGetProof,
  isProofFresh as durableIsProofFresh,
  isDurableAuthConfigured,
} from './auth-store.js';
import type { ChallengeRecord as DurableChallengeRecord } from './auth-store.js';

export type SignatureType = 'personal_sign' | 'eip712';

interface ChallengeRecord {
  nonce: string;
  address: string;
  chainId: string;
  signatureType: SignatureType;
  message: string;
  typedData?: {
    domain: Record<string, any>;
    types: Record<string, Array<{ name: string; type: string }>>;
    value: Record<string, any>;
  };
  issuedAt: number;
  expiresAt: number;
}

interface ProofRecord {
  address: string;
  chainId: string;
  nonce: string;
  signatureType: SignatureType;
  verifiedAt: number;
  expiresAt: number;
}

const challenges = new Map<string, ChallengeRecord>();
const proofs = new Map<string, ProofRecord>();

function proofKey(address: string, chainId: string): string {
  return `${address.toLowerCase()}:${chainId}`;
}

function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export async function issueChallenge(params: {
  address: string;
  chainId: string;
  signatureType: SignatureType;
  ttlMs: number;
}): Promise<ChallengeRecord> {
  const nonce = randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const expiresAt = issuedAt + params.ttlMs;

  const message = [
    'TradeHax wallet ownership check',
    `Address: ${params.address}`,
    `Chain: ${params.chainId}`,
    `Nonce: ${nonce}`,
    `IssuedAtMs: ${issuedAt}`,
    `This signature only proves wallet control for gated live execution.`
  ].join('\n');

  const typedData = {
    domain: {
      name: 'TradeHax',
      version: '1',
      chainId: parseInt(params.chainId, 16),
    },
    types: {
      WalletChallenge: [
        { name: 'address', type: 'address' },
        { name: 'nonce', type: 'string' },
        { name: 'issuedAtMs', type: 'uint256' },
      ],
    },
    value: {
      address: params.address,
      nonce,
      issuedAtMs: issuedAt,
    },
  };

  const record: ChallengeRecord = {
    nonce,
    address: params.address,
    chainId: params.chainId,
    signatureType: params.signatureType,
    message,
    typedData,
    issuedAt,
    expiresAt,
  };

  challenges.set(nonce, record);

  const durableRecord: DurableChallengeRecord = {
    nonce: record.nonce,
    address: record.address,
    chainId: record.chainId,
    signatureType: record.signatureType,
    message: record.message,
    typedData: record.typedData,
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
  };

  if (isDurableAuthConfigured()) {
    try {
      await durableIssueChallenge(durableRecord);
    } catch {
      // Memory copy already exists; degrade gracefully if durable store is unavailable.
    }
  }

  return record;
}

export async function getChallenge(nonce: string): Promise<ChallengeRecord | null> {
  const cached = challenges.get(nonce) || null;
  if (cached && !isExpired(cached.expiresAt)) {
    return cached;
  }
  if (cached) {
    challenges.delete(nonce);
  }

  if (!isDurableAuthConfigured()) return null;

  try {
    const durable = await durableGetChallenge(nonce);
    if (!durable || isExpired(durable.expiresAt)) return null;

    const record: ChallengeRecord = {
      nonce: durable.nonce,
      address: durable.address,
      chainId: durable.chainId,
      signatureType: durable.signatureType,
      message: durable.message,
      typedData: durable.typedData,
      issuedAt: durable.issuedAt,
      expiresAt: durable.expiresAt,
    };
    challenges.set(nonce, record);
    return record;
  } catch {
    return null;
  }
}

export async function consumeChallenge(nonce: string): Promise<ChallengeRecord | null> {
  const challenge = challenges.get(nonce) || null;
  if (challenge) challenges.delete(nonce);

  if (isDurableAuthConfigured()) {
    try {
      const durable = await durableConsumeChallenge(nonce);
      if (!challenge && durable && !isExpired(durable.expiresAt)) {
        return {
          nonce: durable.nonce,
          address: durable.address,
          chainId: durable.chainId,
          signatureType: durable.signatureType,
          message: durable.message,
          typedData: durable.typedData,
          issuedAt: durable.issuedAt,
          expiresAt: durable.expiresAt,
        };
      }
    } catch {
      // Graceful fallback to in-memory result.
    }
  }

  return challenge;
}

export async function saveProof(record: ProofRecord): Promise<ProofRecord> {
  proofs.set(proofKey(record.address, record.chainId), record);
  if (isDurableAuthConfigured()) {
    try {
      await durableSaveProof({
        address: record.address,
        chainId: record.chainId,
        nonce: record.nonce,
        signatureType: record.signatureType,
        verifiedAt: record.verifiedAt,
        expiresAt: record.expiresAt,
      });
    } catch {
      // Keep serving via memory cache on durable failures.
    }
  }
  return record;
}

/**
 * Finalize verify in a single operation: consume one-time challenge and persist proof.
 */
export async function finalizeVerifiedProof(params: {
  nonce: string;
  address: string;
  chainId: string;
  signatureType: SignatureType;
  verifiedAt: number;
  expiresAt: number;
}): Promise<ProofRecord | null> {
  const proof: ProofRecord = {
    address: params.address,
    chainId: params.chainId,
    nonce: params.nonce,
    signatureType: params.signatureType,
    verifiedAt: params.verifiedAt,
    expiresAt: params.expiresAt,
  };

  if (isDurableAuthConfigured()) {
    try {
      const durableProof = await durableFinalizeChallengeProof({
        nonce: params.nonce,
        proof: {
          address: proof.address,
          chainId: proof.chainId,
          nonce: proof.nonce,
          signatureType: proof.signatureType,
          verifiedAt: proof.verifiedAt,
          expiresAt: proof.expiresAt,
        },
      });

      if (!durableProof) return null;

      proofs.set(proofKey(durableProof.address, durableProof.chainId), {
        address: durableProof.address,
        chainId: durableProof.chainId,
        nonce: durableProof.nonce,
        signatureType: durableProof.signatureType,
        verifiedAt: durableProof.verifiedAt,
        expiresAt: durableProof.expiresAt,
      });
      challenges.delete(params.nonce);
      return {
        address: durableProof.address,
        chainId: durableProof.chainId,
        nonce: durableProof.nonce,
        signatureType: durableProof.signatureType,
        verifiedAt: durableProof.verifiedAt,
        expiresAt: durableProof.expiresAt,
      };
    } catch {
      return null;
    }
  }

  const consumed = await consumeChallenge(params.nonce);
  if (!consumed) return null;
  return saveProof(proof);
}

export async function getProof(address: string): Promise<ProofRecord | null> {
  const addressLower = address.toLowerCase();
  let freshest: ProofRecord | null = null;

  for (const [key, proof] of proofs.entries()) {
    if (!key.startsWith(`${addressLower}:`)) continue;
    if (isExpired(proof.expiresAt)) {
      proofs.delete(key);
      continue;
    }
    if (!freshest || proof.verifiedAt > freshest.verifiedAt) {
      freshest = proof;
    }
  }

  if (freshest) return freshest;
  if (!isDurableAuthConfigured()) return null;

  try {
    const durable = await durableGetProof(address);
    if (!durable || isExpired(durable.expiresAt)) return null;

    const proof: ProofRecord = {
      address: durable.address,
      chainId: durable.chainId,
      nonce: durable.nonce,
      signatureType: durable.signatureType,
      verifiedAt: durable.verifiedAt,
      expiresAt: durable.expiresAt,
    };

    proofs.set(proofKey(proof.address, proof.chainId), proof);
    return proof;
  } catch {
    return null;
  }
}

export async function isProofFresh(address: string, nowMs = Date.now()): Promise<boolean> {
  const proof = await getProof(address);
  if (proof) return proof.expiresAt > nowMs;

  if (!isDurableAuthConfigured()) return false;
  try {
    return await durableIsProofFresh(address, nowMs);
  } catch {
    return false;
  }
}

export async function incrementTelemetryCounter(eventName: TelemetryEvent): Promise<void> {
  await incrementCounter(eventName);
}

export async function getTelemetrySnapshot() {
  return getSnapshot();
}

export function isTelemetryEvent(value: string): value is TelemetryEvent {
  return value === 'connect_success'
    || value === 'connect_rejected'
    || value === 'chain_mismatch'
    || value === 'manual_fallback';
}

