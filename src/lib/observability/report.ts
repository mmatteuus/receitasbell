export type ReportLevel = "info" | "warn" | "error";

type ReportPayload = Record<string, unknown>;

const EVENTS_ENDPOINT = "/api/events";
const MAX_DEPTH = 4;

function toSerializable(value: unknown, depth = 0): unknown {
  if (value == null) {
    return value;
  }

  if (depth > MAX_DEPTH) {
    return "[max-depth-reached]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toSerializable(entry, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = toSerializable(entry, depth + 1);
    }
    return output;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return String(value);
}

function toPayload(payload: ReportPayload = {}) {
  return toSerializable(payload) as ReportPayload;
}

async function postEvent(name: string, payload: ReportPayload = {}) {
  try {
    await fetch(EVENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        payload: toPayload(payload),
        path: typeof window !== "undefined" ? window.location.pathname : "",
        at: new Date().toISOString(),
      }),
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // Reporter is non-blocking and must fail silently in production.
  }
}

function devConsole(level: ReportLevel, label: string, payload: ReportPayload = {}) {
  const isTestMode = import.meta.env.MODE === "test";
  if (!import.meta.env.DEV || isTestMode) {
    return;
  }

  const method = level === "info"
    ? console.info
    : level === "warn"
      ? console.warn
      : console.error;

  method(`[${label}]`, payload);
}

export function reportEvent(name: string, payload: ReportPayload = {}) {
  devConsole("info", `event:${name}`, payload);
  void postEvent(name, payload);
}

export function reportLog(level: ReportLevel, context: string, payload: ReportPayload = {}) {
  devConsole(level, context, payload);

  if (!import.meta.env.DEV && level !== "error") {
    return;
  }

  void postEvent("client.log", {
    level,
    context,
    ...payload,
  });
}

export function reportError(context: string, error: unknown, payload: ReportPayload = {}) {
  const message = error instanceof Error ? error.message : String(error);

  devConsole("error", context, {
    error,
    ...payload,
  });

  void postEvent("client.error", {
    context,
    message,
    error,
    ...payload,
  });
}
