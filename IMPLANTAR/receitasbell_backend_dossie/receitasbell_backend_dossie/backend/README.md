# Dossiê de Auditoria Backend — Receitas Bell

Este pacote reúne o PRD/Handoff operacional do backend auditado, organizado na estrutura `/backend` exigida pelo guia-mestre.

## Conteúdo
- `prd/`: contexto, trilha e decisões
- `audit/`: achados priorizados, compliance e supply chain
- `contracts/`: OpenAPI e exemplos
- `tasks/`: ordem de execução e DAG
- `checklists/`: pré-flight, DoD, hardening e compliance
- `configs/`: envs e configs-base
- `scripts/`: smoke, SBOM, secret scan e verificação
- `tests/`: estratégia e casos mínimos
- `runbooks/`: deploy, rollback, incidente e troubleshooting
- `handoff/`: execução final, protocolo de não-quebra e previsão de falhas
- `compliance/`: PII mapping, retenção e audit log schema

## Escopo
Auditoria centrada no repositório `mmatteuus/receitasbell`, no projeto Vercel `receitasbell`, na conta Stripe conectada e nos artefatos acessíveis durante a análise.

## Limitações conhecidas
- Sem acesso direto ao schema real do Supabase.
- Sem acesso às env vars reais da Vercel por ausência de `VERCEL_TOKEN` no runtime do operador.
- Sem validação de políticas RLS, índices e migrations reais do banco.



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

