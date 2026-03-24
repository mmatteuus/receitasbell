import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { withApiHandler, json, ApiError, assertMethod, getAppBaseUrl } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { createCheckout } from '../../src/server/payments/service.js';
import { getSettingsMap, mapTypedSettings } from '../../src/server/settings/repo.js';
import { checkoutCreateSchema } from '../../src/server/shared/validators.js';
import { createAuditLog } from '../../src/server/audit/service.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const settings = mapTypedSettings(await getSettingsMap(tenant.id));
    const body = checkoutCreateSchema.parse(request.body);
    
    const checkoutInput = {
      recipeIds: body.recipeIds,
      buyerEmail: body.buyerEmail.toLowerCase(),
      checkoutReference: body.checkoutReference || crypto.randomUUID(),
      baseUrl: getAppBaseUrl(request),
    };

    const result = await createCheckout(tenant.id, checkoutInput);

    // Audit the checkout creation
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

    return json(response, 201, { ...result, requestId });
  });
}

