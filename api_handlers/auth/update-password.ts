import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, ApiError, readJsonBody } from '../../src/server/shared/http.js';
import { getSession } from '../../src/server/auth/sessions.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';

export default withApiHandler(async (req, res, { requestId, logger }) => {
  assertMethod(req, ['POST']);
  const session = await getSession(req);
  
  if (!session) {
    throw new ApiError(401, 'Sessão expirada ou inválida. Por favor, faça login novamente.');
  }

  const { password } = await readJsonBody<{ password?: string }>(req);
  if (!password || password.length < 6) {
    throw new ApiError(400, 'A nova senha deve ter no mínimo 6 caracteres.');
  }

  // Atualiza no Supabase Auth usando admin API
  const { error } = await supabaseAdmin.auth.admin.updateUserById(session.userId, {
    password: password,
  });

  if (error) {
    logger.error('Erro ao atualizar senha no Supabase', error);
    throw new ApiError(400, error.message);
  }

  return json(res, 200, {
    success: true,
    data: { ok: true, message: 'Senha atualizada com sucesso.' },
    requestId,
  });
});
