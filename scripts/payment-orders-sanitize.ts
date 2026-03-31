import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sanitizePaymentOrders() {
  console.log("--- Iniciando Saneamento de Payment Orders (Supabase) ---");

  // 1. Buscar todas as ordens
  const { data: orders, error } = await supabase
    .from("payment_orders")
    .select("id, tenant_id, created_at, external_reference, mp_payment_id, preference_id, payer_email, status");

  if (error) {
    console.error("Erro ao buscar ordens:", error);
    return;
  }

  console.log(`Total de ordens encontradas: ${orders.length}`);

  const invalidIds: string[] = [];

  for (const order of orders) {
    const isInvalid = 
      !order.tenant_id || 
      !order.created_at || 
      (!order.external_reference && !order.mp_payment_id && !order.preference_id) ||
      !order.payer_email;

    if (isInvalid && order.status !== "invalid") {
      invalidIds.push(order.id);
    }
  }

  console.log(`Ordens inválidas detectadas: ${invalidIds.length}`);

  if (invalidIds.length > 0) {
    console.log("Atualizando status para 'invalid'...");
    const { error: updateError } = await supabase
      .from("payment_orders")
      .update({ status: "invalid", updated_at: new Date().toISOString() })
      .in("id", invalidIds);

    if (updateError) {
      console.error("Erro ao atualizar ordens:", updateError);
    } else {
      console.log("Sucesso! IDs marcados como invalid:", invalidIds.join(", "));
    }
  } else {
    console.log("Nenhuma ordem inválida para atualizar.");
  }

  console.log("--- Saneamento Concluído ---");
}

sanitizePaymentOrders().catch(console.error);
