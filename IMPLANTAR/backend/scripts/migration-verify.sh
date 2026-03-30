#!/usr/bin/env bash
set -euo pipefail

echo "[verify] campos genéricos de pagamento"
echo "Verifique manualmente no storage:"
echo "- payment_provider"
echo "- provider_payment_id"
echo "- provider_checkout_id"
echo "- provider_account_id"
echo "- provider_status"
echo "- provider_event_id"

echo "[verify] ausência de legado MP"
rg -n "mercadopago|mercado_pago|mp_" . || true
