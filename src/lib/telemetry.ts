import { reportError, reportEvent } from "@/lib/observability/report";

type TelemetryPayload = Record<string, unknown>;

export function trackEvent(name: string, payload: TelemetryPayload = {}) {
  reportEvent(name, payload);
}

export function trackError(context: string, error: unknown, payload: TelemetryPayload = {}) {
  reportError(context, error, payload);
}
