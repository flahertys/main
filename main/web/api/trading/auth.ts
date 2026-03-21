import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAddress, verifyMessage, verifyTypedData } from 'ethers';
import {
  consumeChallenge,
  finalizeVerifiedProof,
  getChallenge,
  issueChallenge,
  SignatureType,
} from './proof-store.js';
import {
  DEFAULT_SIGNATURE_MODE,
  resolveExecutionProfile,
  normalizeHexChainId,
  SIGNATURE_MODES,
} from '../../shared/trading/execution-policy.js';

const DEFAULT_CHALLENGE_TTL_MS = Number(process.env.WALLET_CHALLENGE_TTL_MS || 5 * 60 * 1000);
const DEFAULT_PROOF_TTL_MS = Number(process.env.WALLET_PROOF_TTL_MS || 10 * 60 * 1000);
const EXECUTION_PROFILE_ID = process.env.EXECUTION_PROFILE_ID || 'polygon-evm';

function parseSignatureType(value: string | undefined): SignatureType {
  if (value === SIGNATURE_MODES.EIP712) return 'eip712';
  return 'personal_sign';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const action = String(req.query.action || '');
    const profile = resolveExecutionProfile(EXECUTION_PROFILE_ID);

    if (action === 'challenge') {
      const address = getAddress(String(req.body?.address || ''));
      const chainId = normalizeHexChainId(String(req.body?.chainId || profile.chainIdHex || '0x89'));
      const requestedMode = String(req.body?.signatureMode || DEFAULT_SIGNATURE_MODE);
      const signatureType = parseSignatureType(requestedMode === SIGNATURE_MODES.AUTO ? SIGNATURE_MODES.PERSONAL_SIGN : requestedMode);

      const challenge = await issueChallenge({
        address,
        chainId,
        signatureType,
        ttlMs: DEFAULT_CHALLENGE_TTL_MS,
      });

      return res.status(200).json({
        nonce: challenge.nonce,
        signatureType: challenge.signatureType,
        message: challenge.message,
        typedData: challenge.typedData,
        issuedAt: challenge.issuedAt,
        expiresAt: challenge.expiresAt,
        policy: {
          profileId: profile.id,
          chainIdHex: profile.chainIdHex,
          tokenModel: profile.tokenModel,
        },
      });
    }

    if (action === 'verify') {
      const address = getAddress(String(req.body?.address || ''));
      const chainId = normalizeHexChainId(String(req.body?.chainId || ''));
      const nonce = String(req.body?.nonce || '');
      const signature = String(req.body?.signature || '');
      const signatureType = parseSignatureType(String(req.body?.signatureType || ''));

      if (!nonce || !signature) {
        return res.status(400).json({ error: 'nonce and signature are required', code: 'INVALID_VERIFY_PAYLOAD' });
      }

      const challenge = await getChallenge(nonce);
      if (!challenge) {
        return res.status(410).json({ error: 'Challenge missing or already consumed', code: 'CHALLENGE_MISSING' });
      }
      if (Date.now() > challenge.expiresAt) {
        await consumeChallenge(nonce);
        return res.status(410).json({ error: 'Challenge expired', code: 'CHALLENGE_EXPIRED' });
      }
      if (challenge.address !== address || challenge.chainId !== chainId) {
        return res.status(400).json({ error: 'Challenge payload mismatch', code: 'CHALLENGE_PAYLOAD_MISMATCH' });
      }
      if (challenge.signatureType !== signatureType) {
        return res.status(400).json({ error: 'Signature mode mismatch for challenge', code: 'SIGNATURE_MODE_MISMATCH' });
      }

      let recovered = '';
      if (signatureType === 'eip712') {
        recovered = getAddress(verifyTypedData(
          challenge.typedData?.domain || {},
          challenge.typedData?.types || {},
          challenge.typedData?.value || {},
          signature,
        ));
      } else {
        recovered = getAddress(verifyMessage(challenge.message, signature));
      }

      if (recovered !== address) {
        return res.status(401).json({ error: 'Signature does not match wallet address', code: 'INVALID_SIGNATURE' });
      }

      const now = Date.now();
      const proof = await finalizeVerifiedProof({
        nonce,
        address,
        chainId,
        signatureType,
        verifiedAt: now,
        expiresAt: now + DEFAULT_PROOF_TTL_MS,
      });

      if (!proof) {
        return res.status(409).json({ error: 'Challenge already consumed', code: 'CHALLENGE_ALREADY_CONSUMED' });
      }

      return res.status(200).json({
        ok: true,
        proof: {
          nonce: proof.nonce,
          signatureType: proof.signatureType,
          verifiedAt: proof.verifiedAt,
          expiresAt: proof.expiresAt,
        },
      });
    }

    return res.status(400).json({ error: 'Invalid action', code: 'INVALID_ACTION' });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Wallet auth error',
      code: 'WALLET_AUTH_ERROR',
      message: error?.message || 'Unknown error',
    });
  }
}

