import { jsonFetch } from '@/lib/api/client';

export type InviteStatus = 'valid' | 'expired' | 'invalid' | 'used';

export interface ValidateInviteResponse {
  status: InviteStatus;
  email?: string;
  tenantName?: string;
  tenantSlug?: string;
  message?: string;
  requestId?: string;
}

export interface AcceptInviteResponse {
  authenticated: boolean;
  message?: string;
  session?: {
    authenticated: boolean;
    tenant?: { slug?: string | null } | null;
  };
  requestId?: string;
}

export interface RequestInviteResponse {
  success: boolean;
  message?: string;
  requestId?: string;
}

export function validateInvite(token: string) {
  return jsonFetch<ValidateInviteResponse>('/api/admin/invites/validate', {
    headers: {
      'X-Invite-Token': token,
    },
  });
}

export function acceptInvite(input: {
  token: string;
  password: string;
  passwordConfirm: string;
  tenantSlug?: string;
}) {
  return jsonFetch<AcceptInviteResponse>('/api/admin/invites/accept', {
    method: 'POST',
    body: {
      token: input.token,
      password: input.password,
      passwordConfirm: input.passwordConfirm,
      tenantSlug: input.tenantSlug,
    },
  });
}

export function requestNewInvite(email: string, reason?: string) {
  return jsonFetch<RequestInviteResponse>('/api/admin/invites/request', {
    method: 'POST',
    body: {
      email,
      reason,
    },
  });
}
