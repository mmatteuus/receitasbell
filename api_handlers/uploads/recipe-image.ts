import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError, assertMethod } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';
import { env } from '../../src/server/shared/env.js';

const BUCKET = 'recipe-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default withApiHandler(async (request: VercelRequest, response: VercelResponse) => {
  await requireAdminAccess(request);
  const { tenant } = await requireTenantFromRequest(request);

  assertMethod(request, ['POST', 'DELETE']);

  const method = (request.method || 'GET').toUpperCase();

  if (method === 'DELETE') {
    const url = new URL(request.url || '', 'http://localhost');
    const fileId = url.searchParams.get('fileId');
    if (fileId) {
      await supabaseAdmin.storage.from(BUCKET).remove([fileId]);
    }
    return json(response, 200, { ok: true });
  }

  // POST — upload de imagem
  const { fileName, mimeType, dataBase64 } = request.body as {
    fileName?: string;
    mimeType?: string;
    dataBase64?: string;
  };

  if (!fileName || !mimeType || !dataBase64) {
    throw new ApiError(400, 'fileName, mimeType e dataBase64 são obrigatórios.');
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new ApiError(400, 'Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.');
  }

  // Decodificar base64 (pode vir com prefixo data:image/...;base64,)
  const base64Data = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new ApiError(400, 'Imagem muito grande. Máximo 5 MB.');
  }

  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const fileId = `${tenant.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileId, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new ApiError(500, `Erro ao enviar imagem: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(fileId);

  const publicUrl = publicUrlData.publicUrl;

  return json(response, 200, {
    imageUrl: publicUrl,
    imageFileMeta: {
      storage: 'supabase',
      fileId,
      fileName,
      mimeType,
      sizeBytes: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
      publicUrl,
      thumbnailUrl: publicUrl,
    },
  });
});
