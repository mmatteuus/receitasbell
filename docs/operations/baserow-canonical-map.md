# Baserow Canonical Map (2026-03-25)

Fonte: `docs/operations/baserow-sanitization-report.json` (gerado por `scripts/baserow-sanitize.cjs`).

## Tabelas canônicas recomendadas

- `tenants`: `896975` (`Tenants`)
- `settings`: `896976` (`Settings`)
- `categories`: `896977` (`Categories`)
- `recipes`: `896978` (`Recipes`)
- `users`: `896984` (`Users`)
- `recipe_purchases`: `896992` (`Entitlements`)
- `magic_links`: `900630` (`magic_links`)
- `sessions`: `897385` (`Tabletenant_sessions`)  
  Observação: é a única tabela de sessão com `session_token_hash` e `expires_at`.

## Duplicidades detectadas

- Nome duplicado: `tenant_sessions`
  - `897407` (`tenant_sessions`)
  - `897409` (`tenant_sessions`)

## Segurança (auth admin)

- Campo `password_hash` foi criado na tabela `Users` via saneamento.
- Foi encontrada 1 credencial fraca legada em campo `password` (texto puro), ainda pendente de rotação.

## Ações pendentes de fechamento

1. Definir senha forte do admin afetado e migrar `password` -> `password_hash`.
2. Arquivar tabelas duplicadas de sessão que não são canônicas.
3. Confirmar no projeto Vercel os IDs `BASEROW_TABLE_*` apontando para as tabelas canônicas acima.
