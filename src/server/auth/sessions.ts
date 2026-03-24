import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../shared/env.js";

export type SessionRole = 'user' | 'admin' | 'superadmin';

export type UserSession = {
  sessionId: string;
  userId: string;
  email: string;
  role: SessionRole;
  tenantId?: string; // Added for multi-tenancy audit/security
  issuedAt: number;
  expiresAt: number;
};

const COOKIE_NAME = 'rb_user_session';

export function signSession(data: UserSession): string {
  const secret = env.APP_COOKIE_SECRET;
  const payload = Buffer.from(JSON.stringify(data)).toString("base64");
  const signature = createHmac("sha256", secret).update(payload).digest("base64");
  return `${payload}.${signature}`;
}

export function verifySession(token: string): UserSession | null {
  try {
    const secret = env.APP_COOKIE_SECRET;
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = createHmac("sha256", secret).update(payloadBase64).digest("base64");
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payloadBase64, "base64").toString()) as UserSession;
    if (Date.now() > data.expiresAt) return null;

    return data;
  } catch (err) {
    return null;
  }
}

export async function getUserSession(request: VercelRequest): Promise<UserSession | null> {
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

export function setUserSessionCookie(response: VercelResponse, value: string) {
  const isProd = process.env.NODE_ENV === "production";
  const secure = isProd ? "; Secure" : "";
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

export function clearUserSessionCookie(response: VercelResponse) {
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
