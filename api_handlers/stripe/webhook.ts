import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../src/server/shared/http.js";
import { parseStripeWebhookSignature, processStripeWebhookEvent } from "../../src/server/integrations/stripe/webhook.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId, logger }) => {
    assertMethod(req, ["POST"]);
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string" || !signature) {
      logger.warn("stripe.webhook.missing_signature", { requestId });
      return json(res, 200, { success: false, reason: "missing_signature", requestId });
    }
    let rawBody: Buffer;
    if (Buffer.isBuffer(req.body)) { rawBody = req.body; }
    else if (typeof req.body === "string") { rawBody = Buffer.from(req.body, "utf8"); }
    else { rawBody = Buffer.from(JSON.stringify(req.body ?? {}), "utf8"); }
    let event;
    try { event = parseStripeWebhookSignature(rawBody, signature); }
    catch { logger.warn("stripe.webhook.invalid_signature", { requestId }); return json(res, 200, { success: false, reason: "invalid_signature", requestId }); }
    const result = await processStripeWebhookEvent(event);
    logger.info("stripe.webhook.processed", { eventType: event.type, eventId: event.id, processed: result.processed, tenantId: result.tenantId ?? null, paymentOrderId: result.paymentOrderId ?? null });
    return json(res, 200, { success: result.processed, requestId });
  });
}
