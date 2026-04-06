import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withApiHandler,
  json,
  assertMethod,
  ApiError,
  readJsonBody,
  getAppBaseUrl,
} from '../../src/server/shared/http.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';
import { validatePasswordResetEmail } from '../../src/lib/validation/identity.js';

function resolveResetDestination(appUrl: string, redirectTo?: string) {
  const fallback = `${appUrl}/pwa/auth/update-password`;
  if (!redirectTo) return fallback;

  try {
    const base = new URL(appUrl);
    const candidate = new URL(redirectTo, appUrl);
    if (candidate.origin !== base.origin) return fallback;
    return candidate.toString();
  } catch {
    return fallback;
  }
}

export default withApiHandler(async (req, res, { requestId, logger }) => {
  assertMethod(req, ['POST']);
  const body = await readJsonBody<{ email?: string; redirectTo?: string }>(req);
  const { email, redirectTo } = body || {};

  const validation = validatePasswordResetEmail({ email: email || '' });
  if (!validation.ok) {
    throw new ApiError(400, validation.message);
  }

  const appUrl = getAppBaseUrl(req);
  const destination = resolveResetDestination(appUrl, redirectTo);

  // Supabase Auth enviará o e-mail de recuperação
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(validation.email, {
    redirectTo: destination,
  });

  if (error) {
    logger.error('Erro ao solicitar recuperação de senha', error);
    throw new ApiError(400, error.message);
  }

  return json(res, 200, {
    success: true,
    data: { ok: true, message: 'Instruções enviadas para o seu e-mail.' },
    requestId,
  });
});
