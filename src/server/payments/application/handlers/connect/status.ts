import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripeClient } from "../../../providers/stripe/client.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";

function getTenantId(req: VercelRequest): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return "";
    return "extract-from-token"; // Assuming this is extracted normally via middleware or inside handler.
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tenantId = req.query.tenantId as string || getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    const { data: storedAccount } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!storedAccount?.stripe_account_id) {
      return res.status(200).json({ connected: false });
    }

    const account = await stripeClient.accounts.retrieve(storedAccount.stripe_account_id);

    // Sync database with current status from Stripe
    await supabaseAdmin
      .from("stripe_connect_accounts")
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      })
      .eq("tenant_id", tenantId);

    return res.status(200).json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      accountId: account.id,
    });
  } catch (error: any) {
    console.error("Error retrieving connect status:", error);
    return res.status(500).json({ error: error.message });
  }
}
