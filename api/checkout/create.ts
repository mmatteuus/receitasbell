import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod, getAppBaseUrl } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { createMercadoPagoCheckout, createMockCheckout } from '../../src/server/baserow/checkoutRepo.js';
import { getSettingsMap, mapTypedSettings } from '../../src/server/baserow/settingsRepo.js';
import { checkoutCreateSchema } from '../../src/server/validators.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const settings = mapTypedSettings(await getSettingsMap(tenant.id));
    const body = checkoutCreateSchema.parse(await readJsonBody(request));
    
    const checkoutInput = {
      recipeIds: body.recipeIds,
      buyerEmail: body.buyerEmail.toLowerCase(),
      checkoutReference: body.checkoutReference || crypto.randomUUID(),
      baseUrl: getAppBaseUrl(request),
    };

    if (settings.payment_mode === 'production' && settings.mp_access_token) {
      const result = await createMercadoPagoCheckout(String(tenant.id), checkoutInput);
      return sendJson(response, 201, result);
    }
    
    const result = await createMockCheckout(String(tenant.id), checkoutInput);
    return sendJson(response, 201, result);
  });
}
