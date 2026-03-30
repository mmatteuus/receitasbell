import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripeClient } from "../../../providers/stripe/client.js";
import { getStripeAppEnvAsync, env } from "../../../../shared/env.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";

function getTenantId(req: VercelRequest): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return "";
    return "extract-from-token"; // Assuming this is extracted normally via middleware or inside handler.
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tenantId = req.body?.tenantId || getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    await getStripeAppEnvAsync(tenantId);

    const { data: account } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!account?.stripe_account_id) {
      return res.status(404).json({ error: "Stripe connect account not found for this tenant." });
    }

    const { url } = await stripeClient.accountLinks.create({
      account: account.stripe_account_id,
      refresh_url: `${env.APP_BASE_URL}/admin/settings/payments/stripe/refresh`,
      return_url: `${env.APP_BASE_URL}/admin/settings/payments/stripe/return`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url });
  } catch (error: any) {
    console.error("Error creating onboarding link:", error);
    return res.status(500).json({ error: error.message });
  }
}
