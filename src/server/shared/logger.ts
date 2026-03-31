import type { VercelRequest } from '@vercel/node';
import crypto from 'node:crypto';
import { captureException, captureMessage } from './errors.js';
import { sanitize } from './validation.js';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  tenantId?: string | number;
  userId?: string | number;
  adminUserId?: string | number;
  route?: string;
  action?: string;
  durationMs?: number;
  paymentOrderId?: string | number;
  providerPaymentId?: string;
  providerEventId?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: unknown;
  details?: unknown;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
    if ('cause' in error) {
      details.cause = (error as { cause?: unknown }).cause;
    }
    return details;
  }
  return error;
}

export class Logger {
  private context: LogContext = {};
  private environment: string = process.env.NODE_ENV || 'development';

  constructor(context: LogContext = {}) {
    this.context = {
      environment: this.environment,
      ...context,
    };
  }

  static fromRequest(request: VercelRequest, baseContext: LogContext = {}) {
    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-vercel-id'] as string) ||
      crypto.randomUUID();

    return new Logger({
      requestId: correlationId,
      correlationId,
      route: (request.url || '').split('?')[0],
      ...baseContext,
    });
  }

  withContext(context: LogContext) {
    return new Logger({ ...this.context, ...context });
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (this.environment === 'test') {
      return;
    }

    const entry: LogEntry & { service_name: string; correlation_id?: string } = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service_name: 'receitasbell-api',
      ...this.context,
    };

    if (this.context.correlationId || this.context.requestId) {
      entry.correlation_id = String(this.context.correlationId || this.context.requestId);
    }

    if (data !== undefined) {
      const sanitizedData = sanitize(data);
      if (level === LogLevel.ERROR) {
        const errorData = formatError(data);
        entry.error = sanitize(errorData);
        captureException(data, entry as Record<string, unknown>);
      } else {
        if (typeof sanitizedData === 'object' && sanitizedData !== null) {
          Object.assign(entry, sanitizedData as Record<string, unknown>);
        } else {
          entry.details = sanitizedData;
        }

        if (level === LogLevel.WARN || level === LogLevel.INFO) {
          const sentryLevel = level === LogLevel.WARN ? 'warning' : level;
          captureMessage(message, sentryLevel, entry as Record<string, unknown>);
        }
      }
    }

    // Always output to console for Vercel/CloudWatch
    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: unknown) {
    this.log(LogLevel.DEBUG, message, data);
  }
  info(message: string, data?: unknown) {
    this.log(LogLevel.INFO, message, data);
  }
  warn(message: string, data?: unknown) {
    this.log(LogLevel.WARN, message, data);
  }
  error(message: string, error?: unknown) {
    this.log(LogLevel.ERROR, message, error);
  }
}

export const logger = new Logger();
