#!/usr/bin/env bash
set -euo pipefail
npx gitleaks detect --source . --no-banner
