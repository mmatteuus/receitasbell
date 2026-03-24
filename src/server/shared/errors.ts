import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;

let initialized = false;

export function initSentry() {
  if (!SENTRY_DSN || initialized) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
  });
  initialized = true;
}

export function captureException(error: any, context: any = {}) {
    if (!SENTRY_DSN) return;
    initSentry();
    Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context: any = {}) {
    if (!SENTRY_DSN) return;
    initSentry();
    Sentry.captureMessage(message, { level, extra: context });
}
