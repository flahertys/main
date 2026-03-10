import * as Sentry from "@sentry/nextjs";

/**
 * Request Audit Logger: Tracks API calls for compliance, debugging, and performance monitoring.
 * Integrates with Sentry for error tracking and creates audit trail for fintech workflows.
 */
export class RequestAuditLogger {
  private static instance: RequestAuditLogger;

  static getInstance(): RequestAuditLogger {
    if (!this.instance) {
      this.instance = new RequestAuditLogger();
    }
    return this.instance;
  }

  /**
   * Log API request with context for audit trail
   */
  logRequest(context: {
    method: string;
    path: string;
    ip?: string;
    userId?: string;
    email?: string;
    requestId: string;
    timestamp: number;
    headers?: Record<string, string>;
  }): void {
    // Only log in production to avoid noise
    if (process.env.NODE_ENV === "production") {
      Sentry.captureMessage(`[AUDIT] ${context.method} ${context.path}`, {
        level: "info",
        tags: {
          audit_type: "api_request",
          method: context.method,
          path: context.path,
          user_id: context.userId || "anonymous",
        },
        extra: {
          ip: context.ip,
          email: context.email,
          request_id: context.requestId,
          timestamp: new Date(context.timestamp).toISOString(),
        },
      });
    }
  }

  /**
   * Log API response with timing and status for performance tracking
   */
  logResponse(context: {
    requestId: string;
    path: string;
    status: number;
    responseTimeMs: number;
    userId?: string;
  }): void {
    if (process.env.NODE_ENV === "production") {
      Sentry.captureMessage(`[AUDIT] Response ${context.status} ${context.path}`, {
        level: context.status >= 400 ? "warning" : "info",
        tags: {
          audit_type: "api_response",
          status_code: context.status.toString(),
          path: context.path,
          user_id: context.userId || "anonymous",
        },
        extra: {
          request_id: context.requestId,
          response_time_ms: context.responseTimeMs,
        },
      });
    }
  }

  /**
   * Log authentication event (login, logout, token refresh)
   */
  logAuthEvent(context: {
    event: "login" | "logout" | "2fa_verify" | "password_reset";
    userId?: string;
    email?: string;
    success: boolean;
    ip?: string;
    method: string; // "oauth", "credentials", "web3"
  }): void {
    Sentry.captureMessage(`[AUTH] ${context.event.toUpperCase()} ${context.method}`, {
      level: context.success ? "info" : "warning",
      tags: {
        audit_type: "authentication",
        auth_event: context.event,
        success: context.success.toString(),
        method: context.method,
      },
      extra: {
        user_id: context.userId,
        email: context.email,
        ip: context.ip,
      },
    });
  }

  /**
   * Log data access for GDPR/compliance audits
   */
  logDataAccess(context: {
    userId: string;
    resource: string;
    action: "read" | "write" | "delete";
    timestamp: number;
  }): void {
    if (process.env.NODE_ENV === "production") {
      Sentry.captureMessage(`[DATA_ACCESS] ${context.action.toUpperCase()} ${context.resource}`, {
        level: "info",
        tags: {
          audit_type: "data_access",
          action: context.action,
          resource: context.resource,
          user_id: context.userId,
        },
        extra: {
          timestamp: new Date(context.timestamp).toISOString(),
        },
      });
    }
  }

  /**
   * Log security event (failed auth, rate limit, suspicious activity)
   */
  logSecurityEvent(context: {
    event: "failed_auth" | "rate_limit" | "suspicious_activity" | "permission_denied";
    userId?: string;
    ip?: string;
    details: string;
  }): void {
    Sentry.captureMessage(`[SECURITY] ${context.event.toUpperCase()}`, {
      level: "warning",
      tags: {
        audit_type: "security_event",
        security_event: context.event,
      },
      extra: {
        user_id: context.userId,
        ip: context.ip,
        details: context.details,
      },
    });
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  // Initialize audit logger
  RequestAuditLogger.getInstance();
}

export const onRequestError = Sentry.captureRequestError;
