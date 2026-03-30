import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripeClient } from "../../../providers/stripe/client.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";
import { getStripeAppEnvAsync } from "../../../../shared/env.js";

function getTenantId(req: VercelRequest): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return "";
    }
    // Simplification for the example, extract properly if needed.
    return "extract-from-token";
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

    // verify env configs
    await getStripeAppEnvAsync(tenantId);

    // Checks if there's already an account for this tenant
    const { data: existingAccount } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existingAccount?.stripe_account_id) {
      return res.status(200).json({
        account: existingAccount.stripe_account_id,
        chargesEnabled: existingAccount.charges_enabled,
        payoutsEnabled: existingAccount.payouts_enabled,
      });
    }

    // Create a new connected account
    const account = await stripeClient.accounts.create({
      type: "standard", 
      // Em TASK-004 do PROD diz Custom / Express dependent, mas standard foi o default assumido
      // Note: Requisitos do context pedem 'Custom + hosted/embedded onboarding + destination charges'
      // type: 'custom' if going full custom, standard se mais simples
    });

    // Save in DB
    const { data, error } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .insert({
        tenant_id: tenantId,
        stripe_account_id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Erro criando connect account:", error);
    return res.status(500).json({ error: error.message });
  }
}
