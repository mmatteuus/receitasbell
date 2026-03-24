import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod, getAppBaseUrl } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { createCheckout } from '../../src/server/payments/service.js';
import { getSettingsMap, mapTypedSettings } from '../../src/server/settings/repo.js';
import { checkoutCreateSchema } from '../../src/server/shared/validators.js';
import { createAuditLog } from '../../src/server/audit/service.js';

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
      const result = await createCheckout(tenant.id, checkoutInput);
      return sendJson(response, 201, result);
    }
    
    // For now, using createCheckout for everything since it should handle mock/production 
    const result = await createCheckout(tenant.id, checkoutInput);

    // Audit the checkout creation with detailed info
    await createAuditLog(request, {
      tenantId: String(tenant.id),
      actorType: 'user',
      actorId: body.buyerEmail, 
      action: 'checkout.create',
      resourceType: 'payment_order',
      resourceId: String(result.paymentOrderId),
      payload: { 
        recipeIds: body.recipeIds, 
        checkoutReference: body.checkoutReference || checkoutInput.checkoutReference,
        gateway: result.gateway
      },
    });

    return sendJson(response, 201, result);
  });
}

