export interface SettlementOrder {
  market: string;
  side: 'BUY_YES' | 'BUY_NO' | 'SELL_YES' | 'SELL_NO' | string;
  size: number;
  price: number;
  metadata?: Record<string, unknown>;
}

export interface SettlementExecutionRequest {
  profileId: string;
  chainId: string;
  walletAddress: string;
  order: SettlementOrder;
}

export interface SettlementExecutionResult {
  ok: boolean;
  adapter: string;
  status: 'accepted' | 'simulated' | 'rejected';
  executionId?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SettlementAdapter {
  key: string;
  execute(request: SettlementExecutionRequest): Promise<SettlementExecutionResult>;
}

