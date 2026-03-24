import type { VercelRequest } from '@vercel/node';
import { logAuditEvent } from './repo.js';
import { getClientAddress } from '../shared/http.js';

export type AuditLogEntry = {
  tenantId: string | number;
  actorType: 'user' | 'admin' | 'system';
  actorId: string | number;
  action: string;
  resourceType: string;
  resourceId: string | number;
  payload?: any;
};

/**
 * Creates an audit log entry, automatically extracting IP and User-Agent from the request.
 */
export async function createAuditLog(request: VercelRequest, entry: AuditLogEntry) {
  await logAuditEvent({
    ...entry,
    ip: getClientAddress(request),
    userAgent: request.headers['user-agent'] || 'unknown',
  });
  return entry;
}

/**
 * Low-level audit log creation for system events without a request object.
 */
export async function createSystemAuditLog(entry: AuditLogEntry) {
  await logAuditEvent({
    ...entry,
    ip: 'system-process',
    userAgent: 'server-side-job',
  });
  return entry;
}
