# Supply chain assessment

Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Objetivo
Garantir que a migração para Stripe-only não introduza risco de dependência, pipeline ou artefato.

## Estado alvo
- lockfile válido e versionado
- SBOM gerado a cada release
- secret scan em CI
- dependency scan em CI
- artifact build com gate obrigatório
- sem actions fixadas por tags mutáveis em workflows críticos

## Gaps a verificar na execução
- presença de `SECURITY.md`
- presença de `renovate.json`
- geração de `sbom.json`
- scans em PR e release
- rollback de deploy documentado

## Ações
1. adicionar `scripts/sbom-generate.sh`
2. adicionar `scripts/secret-scan.sh`
3. fixar CI mínimo em lint, typecheck, build, unit
4. bloquear merge com falha crítica de scan
