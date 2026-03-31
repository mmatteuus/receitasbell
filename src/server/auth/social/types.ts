import { SocialProviderId } from "./providers.js";

export type SocialAuthStatus = "active" | "consumed" | "expired";

export interface SocialOAuthStateRow {
  id: number;
  provider: SocialProviderId;
  tenantId: string;
  stateHash: string;
  redirectTo?: string | null;
  expiresAt?: string | null;
  consumedAt?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  status: SocialAuthStatus;
  createdAt?: string | null;
}

export interface SocialIdentityRow {
  id: number;
  provider: SocialProviderId;
  tenantId: string;
  userId: string | null;
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  pictureUrl?: string | null;
  linkedAt?: string | null;
  lastLoginAt?: string | null;
  status?: "active" | "disabled";
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SaveSocialIdentityInput {
  tenantId: string;
  provider: SocialProviderId;
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  pictureUrl?: string | null;
}
