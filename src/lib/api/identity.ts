import { clearOfflineSession, getOfflineUserSession, persistUserSessionEnvelope } from "@/pwa/offline/auth/offline-auth";
import { isPwaRuntimePath } from "@/pwa/offline/runtime";
import { jsonFetch } from "./client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

export type UserSession = {
  authenticated: boolean;
  email: string;
  tenantId: string;
  tenantSlug: string | null;
  userId: string;
  role: string;
  offline?: boolean;
  lastValidatedAt?: string;
  expiresAt?: string;
};

type AuthMeResponse = {
  success?: boolean;
  data?: {
    user?: {
      userId?: string;
      email?: string;
      tenantId?: string;
      tenantSlug?: string | null;
      role?: string;
    };
  };
};

type MagicLinkResponse = {
  success?: boolean;
  data?: {
    ok?: boolean;
    redirectTo?: string | null;
    tenantSlug?: string | null;
  };
};

function normalizeUserSession(payload: AuthMeResponse): UserSession | null {
  const user = payload.data?.user;
  if (!user?.email) {
    return null;
  }

  return {
    authenticated: true,
    email: user.email,
    tenantId: String(user.tenantId || ""),
    tenantSlug: user.tenantSlug ?? null,
    userId: String(user.userId || ""),
    role: user.role || "user",
  };
}

export async function requestMagicLink(input: { email: string; redirectTo?: string | null }) {
  return jsonFetch<MagicLinkResponse>("/api/auth/request-magic-link", {
    method: "POST",
    body: {
      email: input.email.trim().toLowerCase(),
      redirectTo: input.redirectTo ?? null,
    },
  });
}

export async function verifyMagicLink(input: { token: string }) {
  return jsonFetch<MagicLinkResponse>("/api/auth/verify-magic-link", {
    method: "POST",
    body: {
      token: input.token,
    },
  });
}

export async function fetchMe(options: { allowOffline?: boolean } = {}) {
  const allowOffline = options.allowOffline ?? isPwaRuntimePath();

  try {
    const payload = await jsonFetch<AuthMeResponse>("/api/auth/me");
    const session = normalizeUserSession(payload);
    if (!session) {
      return null;
    }

    await persistUserSessionEnvelope(session);
    return session;
  } catch {
    if (!allowOffline) {
      return null;
    }

    return getOfflineUserSession();
  }
}

export async function logoutUser() {
  try {
    await jsonFetch<{ success?: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    await clearOfflineSession("user");
  }
}
