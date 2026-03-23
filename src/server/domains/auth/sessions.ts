import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequiredEnv } from "../../shared/env.js";

const COOKIE_NAME = "rb_auth_session";

export interface SessionData {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  expiresAt: number;
}

export function signSession(data: SessionData): string {
  const secret = getRequiredEnv("APP_COOKIE_SECRET");
  const payload = Buffer.from(JSON.stringify(data)).toString("base64");
  const signature = createHmac("sha256", secret).update(payload).digest("base64");
  return `${payload}.${signature}`;
}

export function verifySession(token: string): SessionData | null {
  try {
    const secret = getRequiredEnv("APP_COOKIE_SECRET");
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = createHmac("sha256", secret).update(payloadBase64).digest("base64");
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payloadBase64, "base64").toString()) as SessionData;
    if (Date.now() > data.expiresAt) return null;

    return data;
  } catch (err) {
    return null;
  }
}

export function getSessionFromRequest(request: any): SessionData | null {
  const cookieHeader = request.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c: string) => {
        const parts = c.trim().split("=");
        return [parts[0], parts.slice(1).join("=")];
    })
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(response: any, sessionToken: string) {
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`); // 7 dias
}

export function hasTenantAdminSession(request: any): boolean {
  const session = getSessionFromRequest(request);
  if (!session) return false;
  return session.role === "admin";
}

export async function revalidateSession(request: any, expectedRole?: string): Promise<boolean> {
    const session = getSessionFromRequest(request);
    if (!session) return false;
    if (expectedRole && session.role !== expectedRole) return false;
    return true;
}

export function clearSessionCookie(response: any) {
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
