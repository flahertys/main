import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAddress } from 'ethers';
import { getProof, incrementTelemetryCounter, isProofFresh } from './proof-store.js';
import { resolveSettlementAdapter } from './settlement/registry.js';
import {
  isChainAllowed,
  normalizeHexChainId,
  resolveExecutionProfile,
} from '../../shared/trading/execution-policy.js';

const EXECUTION_PROFILE_ID = process.env.EXECUTION_PROFILE_ID || 'polygon-evm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const action = String(req.query.action || 'preflight');
    if (action !== 'preflight' && action !== 'execute') {
      return res.status(400).json({ error: 'Invalid action', code: 'INVALID_ACTION' });
    }

    const profile = resolveExecutionProfile(EXECUTION_PROFILE_ID);
    const address = getAddress(String(req.body?.address || ''));
    const chainId = normalizeHexChainId(String(req.body?.chainId || ''));

    if (!isChainAllowed(profile, chainId)) {
      await incrementTelemetryCounter('chain_mismatch');
      return res.status(412).json({
        ok: false,
        reason: 'CHAIN_MISMATCH',
        expectedChainId: profile.chainIdHex,
        receivedChainId: chainId,
      });
    }

    const proof = await getProof(address);
    if (!proof || !await isProofFresh(address)) {
      return res.status(401).json({ ok: false, reason: 'PROOF_REQUIRED', code: 'PROOF_REQUIRED' });
    }

    if (proof.chainId !== chainId) {
      await incrementTelemetryCounter('chain_mismatch');
      return res.status(412).json({
        ok: false,
        reason: 'PROOF_CHAIN_MISMATCH',
        code: 'PROOF_CHAIN_MISMATCH',
        expectedChainId: chainId,
        proofChainId: proof.chainId,
      });
    }

    if (action === 'execute') {
      const order = req.body?.order || {};
      const market = String(order.market || '').trim();
      const side = String(order.side || '').trim();
      const size = Number(order.size || 0);
      const price = Number(order.price || 0);

      if (!market || !side || !Number.isFinite(size) || size <= 0 || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ ok: false, reason: 'INVALID_ORDER_PAYLOAD', code: 'INVALID_ORDER_PAYLOAD' });
      }

      const adapterKey = String(profile.settlementAdapter || 'polygon');
      const adapter = resolveSettlementAdapter(adapterKey);

      const result = await adapter.execute({
        profileId: profile.id,
        chainId,
        walletAddress: address,
        order: {
          market,
          side,
          size,
          price,
          metadata: order.metadata || {},
        },
      });

      return res.status(result.ok ? 200 : 502).json({
        ok: result.ok,
        action: 'execute',
        execution: result,
        policy: {
          profileId: profile.id,
          chainIdHex: profile.chainIdHex,
          tokenModel: profile.tokenModel,
          settlementAdapter: profile.settlementAdapter,
        },
      });
    }

    return res.status(200).json({
      ok: true,
      canExecute: true,
      proof: {
        verifiedAt: proof.verifiedAt,
        expiresAt: proof.expiresAt,
        signatureType: proof.signatureType,
      },
      policy: {
        profileId: profile.id,
        chainIdHex: profile.chainIdHex,
        tokenModel: profile.tokenModel,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Order gate error',
      code: 'ORDER_GATE_ERROR',
      message: error?.message || 'Unknown error',
    });
  }
}

