import type { SeverityLevel } from '@sentry/node';
import { env } from './env.js';

const SENTRY_DSN = process.env.SENTRY_DSN;
const PROBLEM_BASE_URL = `${(env.APP_BASE_URL || 'https://receitasbell.mtsferreira.dev').replace(/\/+$/, '')}/errors`;

let initialized = false;
let sentryModulePromise: Promise<typeof import('@sentry/node') | null> | null = null;

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  request_id?: string;
  timestamp: string;
  details?: unknown;
}

function slugifyTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'error'
  );
}

export function problemDetail(input: {
  status: number;
  title: string;
  detail?: string;
  type?: string;
  instance?: string;
  requestId?: string;
  details?: unknown;
}): ProblemDetail {
  return {
    type: input.type ?? `${PROBLEM_BASE_URL}/${slugifyTitle(input.title)}`,
    title: input.title,
    status: input.status,
    detail: input.detail,
    instance: input.instance,
    request_id: input.requestId,
    timestamp: new Date().toISOString(),
    ...(input.details !== undefined ? { details: input.details } : {}),
  };
}

async function loadSentry() {
  if (!SENTRY_DSN) return null;
  if (!sentryModulePromise) {
    sentryModulePromise = import('@sentry/node').catch(() => null);
  }
  return sentryModulePromise;
}

async function ensureSentryInitialized() {
  const Sentry = await loadSentry();
  if (!Sentry || initialized) return Sentry;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  initialized = true;
  return Sentry;
}

export function initSentry() {
  if (!SENTRY_DSN || initialized) return;
  void ensureSentryInitialized();
}

export function captureException(error: unknown, context: Record<string, unknown> = {}) {
  if (!SENTRY_DSN) return;
  void ensureSentryInitialized().then((Sentry) => {
    if (!Sentry) return;
    Sentry.captureException(error, { extra: context });
  });
}

export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context: Record<string, unknown> = {}
) {
  if (!SENTRY_DSN) return;
  void ensureSentryInitialized().then((Sentry) => {
    if (!Sentry) return;
    Sentry.captureMessage(message, { level, extra: context });
  });
}
