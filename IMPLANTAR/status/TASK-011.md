# TASK-011 — Criar testes de regressão social + payments
- **Objetivo:** garantir que os fluxos admin/payments e social auth não regredam após correções.
- **Arquivos-alvo:** `tests/admin-payments-realworld-regression.test.ts` (criar), `tests/admin-payments-readiness.test.ts` (ajustes se necessário), `tests/social-auth-regression.test.ts` (pode usar mocks).
- **Passos**
  1. Escrever testes simulando:
     - settings com row legada sem `status`.
     - conexões com `access_token` plain e sem encrypted.
     - Duplicate connections no mesmo tenant.
     - Payment Orders com rows inválidas sendo filtradas.
     - Callback social que exige `email_verified`.
  2. Certificar que testes falham antes da correção e passam depois.
  3. Rodar `npm run test:unit` para validar.
  4. Documentar no log os resultados (status, coverage, issues menores).
- **Outputs esperados**
  - Novos arquivos de teste.
  - Logs `npm run test:unit` e `npm run gate`.
  - Observações em `execution-log.md`.
- **Após concluir:** registrar no log e deletar este arquivo.
