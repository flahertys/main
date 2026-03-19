import crypto from 'node:crypto';
import { getSnapshot, incrementCounter } from './telemetry-repository.js';
import type { TelemetryEvent } from './telemetry-repository.js';
import {
  issueChallenge as durableIssueChallenge,
  getChallenge as durableGetChallenge,
  consumeChallenge as durableConsumeChallenge,
  saveProof as durableSaveProof,
  getProof as durableGetProof,
  isProofFresh as durableIsProofFresh,
  isDurableAuthConfigured,
} from './auth-store.js';
import type { ChallengeRecord as DurableChallengeRecord, ProofRecord as DurableProofRecord } from './auth-store.js';

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

export async function issueChallenge(params: {
  address: string;
  chainId: string;
  signatureType: SignatureType;
  ttlMs: number;
}): Promise<ChallengeRecord> {
  const nonce = crypto.randomBytes(16).toString('hex');
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
    await durableIssueChallenge(durableRecord);
  }

  return record;
}

export async function getChallenge(nonce: string): Promise<ChallengeRecord | null> {
  return challenges.get(nonce) || null;
}

export async function consumeChallenge(nonce: string): Promise<ChallengeRecord | null> {
  const challenge = challenges.get(nonce) || null;
  if (challenge) challenges.delete(nonce);
  if (isDurableAuthConfigured()) {
    await durableConsumeChallenge(nonce);
  }
  return challenge;
}

export async function saveProof(record: ProofRecord): Promise<ProofRecord> {
  proofs.set(record.address.toLowerCase(), record);
  if (isDurableAuthConfigured()) {
    await durableSaveProof({
      address: record.address,
      chainId: record.chainId,
      nonce: record.nonce,
      signatureType: record.signatureType,
      verifiedAt: record.verifiedAt,
      expiresAt: record.expiresAt,
    });
  }
  return record;
}

export async function getProof(address: string): Promise<ProofRecord | null> {
  return proofs.get(address.toLowerCase()) || null;
}

export async function isProofFresh(address: string, nowMs = Date.now()): Promise<boolean> {
  const proof = getProof(address);
  return !!proof && proof.expiresAt > nowMs;
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

