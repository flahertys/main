import type {
  SettlementAdapter,
  SettlementExecutionRequest,
  SettlementExecutionResult,
} from '../types.js';
import crypto from 'node:crypto';

export interface FeePolicy {
  kind: 'flat' | 'percentage' | 'dynamic';
  estimateGas(request: SettlementExecutionRequest): Promise<{ gasCost: number; totalFee: number }>;
}

export interface SequencerInterface {
  /**
   * Submit order to sequencer for batching + ordering.
   * Sequencer responsibilities: order prioritization, MEV protection, batching window.
   */
  submitOrder(request: SettlementExecutionRequest): Promise<{ sequencerOrderId: string; estimatedLatency: number }>;
}

export interface RelayerInterface {
  /**
   * Relay finalized order batch from sequencer to L1/settlement layer.
   * Relayer responsibilities: gas optimization, nonce management, finality confirmation.
   */
  relayBatch(sequencerOrderIds: string[]): Promise<{ transactionHash: string; status: string }>;
}

class L2CustomSettlementAdapter implements SettlementAdapter {
  key = 'l2-custom';

  private readonly mode = (process.env.SETTLEMENT_L2_MODE || 'auto').toLowerCase();
  private readonly timeoutMs = Number(process.env.SETTLEMENT_L2_TIMEOUT_MS || 5000);
  private readonly apiKey = process.env.SETTLEMENT_L2_API_KEY || '';
  private readonly endpoints = {
    sequencer: {
      local: process.env.SETTLEMENT_L2_SEQUENCER_LOCAL_URL || '',
      cloud: process.env.SETTLEMENT_L2_SEQUENCER_CLOUD_URL || '',
    },
    relayer: {
      local: process.env.SETTLEMENT_L2_RELAYER_LOCAL_URL || '',
      cloud: process.env.SETTLEMENT_L2_RELAYER_CLOUD_URL || '',
    },
  };

  // Defaults remain in-process so the adapter still works without remote services.
  private sequencer: SequencerInterface = {
    submitOrder: async (request: SettlementExecutionRequest) => ({
      sequencerOrderId: `SEQ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      estimatedLatency: 500,
    }),
  };

  private relayer: RelayerInterface = {
    relayBatch: async (sequencerOrderIds: string[]) => ({
      transactionHash: `0x${Array(64).fill('0').join('')}`,
      status: 'pending',
    }),
  };

  private feePolicy: FeePolicy = {
    kind: 'dynamic',
    estimateGas: async (request: SettlementExecutionRequest) => ({
      gasCost: 50000, // Mock gas cost
      totalFee: request.order.size * 0.001, // Mock: 0.1% of size
    }),
  };

  private isValidHttpUrl(value: string): boolean {
    if (!value) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private getEndpointOrder(target: 'sequencer' | 'relayer'): string[] {
    const candidates = this.endpoints[target];
    if (this.mode === 'local') return [candidates.local];
    if (this.mode === 'cloud') return [candidates.cloud];
    return [candidates.local, candidates.cloud].filter(Boolean);
  }

  private async callEndpoint<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
    if (!this.isValidHttpUrl(endpoint)) {
      throw new Error(`Invalid endpoint URL: ${endpoint || 'empty'}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await response.text();
      const parsed = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const retryable = response.status >= 500 || response.status === 429;
        throw new Error(`${retryable ? 'RETRYABLE' : 'FATAL'}:${response.status}:${parsed?.message || 'request failed'}`);
      }
      return parsed as T;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`RETRYABLE:408:timeout after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async submitOrderViaConfiguredEndpoints(request: SettlementExecutionRequest): Promise<{ sequencerOrderId: string; estimatedLatency: number; endpointUsed: string }> {
    const candidates = this.getEndpointOrder('sequencer');
    let lastError = '';

    for (const endpoint of candidates) {
      try {
        const result = await this.callEndpoint<{ sequencerOrderId: string; estimatedLatency?: number }>(endpoint, { request });
        return {
          sequencerOrderId: result.sequencerOrderId,
          estimatedLatency: Number(result.estimatedLatency || 0),
          endpointUsed: endpoint,
        };
      } catch (error: any) {
        const reason = String(error?.message || 'unknown sequencer error');
        lastError = reason;
        if (!reason.startsWith('RETRYABLE:')) throw error;
      }
    }

    throw new Error(lastError || 'No sequencer endpoint available.');
  }

  private async relayBatchViaConfiguredEndpoints(sequencerOrderIds: string[]): Promise<{ transactionHash: string; status: string; endpointUsed: string }> {
    const candidates = this.getEndpointOrder('relayer');
    let lastError = '';

    for (const endpoint of candidates) {
      try {
        const result = await this.callEndpoint<{ transactionHash: string; status?: string }>(endpoint, { sequencerOrderIds });
        return {
          transactionHash: result.transactionHash,
          status: result.status || 'pending',
          endpointUsed: endpoint,
        };
      } catch (error: any) {
        const reason = String(error?.message || 'unknown relayer error');
        lastError = reason;
        if (!reason.startsWith('RETRYABLE:')) throw error;
      }
    }

    throw new Error(lastError || 'No relayer endpoint available.');
  }

  /**
   * Configure sequencer interface for this L2 (e.g., Optimism Sequencer HTTP endpoint).
   */
  setSequencer(sequencer: SequencerInterface): void {
    this.sequencer = sequencer;
  }

  /**
   * Configure relayer interface (e.g., custom relayer service URL).
   */
  setRelayer(relayer: RelayerInterface): void {
    this.relayer = relayer;
  }

  /**
   * Set fee calculation policy (flat, percentage, or dynamic block-based).
   */
  setFeePolicy(policy: FeePolicy): void {
    this.feePolicy = policy;
  }

  async execute(request: SettlementExecutionRequest): Promise<SettlementExecutionResult> {
    const executionId = `L2-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
      // 1. Estimate fees using configured fee policy
      const feeEstimate = await this.feePolicy.estimateGas(request);

      // 2. Submit order to sequencer
      const sequencerResult = this.getEndpointOrder('sequencer').length
        ? await this.submitOrderViaConfiguredEndpoints(request)
        : await this.sequencer.submitOrder(request);

      // 3. Relay batch once sequencer has batched order
      const relayResult = this.getEndpointOrder('relayer').length
        ? await this.relayBatchViaConfiguredEndpoints([sequencerResult.sequencerOrderId])
        : await this.relayer.relayBatch([sequencerResult.sequencerOrderId]);

      return {
        ok: true,
        adapter: this.key,
        status: 'accepted',
        executionId,
        message: `L2 custom settlement: sequencer=${sequencerResult.sequencerOrderId}, relay=${relayResult.transactionHash.slice(0, 10)}...`,
        details: {
          market: request.order.market,
          side: request.order.side,
          size: request.order.size,
          price: request.order.price,
          feeEstimate,
          sequencerLatencyMs: sequencerResult.estimatedLatency,
          relayStatus: relayResult.status,
          mode: this.mode,
          sequencerEndpoint: 'endpointUsed' in sequencerResult ? sequencerResult.endpointUsed : 'custom-injected',
          relayerEndpoint: 'endpointUsed' in relayResult ? relayResult.endpointUsed : 'custom-injected',
        },
      };
    } catch (err: any) {
      return {
        ok: false,
        adapter: this.key,
        status: 'rejected',
        executionId,
        message: `L2 custom settlement error: ${err?.message || 'Unknown error'}`,
      };
    }
  }
}

export const l2CustomSettlementAdapter = new L2CustomSettlementAdapter();

