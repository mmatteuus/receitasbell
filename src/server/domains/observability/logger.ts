import type { VercelRequest } from '@vercel/node';
import { captureException, captureMessage } from './sentry.js';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  requestId?: string;
  tenantId?: string | number;
  userId?: string | number;
  adminUserId?: string | number;
  route?: string;
  action?: string;
  durationMs?: number;
  paymentOrderId?: string | number;
  providerPaymentId?: string;
  providerEventId?: string;
  [key: string]: any;
}

export interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  environment: string;
  error?: any;
}

const SENSITIVE_KEYS = [
  'password', 'secret', 'token', 'key', 'cookie', 
  'cvv', 'card_number', 'access_token', 'refresh_token',
  'mp_access_token', 'mp_public_key', 'mp_webhook_secret'
];

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatError(error: any) {
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
            name: error.name,
            ...(error as any)
        };
    }
    return error;
}

export class Logger {
  private context: LogContext = {};
  private environment: string = process.env.NODE_ENV || 'development';

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  static fromRequest(request: VercelRequest, baseContext: LogContext = {}) {
    return new Logger({
      requestId: (request.headers['x-vercel-id'] as string) || crypto.randomUUID(),
      route: request.url,
      ...baseContext
    });
  }

  withContext(context: LogContext) {
    return new Logger({ ...this.context, ...context });
  }

  log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.environment,
      ...this.context,
    };

    if (data) {
        if (level === LogLevel.ERROR) {
            entry.error = sanitize(formatError(data));
            captureException(data, entry);
        } else {
            entry.details = sanitize(data);
            if (level === LogLevel.WARN || level === LogLevel.INFO) {
                captureMessage(message, level as any, entry);
            }
        }
    }

    // Include domain-specific fields if present in data but not in context
    if (data && typeof data === 'object') {
      if (data.paymentOrderId) entry.paymentOrderId = data.paymentOrderId;
      if (data.providerPaymentId) entry.providerPaymentId = data.providerPaymentId;
      if (data.providerEventId) entry.providerEventId = data.providerEventId;
    }

    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: any) { this.log(LogLevel.DEBUG, message, data); }
  info(message: string, data?: any) { this.log(LogLevel.INFO, message, data); }
  warn(message: string, data?: any) { this.log(LogLevel.WARN, message, data); }
  error(message: string, error?: any) { this.log(LogLevel.ERROR, message, error); }
}

export const logger = new Logger();
