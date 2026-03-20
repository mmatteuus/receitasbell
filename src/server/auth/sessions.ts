import type { TenantSession, TenantUser } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getPrisma } from "../db/prisma.js";
import { ApiError, appendSetCookie } from "../http.js";

const TENANT_ADMIN_SESSION_COOKIE = "rb_tenant_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type SessionClaims = {
  sid: string;
  tid: string;
  uid: string;
  exp: number;
};

function getSessionSecret() {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== "production" && process.env.ADMIN_API_SECRET?.trim()) {
    return process.env.ADMIN_API_SECRET.trim();
  }
  throw new Error("SESSION_SECRET is required.");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function hashSessionId(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("hex");
}

function signClaims(claims: SessionClaims) {
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token: string): SessionClaims | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  const claims = JSON.parse(base64UrlDecode(payload)) as SessionClaims;
  if (!claims.sid || !claims.tid || !claims.uid || !claims.exp) {
    return null;
  }
  if (claims.exp <= Date.now()) {
    return null;
  }
  return claims;
}

function shouldUseSecureCookie(request: VercelRequest) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return process.env.NODE_ENV === "production" || proto === "https";
}

function getCookie(request: VercelRequest, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

export function getTenantAdminSessionClaims(request: VercelRequest) {
  const token = getCookie(request, TENANT_ADMIN_SESSION_COOKIE);
  if (!token) return null;
  return verifyToken(token);
}

export function hasTenantAdminSession(request: VercelRequest) {
  return Boolean(getTenantAdminSessionClaims(request));
}

export async function createTenantAdminSession(input: {
  tenantId: string;
  tenantUserId: string;
}) {
  const prisma = getPrisma();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await prisma.tenantSession.create({
    data: {
      tenantId: input.tenantId,
      tenantUserId: input.tenantUserId,
      sessionTokenHash: "",
      expiresAt,
    },
  });

  const sessionHash = hashSessionId(session.id);
  await prisma.tenantSession.update({
    where: { id: session.id },
    data: { sessionTokenHash: sessionHash },
  });

  const token = signClaims({
    sid: session.id,
    tid: input.tenantId,
    uid: input.tenantUserId,
    exp: expiresAt.getTime(),
  });

  return {
    token,
    sessionId: session.id,
    expiresAt,
  };
}

export function setTenantAdminSessionCookie(
  request: VercelRequest,
  response: VercelResponse,
  token: string,
  expiresAt: Date,
) {
  const secure = shouldUseSecureCookie(request) ? "; Secure" : "";
  const maxAge = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  appendSetCookie(
    response,
    `${TENANT_ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}

export function clearTenantAdminSessionCookie(request: VercelRequest, response: VercelResponse) {
  const secure = shouldUseSecureCookie(request) ? "; Secure" : "";
  appendSetCookie(
    response,
    `${TENANT_ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
}

export async function revokeTenantAdminSession(request: VercelRequest) {
  const claims = getTenantAdminSessionClaims(request);
  if (!claims) return;

  const prisma = getPrisma();
  await prisma.tenantSession.updateMany({
    where: {
      id: claims.sid,
      sessionTokenHash: hashSessionId(claims.sid),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getTenantAdminSessionContext(request: VercelRequest) {
  const claims = getTenantAdminSessionClaims(request);
  if (!claims) return null;

  const prisma = getPrisma();
  const session = await prisma.tenantSession.findFirst({
    where: {
      id: claims.sid,
      tenantId: claims.tid,
      tenantUserId: claims.uid,
      sessionTokenHash: hashSessionId(claims.sid),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      tenant: true,
      tenantUser: true,
    },
  });

  if (!session) return null;

  await prisma.tenantSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    claims,
    session,
    tenant: session.tenant,
    tenantUser: session.tenantUser,
  };
}

export async function requireTenantAdminSessionContext(request: VercelRequest) {
  const context = await getTenantAdminSessionContext(request);
  if (!context) {
    throw new ApiError(401, "Sessao do admin do tenant obrigatoria.");
  }
  return context;
}

export type TenantAdminSessionContext = Awaited<ReturnType<typeof getTenantAdminSessionContext>>;
export type TenantSessionRecord = TenantSession;
export type TenantSessionUser = TenantUser;
