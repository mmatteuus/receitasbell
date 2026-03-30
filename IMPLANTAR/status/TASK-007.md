# TASK-007 — Revisão do MAGIC LINK e campo de expiração
- **Objetivo:** confirmar o schema real de `magic_links.expiresAt` e aplicar a estratégia expand-contract se necessário, mantendo a expiração por minutos.
- **Arquivos-alvo:** `src/server/auth/magicLinks.ts`, `src/server/shared/env.ts`, `IMPLANTAR/status/`.
- **Passos**
  1. Inspecionar a tabela `magic_links` via `baserow-mcp` para determinar se `expiresAt` armazena apenas date ou datetime.
  2. Se for date-only, implementar `expiresAtIso`, escrever nos dois campos (leitura preferencial `expiresAtIso`), migrar rows antigas e documentar.
  3. Garantir que os logs/traces registrem a expiração real (minutos) e que a API `POST /api/auth/request-magic-link` responda com o TTL esperado.
  4. Atualizar qualquer configuração nas runbooks (`#PLAN`). Documentar a decisão no log.
- **Outputs esperados**
  - Descrição do tipo do campo e ações tomadas (migração, novos campos).
  - Scripts ou SQL minimal (se aplicável) com o migrate.
  - Testes (unitários ou manuais) confirmando expiração correta.
- **Após concluir:** log + delete do arquivo.
