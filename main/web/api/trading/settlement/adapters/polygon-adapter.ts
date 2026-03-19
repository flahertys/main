import crypto from 'node:crypto';
import type {
  SettlementAdapter,
  SettlementExecutionRequest,
  SettlementExecutionResult,
} from '../types.js';

const POLYGON_SETTLEMENT_MODE = process.env.SETTLEMENT_POLYGON_MODE || 'simulate';

class PolygonSettlementAdapter implements SettlementAdapter {
  key = 'polygon';

  async execute(request: SettlementExecutionRequest): Promise<SettlementExecutionResult> {
    const executionId = `POLY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (POLYGON_SETTLEMENT_MODE !== 'simulate') {
      return {
        ok: false,
        adapter: this.key,
        status: 'rejected',
        executionId,
        message: `Unsupported polygon settlement mode: ${POLYGON_SETTLEMENT_MODE}`,
      };
    }

    return {
      ok: true,
      adapter: this.key,
      status: 'simulated',
      executionId,
      message: 'Polygon adapter simulated execution accepted.',
      details: {
        market: request.order.market,
        side: request.order.side,
        size: request.order.size,
        price: request.order.price,
      },
    };
  }
}

export const polygonSettlementAdapter = new PolygonSettlementAdapter();

