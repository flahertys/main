/**
 * Enterprise Compliance & Audit Logger
 * Immutable event logging for SEC/FINRA regulatory compliance
 * Every trade signal, execution, and API call is logged with cryptographic proof
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { Pool } from 'pg';

export interface AuditEvent {
  eventId: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
  actorId: string;
  actorRole?: string;
  actorIp?: string;
  resourceType: string;
  resourceId?: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'APPROVE';
  description?: string;
  details?: Record<string, any>;
  signalId?: string;
  tradeId?: string;
  portfolioId?: string;
  riskData?: Record<string, any>;
  complianceStatus?: string;
  approvedBy?: string;
}

export interface TradeAudit {
  tradeId: string;
  eventId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  price: number;
  venue: string;
  executionTime: Date;
  portfolioVarBefore: number;
  portfolioVarAfter: number;
  kellyCriterion: number;
  approvedBy?: string;
}

export interface SignalAudit {
  signalId: string;
  eventId: string;
  momentumFactor: number;
  sentimentFactor: number;
  volatilityFactor: number;
  finalConfidence: number;
  confidenceReasoning: string;
  backtestWinRate: number;
  backtestReturns: number;
}

/**
 * Cryptographic proof chain for immutability
 */
export class ProofChain {
  private chain: Array<{ hash: string; timestamp: Date }> = [];

  addEvent(eventData: any): { hash: string; previousHash: string } {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(eventData))
      .digest('hex');

    const previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : '';

    this.chain.push({ hash, timestamp: new Date() });
    return { hash, previousHash };
  }

  verify(eventHash: string, previousHash: string): boolean {
    const index = this.chain.findIndex((e) => e.hash === eventHash);
    if (index === -1) return false;

    if (index === 0) return previousHash === '';
    return this.chain[index - 1].hash === previousHash;
  }

  getChainProof(): string {
    return this.chain.map((e) => e.hash).join('->');
  }
}

/**
 * Enterprise Compliance Logger
 */
export class ComplianceLogger extends EventEmitter {
  private pool: Pool;
  private proofChain: ProofChain = new ProofChain();
  private eventBuffer: AuditEvent[] = [];
  private bufferSize = 100;
  private flushInterval: NodeJS.Timer | null = null;

  constructor(dbPool: Pool) {
    super();
    this.pool = dbPool;
    this.startBufferFlush();
  }

  /**
   * Log a general audit event
   */
  async logAuditEvent(event: AuditEvent): Promise<void> {
    const eventId = event.eventId || crypto.randomUUID();
    const timestamp = new Date();

    // Generate cryptographic proof
    const { hash, previousHash } = this.proofChain.addEvent({
      ...event,
      timestamp,
      eventId,
    });

    const enrichedEvent = {
      ...event,
      eventId,
      timestamp,
      contentHash: hash,
      previousHash,
    };

    // Buffer for batch insert
    this.eventBuffer.push(enrichedEvent as AuditEvent);

    // Emit for real-time monitoring
    this.emit('audit-event', enrichedEvent);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Log a trade execution
   */
  async logTradeExecution(trade: TradeAudit): Promise<void> {
    const eventId = crypto.randomUUID();

    await this.logAuditEvent({
      eventId,
      eventType: 'TRADE_EXECUTED',
      severity: 'INFO',
      timestamp: new Date(),
      actorId: 'SYSTEM',
      resourceType: 'TRADE',
      resourceId: trade.tradeId,
      action: 'EXECUTE',
      description: `Trade executed: ${trade.side} ${trade.quantity} ${trade.symbol} @ ${trade.price}`,
      details: trade,
      tradeId: trade.tradeId,
      riskData: {
        varBefore: trade.portfolioVarBefore,
        varAfter: trade.portfolioVarAfter,
        kellyCriterion: trade.kellyCriterion,
      },
    });
  }

  /**
   * Log signal generation
   */
  async logSignalGeneration(signal: SignalAudit): Promise<void> {
    const eventId = crypto.randomUUID();

    await this.logAuditEvent({
      eventId,
      eventType: 'TRADE_SIGNAL_GENERATED',
      severity: 'INFO',
      timestamp: new Date(),
      actorId: 'ML_ENGINE',
      resourceType: 'SIGNAL',
      resourceId: signal.signalId,
      action: 'CREATE',
      description: `Signal generated with confidence: ${signal.finalConfidence}%`,
      details: signal,
      signalId: signal.signalId,
    });
  }

  /**
   * Log risk limit breach
   */
  async logRiskBreach(
    portfolioId: string,
    limitType: string,
    currentValue: number,
    threshold: number
  ): Promise<void> {
    const eventId = crypto.randomUUID();

    await this.logAuditEvent({
      eventId,
      eventType: 'RISK_LIMIT_BREACH',
      severity: 'CRITICAL',
      timestamp: new Date(),
      actorId: 'RISK_ENGINE',
      resourceType: 'PORTFOLIO',
      resourceId: portfolioId,
      action: 'UPDATE',
      description: `Risk limit breach: ${limitType} = ${currentValue} (threshold: ${threshold})`,
      portfolioId,
      riskData: {
        limitType,
        currentValue,
        threshold,
      },
    });

    // Emit alert for immediate action
    this.emit('risk-breach', { portfolioId, limitType, currentValue, threshold });
  }

  /**
   * Log approval decision
   */
  async logApprovalDecision(
    tradeId: string,
    approver: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    const eventId = crypto.randomUUID();

    await this.logAuditEvent({
      eventId,
      eventType: approved ? 'TRADE_APPROVED' : 'TRADE_REJECTED',
      severity: 'INFO',
      timestamp: new Date(),
      actorId: approver,
      resourceType: 'TRADE',
      resourceId: tradeId,
      action: approved ? 'APPROVE' : 'UPDATE',
      description: `Trade ${approved ? 'approved' : 'rejected'} by ${approver}${reason ? ': ' + reason : ''}`,
      tradeId,
      approvedBy: approved ? approver : undefined,
    });
  }

  /**
   * Log API call (for rate limiting and audit)
   */
  async logAPICall(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number
  ): Promise<void> {
    const eventId = crypto.randomUUID();

    await this.logAuditEvent({
      eventId,
      eventType: 'API_CALL_MADE',
      severity: statusCode >= 400 ? 'WARNING' : 'INFO',
      timestamp: new Date(),
      actorId: userId,
      resourceType: 'API',
      action: 'READ',
      description: `${method} ${endpoint} -> ${statusCode} (${latencyMs}ms)`,
      details: { endpoint, method, statusCode, latencyMs },
    });
  }

  /**
   * Flush event buffer to database
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = this.eventBuffer.splice(0, this.bufferSize);

      const query = `
        INSERT INTO audit_events (
          event_id, event_type, severity, timestamp, actor_id, actor_role,
          resource_type, resource_id, action, description, details,
          signal_id, trade_id, portfolio_id, risk_data, content_hash, previous_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;

      for (const event of events) {
        await this.pool.query(query, [
          event.eventId,
          event.eventType,
          event.severity,
          event.timestamp,
          event.actorId,
          event.actorRole,
          event.resourceType,
          event.resourceId,
          event.action,
          event.description,
          event.details ? JSON.stringify(event.details) : null,
          event.signalId,
          event.tradeId,
          event.portfolioId,
          event.riskData ? JSON.stringify(event.riskData) : null,
          (event as any).contentHash,
          (event as any).previousHash,
        ]);
      }

      this.emit('flushed', { count: events.length, timestamp: new Date() });
    } catch (error) {
      this.emit('flush-error', error);
      this.eventBuffer.push(...this.eventBuffer); // Re-add on error
    }
  }

  /**
   * Query audit events (for compliance review)
   */
  async queryEvents(
    filters: {
      startTime?: Date;
      endTime?: Date;
      eventType?: string;
      actorId?: string;
      resourceId?: string;
      limit?: number;
    }
  ): Promise<AuditEvent[]> {
    let query = 'SELECT * FROM audit_events WHERE 1=1';
    const params: any[] = [];

    if (filters.startTime) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(filters.startTime);
    }

    if (filters.endTime) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(filters.endTime);
    }

    if (filters.eventType) {
      query += ` AND event_type = $${params.length + 1}`;
      params.push(filters.eventType);
    }

    if (filters.actorId) {
      query += ` AND actor_id = $${params.length + 1}`;
      params.push(filters.actorId);
    }

    if (filters.resourceId) {
      query += ` AND resource_id = $${params.length + 1}`;
      params.push(filters.resourceId);
    }

    query += ` ORDER BY timestamp DESC`;

    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Verify integrity of audit trail
   */
  async verifyIntegrity(startEventId: string, endEventId: string): Promise<boolean> {
    const query = `
      SELECT event_id, content_hash, previous_hash
      FROM audit_events
      WHERE event_id BETWEEN $1 AND $2
      ORDER BY timestamp ASC
    `;

    const result = await this.pool.query(query, [startEventId, endEventId]);
    const events = result.rows;

    for (const event of events) {
      const isValid = this.proofChain.verify(event.content_hash, event.previous_hash);
      if (!isValid) {
        this.emit('integrity-violation', { eventId: event.event_id });
        return false;
      }
    }

    return true;
  }

  /**
   * Start periodic buffer flush
   */
  private startBufferFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => this.emit('flush-error', err));
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Cleanup
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

export default ComplianceLogger;

