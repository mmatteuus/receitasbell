import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SessionRecord, SessionRole } from "./sessionStore.js";
import { 
  createSession, 
  getSession, 
  requireSession, 
  revokeCurrentSession, 
  setSessionCookie, 
  clearSessionCookie 
} from "./sessionStore.js";

export type { SessionRecord, SessionRole };

/**
 * Facade para manipulação de sessões server-side.
 * Mantém compatibilidade com a interface esperada pelos handlers.
 */

export async function getUserSession(request: VercelRequest): Promise<SessionRecord | null> {
  return getSession(request);
}

export async function requireUserSession(request: VercelRequest): Promise<SessionRecord> {
  return requireSession(request);
}

export async function startUserSession(request: VercelRequest, response: VercelResponse, input: {
  tenantId: string;
  userId: string;
  email: string;
  role: SessionRole;
}) {
  const { token } = await createSession(request, input);
  setSessionCookie(response, token);
}

export async function endUserSession(request: VercelRequest, response: VercelResponse) {
  await revokeCurrentSession(request);
  clearSessionCookie(response);
}
