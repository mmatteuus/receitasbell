import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withApiHandler, json, assertMethod, ApiError, readJsonBody } from '../../src/server/shared/http.js';
import { getSession } from '../../src/server/auth/sessions.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .max(128, 'A senha não pode exceder 128 caracteres.')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
});

export default withApiHandler(async (req, res, { requestId, logger }) => {
  assertMethod(req, ['POST']);
  const session = await getSession(req);

  if (!session) {
    throw new ApiError(401, 'Sessão expirada ou inválida. Por favor, faça login novamente.');
  }

  const body = await readJsonBody<{ password?: string }>(req);
  const validation = updatePasswordSchema.safeParse(body);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    throw new ApiError(400, issue?.message ?? 'A senha fornecida é inválida.');
  }

  // Atualiza no Supabase Auth usando admin API
  const { error } = await supabaseAdmin.auth.admin.updateUserById(session.userId, {
    password: validation.data.password,
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
