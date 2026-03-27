import type { VercelRequest } from "@vercel/node";
import { getClientAddress } from "../shared/http.js";
import { logAuditEvent, type AuditEvent } from "./repo.js";

type ServiceAuditEntry = {
  tenantId: string;
  actorType: AuditEvent["actorType"];
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload?: unknown;
};

function getUserAgent(request: VercelRequest) {
  const userAgent = request.headers["user-agent"];
  if (typeof userAgent === "string" && userAgent.trim()) return userAgent.trim();
  if (Array.isArray(userAgent) && typeof userAgent[0] === "string" && userAgent[0].trim()) {
    return userAgent[0].trim();
  }
  return "";
}

function normalizeAuditPayload(payload: unknown): Record<string, unknown> | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { value: payload };
}

export async function auditLog(entry: ServiceAuditEntry) {
  await logAuditEvent({
    tenantId: entry.tenantId,
    actorType: entry.actorType,
    actorId: entry.actorId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    payload: normalizeAuditPayload(entry.payload),
  });
}

export async function createAuditLog(request: VercelRequest, entry: ServiceAuditEntry) {
  await logAuditEvent({
    tenantId: entry.tenantId,
    actorType: entry.actorType,
    actorId: entry.actorId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    payload: normalizeAuditPayload(entry.payload),
    ip: getClientAddress(request),
    userAgent: getUserAgent(request),
  });
}
