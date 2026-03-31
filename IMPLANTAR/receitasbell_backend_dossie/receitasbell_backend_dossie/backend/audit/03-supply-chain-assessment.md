# 03 — Supply Chain Assessment

## Pontos positivos
- GitHub Actions fixadas por SHA no workflow principal.
- Gate de qualidade já existe com lint, typecheck, build e testes.

## Lacunas
1. Sem SBOM por release.
2. Sem secret scan bloqueante.
3. Sem SAST bloqueante.
4. `npm audit` não bloqueia porque usa `continue-on-error: true`.
5. Sem política formal de atualização automática.

## Recomendação
### Pipeline mínimo obrigatório
1. checkout por SHA
2. setup-node por SHA
3. `npm ci`
4. lint
5. typecheck
6. build
7. test:unit
8. secret scan
9. SAST
10. dependency audit crítico
11. SBOM

## Ferramentas propostas
- gitleaks
- semgrep
- CycloneDX
- renovate

## Risco se não agir
- repetição de vazamento
- dependências vulneráveis passando no merge
- ausência de trilha de inventário



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

