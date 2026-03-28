import type { AdminSessionResponse } from "@/lib/api/adminSession";
import type { UserSession } from "@/lib/api/identity";
import type { SessionEnvelopeRecord } from "../db/schema";
import { clearSessionEnvelope, getSessionEnvelope, saveSessionEnvelope } from "./session-envelope";

const DAY_MS = 24 * 60 * 60 * 1000;

function toIso(date: Date) {
  return date.toISOString();
}

function computeExpiry(lastValidatedAt: string, ttlMs: number) {
  return new Date(new Date(lastValidatedAt).getTime() + ttlMs).toISOString();
}

function isEnvelopeExpired(record: SessionEnvelopeRecord | undefined | null) {
  if (!record?.expiresAt) {
    return true;
  }

  return new Date(record.expiresAt).getTime() <= Date.now();
}

export async function persistUserSessionEnvelope(session: UserSession) {
  if (!session.authenticated) {
    await clearSessionEnvelope("user");
    return null;
  }

  const lastValidatedAt = toIso(new Date());
  const record: SessionEnvelopeRecord = {
    kind: "user",
    email: session.email,
    tenantSlug: session.tenantSlug,
    lastValidatedAt,
    expiresAt: computeExpiry(lastValidatedAt, 7 * DAY_MS),
    deviceBound: true,
    restrictedOffline: false,
    version: 1,
    sessionState: {
      email: session.email,
      tenantId: session.tenantId,
      tenantSlug: session.tenantSlug,
      userId: session.userId,
      role: session.role,
    },
  };

  await saveSessionEnvelope(record);
  return record;
}

export async function persistAdminSessionEnvelope(session: AdminSessionResponse) {
  if (!session.authenticated || !session.user) {
    await clearSessionEnvelope("admin");
    return null;
  }

  const lastValidatedAt = toIso(new Date());
  const record: SessionEnvelopeRecord = {
    kind: "admin",
    email: session.user.email,
    tenantSlug: session.tenant?.slug ?? null,
    lastValidatedAt,
    expiresAt: computeExpiry(lastValidatedAt, DAY_MS),
    deviceBound: true,
    restrictedOffline: true,
    version: 1,
    sessionState: {
      mode: session.mode,
      tenant: session.tenant,
      user: session.user,
      bootstrapRequired: session.bootstrapRequired,
    },
  };

  await saveSessionEnvelope(record);
  return record;
}

export async function getOfflineUserSession(): Promise<UserSession | null> {
  const record = await getSessionEnvelope("user");
  if (!record || isEnvelopeExpired(record) || !record.email) {
    return null;
  }

  const sessionState = record.sessionState as UserSession["email"] extends never ? never : {
    email: string;
    tenantId?: string;
    tenantSlug?: string | null;
    userId?: string;
    role?: string;
  };

  return {
    authenticated: true,
    email: record.email,
    tenantId: String(sessionState.tenantId || ""),
    tenantSlug: sessionState.tenantSlug ?? record.tenantSlug ?? null,
    userId: String(sessionState.userId || ""),
    role: sessionState.role || "user",
    offline: true,
    lastValidatedAt: record.lastValidatedAt,
    expiresAt: record.expiresAt,
  };
}

export async function getOfflineAdminSession(): Promise<AdminSessionResponse | null> {
  const record = await getSessionEnvelope("admin");
  if (!record || isEnvelopeExpired(record)) {
    return null;
  }

  const sessionState = record.sessionState as {
    mode?: AdminSessionResponse["mode"];
    tenant?: AdminSessionResponse["tenant"];
    user?: AdminSessionResponse["user"];
    bootstrapRequired?: boolean;
  };

  return {
    authenticated: true,
    mode: sessionState.mode || "tenant",
    bootstrapRequired: Boolean(sessionState.bootstrapRequired),
    tenant: sessionState.tenant || (record.tenantSlug ? {
      id: "",
      slug: record.tenantSlug,
      name: record.tenantSlug,
    } : null),
    user: sessionState.user || (record.email ? {
      id: "",
      email: record.email,
      role: "admin",
    } : null),
    offlineRestricted: true,
    lastValidatedAt: record.lastValidatedAt,
    expiresAt: record.expiresAt,
  };
}

export async function clearOfflineSession(kind: "user" | "admin") {
  await clearSessionEnvelope(kind);
}
