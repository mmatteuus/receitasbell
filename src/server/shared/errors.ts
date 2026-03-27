import type { SeverityLevel } from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;

let initialized = false;
let sentryModulePromise: Promise<typeof import("@sentry/node") | null> | null = null;

async function loadSentry() {
  if (!SENTRY_DSN) return null;
  if (!sentryModulePromise) {
    sentryModulePromise = import("@sentry/node").catch(() => null);
  }
  return sentryModulePromise;
}

async function ensureSentryInitialized() {
  const Sentry = await loadSentry();
  if (!Sentry || initialized) return Sentry;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
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

export function captureMessage(message: string, level: SeverityLevel = "info", context: Record<string, unknown> = {}) {
    if (!SENTRY_DSN) return;
    void ensureSentryInitialized().then((Sentry) => {
      if (!Sentry) return;
      Sentry.captureMessage(message, { level, extra: context });
    });
}
