#!/usr/bin/env bash
set -euo pipefail
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
echo "SBOM gerado em sbom.json"
