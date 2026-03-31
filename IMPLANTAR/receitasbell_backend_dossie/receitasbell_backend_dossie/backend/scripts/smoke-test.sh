#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"

echo "[smoke] GET /api/health"
curl -fsS "$BASE_URL/api/health" >/dev/null

echo "[smoke] GET /api/health/live"
curl -fsS "$BASE_URL/api/health/live" >/dev/null

echo "[smoke] GET /api/health/ready"
curl -fsS "$BASE_URL/api/health/ready" >/dev/null

echo "[smoke] OK"
