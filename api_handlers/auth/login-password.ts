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

export default withApiHandler(async (req, res, { requestId }) => {
  assertMethod(req, ['POST']);
  const body = await readJsonBody<{ email?: string; password?: string }>(req);
  const { email, password } = body;

  if (!email || !password) {
    throw new ApiError(400, 'E-mail e senha são obrigatórios.');
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new ApiError(401, 'Credenciais inválidas ou usuário não encontrado.');
  }

  // Buscar perfil para obter tenantId e role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(403, 'Perfil não configurado para este usuário.');
  }

  const role = profile.role === 'admin' || profile.role === 'owner' ? profile.role : 'user';

  await createSession(req, res, {
    tenantId: profile.organization_id,
    userId: data.user.id,
    email: data.user.email!,
    role,
  });

  return json(res, 200, {
    success: true,
    data: {
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
    requestId,
  });
});
