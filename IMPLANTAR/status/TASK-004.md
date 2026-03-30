# TASK-004 — Saneamento de Payment Orders
- **Objetivo:** proteger `/api/admin/payments` filtrando rows inválidas e marcando-as no storage operacional.
- **Arquivos-alvo:** `scripts/payment-orders-sanitize.cjs` (criar) e `src/server/payments/repo.ts`.
- **Passos**
  1. Exportar snapshot da tabela `Payment_Orders` (array JSON).
  2. Criar script que detecta rows inválidas (campos críticos vazios: `tenant_id`, `created_at`, `external_reference`/`mp_payment_id`/`preference_id`/`payer_email`).
  3. Marcar essas rows com `status=invalid` ou flag similar (sem deletar) e registrar IDs afetados.
  4. Atualizar `src/server/payments/repo.ts` para filtrar `isValidPaymentOrderRow` antes de mapear para `Payment`.
  5. Rodar script em dry-run, depois applying patch com `baserow-mcp`.
- **Outputs esperados**
  - `scripts/payment-orders-sanitize.cjs` criado + executado.
  - Relatório com quantidade de rows inválidas e IDs.
  - Logs de `repo.ts` ajustado e teste `npm run test:unit` confirmando.
- **Após concluir:** registre no log e delete este arquivo.
