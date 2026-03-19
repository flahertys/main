import crypto from 'node:crypto';
import type {
  SettlementAdapter,
  SettlementExecutionRequest,
  SettlementExecutionResult,
} from '../types.js';

class L2StubSettlementAdapter implements SettlementAdapter {
  key = 'l2-stub';

  async execute(request: SettlementExecutionRequest): Promise<SettlementExecutionResult> {
    const executionId = `L2-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return {
      ok: false,
      adapter: this.key,
      status: 'rejected',
      executionId,
      message: 'L2/custom chain settlement adapter is not configured yet.',
      details: {
        profileId: request.profileId,
        chainId: request.chainId,
      },
    };
  }
}

export const l2StubSettlementAdapter = new L2StubSettlementAdapter();

