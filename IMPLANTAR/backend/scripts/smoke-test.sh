#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "[smoke] health"
curl -fsS "$BASE_URL/api/health" >/dev/null || exit 1

echo "[smoke] connect status"
curl -fsS "$BASE_URL/api/payments/connect/status?tenantId=receitasbell" >/dev/null || exit 1

echo "[smoke] done"
