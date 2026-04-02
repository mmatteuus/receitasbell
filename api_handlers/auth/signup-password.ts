import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withApiHandler,
  json,
  assertMethod,
  ApiError,
  readJsonBody,
} from '../../src/server/shared/http.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';
import { createSession } from '../../src/server/auth/sessions.js';

export default withApiHandler(async (req, res, { requestId, logger }) => {
  assertMethod(req, ['POST']);
  const body = await readJsonBody<{
    email?: string;
    password?: string;
    fullName?: string;
    tenantSlug?: string;
  }>(req);
  const { email, password, fullName, tenantSlug } = body || {};

  if (!email || !password || !fullName || !tenantSlug) {
    throw new ApiError(400, 'email, password, fullName e tenantSlug são obrigatórios.');
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('organizations')
    .select('id, slug')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    throw new ApiError(404, 'Tenant não encontrado.');
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  });

  if (authError || !authData.user) {
    logger.error('Falha no signup do Supabase', authError);
    throw new ApiError(400, authError?.message || 'Erro ao criar conta.');
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: authData.user.id,
      organization_id: tenant.id,
      email: authData.user.email!.toLowerCase(),
      username: authData.user.email!.split('@')[0],
      display_name: fullName,
      full_name: fullName,
      role: 'member',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new ApiError(500, 'Erro ao configurar perfil de usuário.');
  }

  await createSession(req, res, {
    tenantId: tenant.id,
    userId: authData.user.id,
    email: authData.user.email!,
    role: 'user',
  });

  return json(res, 201, {
    success: true,
    data: {
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    },
    requestId,
  });
});
