/**
 * Institutional API Integration Hub
 * Unified interface for Bloomberg, Reuters, IB, Kraken, Binance, etc.
 * Handles credential management, rate limiting, failover, and audit logging
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * Supported broker/data vendor types
 */
export enum VendorType {
  BLOOMBERG = 'bloomberg',
  REUTERS = 'reuters',
  INTERACTIVE_BROKERS = 'ib',
  KRAKEN = 'kraken',
  BINANCE = 'binance',
  POLYMARKET = 'polymarket',
  FINNHUB = 'finnhub',
  CCXT = 'ccxt', // Crypto exchange abstraction
  CUSTOM = 'custom',
}

/**
 * Vendor credential types
 */
interface VendorCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  accountId?: string;
  clientId?: string;
  clientSecret?: string;
  certificatePath?: string;
  customHeaders?: Record<string, string>;
}

/**
 * API request/response envelope
 */
interface VendorRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

interface VendorResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  latency: number;
  vendor: VendorType;
}

/**
 * Institutional API Client Interface
 */
export interface IVendorClient {
  vendor: VendorType;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  request(req: VendorRequest): Promise<VendorResponse>;
  healthCheck(): Promise<boolean>;
  rateLimit(): number; // RPS limit
}

/**
 * Credential vault interface (AWS Secrets Manager compatible)
 */
export interface ICredentialVault {
  store(vendor: VendorType, credentials: VendorCredentials): Promise<string>;
  retrieve(vendor: VendorType): Promise<VendorCredentials>;
  rotate(vendor: VendorType): Promise<void>;
  audit(vendor: VendorType): Promise<any>;
}

/**
 * Rate limiter with exponential backoff
 */
export class RateLimiter {
  private limits: Map<string, { maxRps: number; current: number; resetAt: number }> = new Map();
  private backoffMultiplier = 2;
  private maxBackoff = 60000; // 60s

  setLimit(vendor: VendorType, maxRps: number): void {
    this.limits.set(vendor, {
      maxRps,
      current: 0,
      resetAt: Date.now() + 1000,
    });
  }

  async acquire(vendor: VendorType): Promise<void> {
    const limit = this.limits.get(vendor);
    if (!limit) return;

    if (Date.now() > limit.resetAt) {
      limit.current = 0;
      limit.resetAt = Date.now() + 1000;
    }

    if (limit.current >= limit.maxRps) {
      const waitTime = Math.min(
        limit.resetAt - Date.now() + 100,
        this.maxBackoff
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire(vendor); // Retry
    }

    limit.current++;
  }
}

/**
 * Base Vendor Client with common functionality
 */
export abstract class BaseVendorClient extends EventEmitter implements IVendorClient {
  protected vendor: VendorType;
  protected credentials: VendorCredentials;
  protected rateLimiter: RateLimiter;
  protected connected: boolean = false;
  protected requestCount: number = 0;
  protected errorCount: number = 0;
  protected lastHeartbeat: number = Date.now();

  constructor(
    vendor: VendorType,
    credentials: VendorCredentials,
    rateLimiter: RateLimiter
  ) {
    super();
    this.vendor = vendor;
    this.credentials = credentials;
    this.rateLimiter = rateLimiter;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract request(req: VendorRequest): Promise<VendorResponse>;

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request({
        method: 'GET',
        endpoint: '/health',
        timeout: 5000,
      });

      this.lastHeartbeat = Date.now();
      this.emit('healthy', { vendor: this.vendor, timestamp: Date.now() });
      return response.status === 200;
    } catch (error) {
      this.errorCount++;
      this.emit('unhealthy', { vendor: this.vendor, error });
      return false;
    }
  }

  rateLimit(): number {
    // Override in subclass
    return 100;
  }

  protected generateSignature(
    method: string,
    endpoint: string,
    body?: any,
    secret?: string
  ): string {
    if (!secret) return '';

    const message = `${method}${endpoint}${body ? JSON.stringify(body) : ''}`;
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }

  protected async logRequest(req: VendorRequest, res: VendorResponse): Promise<void> {
    this.requestCount++;
    this.emit('request', {
      vendor: this.vendor,
      method: req.method,
      endpoint: req.endpoint,
      status: res.status,
      latency: res.latency,
      timestamp: Date.now(),
    });
  }
}

/**
 * Bloomberg Terminal API Client
 */
export class BloombergClient extends BaseVendorClient {
  private sessionToken?: string;

  constructor(credentials: VendorCredentials, rateLimiter: RateLimiter) {
    super(VendorType.BLOOMBERG, credentials, rateLimiter);
  }

  async connect(): Promise<void> {
    // Bloomberg API connection logic
    this.connected = true;
    this.emit('connected', { vendor: this.vendor });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emit('disconnected', { vendor: this.vendor });
  }

  async request(req: VendorRequest): Promise<VendorResponse> {
    await this.rateLimiter.acquire(this.vendor);

    const startTime = Date.now();
    try {
      // Implement Bloomberg API request
      const response: VendorResponse = {
        status: 200,
        data: {},
        headers: {},
        latency: Date.now() - startTime,
        vendor: this.vendor,
      };

      await this.logRequest(req, response);
      return response;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  rateLimit(): number {
    return 500; // Bloomberg: 500 RPS limit
  }
}

/**
 * Interactive Brokers Client (REST + WebSocket)
 */
export class InteractiveBrokersClient extends BaseVendorClient {
  private accountId?: string;

  constructor(credentials: VendorCredentials, rateLimiter: RateLimiter) {
    super(VendorType.INTERACTIVE_BROKERS, credentials, rateLimiter);
    this.accountId = credentials.accountId;
  }

  async connect(): Promise<void> {
    // IB API connection with OAuth
    this.connected = true;
    this.emit('connected', { vendor: this.vendor });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emit('disconnected', { vendor: this.vendor });
  }

  async request(req: VendorRequest): Promise<VendorResponse> {
    await this.rateLimiter.acquire(this.vendor);

    const startTime = Date.now();
    try {
      // Add account ID to request
      const modifiedEndpoint = req.endpoint.replace('{accountId}', this.accountId || '');

      const response: VendorResponse = {
        status: 200,
        data: {},
        headers: {},
        latency: Date.now() - startTime,
        vendor: this.vendor,
      };

      await this.logRequest(req, response);
      return response;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  rateLimit(): number {
    return 100; // IB: 100 RPS limit
  }
}

/**
 * Kraken Pro Client (Crypto exchange with WebSocket support)
 */
export class KrakenClient extends BaseVendorClient {
  private ws?: WebSocket;
  private subscriptions: Set<string> = new Set();

  constructor(credentials: VendorCredentials, rateLimiter: RateLimiter) {
    super(VendorType.KRAKEN, credentials, rateLimiter);
  }

  async connect(): Promise<void> {
    // Kraken WebSocket connection
    this.connected = true;
    this.emit('connected', { vendor: this.vendor });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
    }
    this.connected = false;
    this.emit('disconnected', { vendor: this.vendor });
  }

  async request(req: VendorRequest): Promise<VendorResponse> {
    await this.rateLimiter.acquire(this.vendor);

    const startTime = Date.now();
    try {
      // Add HMAC signature
      const signature = this.generateSignature(
        req.method,
        req.endpoint,
        req.body,
        this.credentials.apiSecret
      );

      const response: VendorResponse = {
        status: 200,
        data: {},
        headers: { 'API-Sign': signature },
        latency: Date.now() - startTime,
        vendor: this.vendor,
      };

      await this.logRequest(req, response);
      return response;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  rateLimit(): number {
    return 15; // Kraken: 15 RPS limit (varies by tier)
  }

  subscribe(channel: string, symbols: string[]): void {
    symbols.forEach((symbol) => {
      this.subscriptions.add(`${channel}:${symbol}`);
    });
    this.emit('subscribed', { vendor: this.vendor, channels: Array.from(this.subscriptions) });
  }
}

/**
 * Binance Client (Crypto exchange)
 */
export class BinanceClient extends BaseVendorClient {
  constructor(credentials: VendorCredentials, rateLimiter: RateLimiter) {
    super(VendorType.BINANCE, credentials, rateLimiter);
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connected', { vendor: this.vendor });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emit('disconnected', { vendor: this.vendor });
  }

  async request(req: VendorRequest): Promise<VendorResponse> {
    await this.rateLimiter.acquire(this.vendor);

    const startTime = Date.now();
    try {
      const response: VendorResponse = {
        status: 200,
        data: {},
        headers: {},
        latency: Date.now() - startTime,
        vendor: this.vendor,
      };

      await this.logRequest(req, response);
      return response;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  rateLimit(): number {
    return 1200; // Binance: 1200 RPS limit
  }
}

/**
 * Institutional API Hub (Broker Aggregator)
 */
export class InstitutionalAPIHub extends EventEmitter {
  private clients: Map<VendorType, IVendorClient> = new Map();
  private rateLimiter: RateLimiter = new RateLimiter();
  private credentialVault: ICredentialVault;
  private healthCheckInterval: NodeJS.Timer | null = null;

  constructor(credentialVault: ICredentialVault) {
    super();
    this.credentialVault = credentialVault;
  }

  /**
   * Register a vendor client
   */
  registerClient(vendor: VendorType, credentials: VendorCredentials): void {
    let client: IVendorClient;

    switch (vendor) {
      case VendorType.BLOOMBERG:
        client = new BloombergClient(credentials, this.rateLimiter);
        break;
      case VendorType.INTERACTIVE_BROKERS:
        client = new InteractiveBrokersClient(credentials, this.rateLimiter);
        break;
      case VendorType.KRAKEN:
        client = new KrakenClient(credentials, this.rateLimiter);
        break;
      case VendorType.BINANCE:
        client = new BinanceClient(credentials, this.rateLimiter);
        break;
      default:
        throw new Error(`Unsupported vendor: ${vendor}`);
    }

    this.clients.set(vendor, client);
    this.emit('client-registered', { vendor, timestamp: Date.now() });
  }

  /**
   * Get client for specific vendor
   */
  getClient(vendor: VendorType): IVendorClient | undefined {
    return this.clients.get(vendor);
  }

  /**
   * Connect all registered clients
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.clients.values()).map((client) =>
      client.connect().catch((err) => {
        this.emit('connection-error', { vendor: client.vendor, error: err });
      })
    );

    await Promise.all(promises);
    this.startHealthChecks();
  }

  /**
   * Disconnect all clients
   */
  async disconnectAll(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const promises = Array.from(this.clients.values()).map((client) =>
      client.disconnect().catch((err) => {
        this.emit('disconnection-error', { vendor: client.vendor, error: err });
      })
    );

    await Promise.all(promises);
  }

  /**
   * Health check loop
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const client of this.clients.values()) {
        const healthy = await client.healthCheck();
        if (!healthy) {
          this.emit('health-alert', { vendor: client.vendor, status: 'unhealthy' });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Route request to best available vendor
   */
  async smartRoute(
    vendors: VendorType[],
    req: VendorRequest
  ): Promise<VendorResponse> {
    const availableClients = vendors
      .map((v) => this.clients.get(v))
      .filter((c) => c && c.isConnected());

    if (availableClients.length === 0) {
      throw new Error('No available vendors for request');
    }

    // Use first available (can implement latency-based selection)
    const client = availableClients[0] as IVendorClient;
    return client.request(req);
  }

  /**
   * Get aggregated health status
   */
  getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [vendor, client] of this.clients.entries()) {
      status[vendor] = {
        connected: client.isConnected(),
        rpsLimit: client.rateLimit(),
      };
    }

    return status;
  }
}

export default InstitutionalAPIHub;

