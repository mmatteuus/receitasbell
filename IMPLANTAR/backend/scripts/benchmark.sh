#!/usr/bin/env bash
set -euo pipefail
echo "Defina um benchmark com k6/Artillery para /api/payments/checkout/session e /api/payments/webhooks/stripe."
echo "Critério inicial: p95 < 300ms para criação local sem chamada externa real; throughput sem erro > 99%."
