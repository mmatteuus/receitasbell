type TelemetryPayload = Record<string, unknown>;

async function postEvent(name: string, payload: TelemetryPayload = {}) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        payload,
        path: typeof window !== "undefined" ? window.location.pathname : "",
        at: new Date().toISOString(),
      }),
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // Non-blocking telemetry.
  }
}

export function trackEvent(name: string, payload: TelemetryPayload = {}) {
  void postEvent(name, payload);
  console.info("[telemetry]", name, payload);
}

export function trackError(context: string, error: unknown, payload: TelemetryPayload = {}) {
  const message = error instanceof Error ? error.message : String(error);
  void postEvent("client.error", { context, message, ...payload });
  console.error(`[${context}]`, error);
}
