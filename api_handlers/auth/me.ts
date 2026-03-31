import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json } from '../../src/server/shared/http.js';
import { getSession } from '../../src/server/auth/sessions.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';

export default withApiHandler(async (req, res, { requestId }) => {
  const session = await getSession(req);
  if (!session) {
    return json(res, 200, { success: true, data: { user: null }, requestId });
  }

  // Validar se o perfil existe no Supabase e buscar dados extras
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, avatar_url, role, organization_id')
    .eq('id', session.userId)
    .single();

  return json(res, 200, {
    success: true,
    data: {
      user: {
        id: session.userId,
        email: session.email,
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        role: profile?.role || session.role,
        tenantId: profile?.organization_id || session.tenantId,
      },
    },
    requestId,
  });
});
