import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError, readJsonBody } from "../../src/server/shared/http.js";
import { supabaseAdmin } from "../../src/server/integrations/supabase/client.js";
import { createSession } from "../../src/server/auth/sessions.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);
    const body = await readJsonBody<{ email?: string; password?: string; fullName?: string }>(req);
    const { email, password, fullName } = body || {};

    if (!email || !password || !fullName) {
      throw new ApiError(400, "Todos os campos (e-mail, senha e nome completo) são obrigatórios.");
    }

    if (password.length < 6) {
      throw new ApiError(400, "A senha deve ter no mínimo 6 caracteres.");
    }

    // Criar usuário no Supabase Auth
    // Nota: O trigger on_auth_user_created no banco criará o perfil com full_name
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName },
      email_confirm: true, // Auto-confirm para melhor UX no free-tier
    });

    if (authError || !authData.user) {
      throw new ApiError(400, authError?.message || "Erro ao criar conta.");
    }

    // Aguardar o trigger criar o perfil? (Normalmente é instantâneo)
    // Buscamos o perfil recém-criado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new ApiError(500, "Erro ao configurar perfil de usuário.");
    }

    await createSession(req, res, {
      tenantId: profile.organization_id,
      userId: authData.user.id,
      email: authData.user.email!,
      role: (profile.role as any) || "member",
    });

    return json(res, 201, {
      success: true,
      data: {
        ok: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        }
      },
      requestId,
    });
  });
}
