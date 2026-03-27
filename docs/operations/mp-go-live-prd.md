# PRD Operacional — Fechamento Final do Mercado Pago Multi-Tenant

## Objetivo
Levar o módulo Mercado Pago multi-tenant ao estado “produção blindada”, com prova automatizada, validação em staging e procedimentos claros de suporte/rollback.

## Escopo coberto aqui
- Conexão OAuth por tenant, storage criptografado e refresh preventivo (já implementados).
- Observabilidade mínima (eventos estruturados já no código).
- Testes que ainda faltavam (webhook, reconcile e E2E admin) agora versionados.
- Passos operacionais para staging, produção e suporte.

## Estado atual do código
- Token lifecycle: `expires_at`, refresh preventivo, retry único em `checkout`, `webhook` e `reconcile`.
- Regra de 1 conexão ativa por tenant + job `/api/jobs/payments/repair-connections`.
- `payment_mode` efetivo: `sandbox_init_point` vs `init_point` na resposta do checkout.
- Headers/hardening: HSTS, Permissions-Policy, CSP em Report-Only com endpoint `/api/security/csp-report`.
- Legado `MP_ACCESS_TOKEN` removido do fluxo operacional.
- Testes novos:
  - `tests/mercadopago-webhook-handler.test.ts`
  - `tests/mercadopago-reconcile-handler.test.ts`
  - `tests/admin-mercadopago-connect.spec.ts` (Playwright mockado)

## Dependências externas obrigatórias
- Baserow: tabela `MP_CONNECTIONS` deve ter coluna `expires_at` (datetime ISO).
- Segredos: `CRON_SECRET`, app OAuth (client_id/secret), webhook secret do MP, chave de criptografia `ENCRYPTION_KEY`.
- CSP reporting: rota `/api/security/csp-report` habilitada e endpoint de coleta acessível.
- Vercel: o cron atual em `vercel.json` usa `0 6 * * *` (uma vez por dia, 06:00 UTC), compatível com Hobby. Se a equipe voltar a precisar de reconcile frequente, isso passa a exigir plano Pro ou superior.

## Checklist local/CI
1) Instalar dependências com Node 24 (ver `.nvmrc`). Se `npm ci` falhar no binário do Rollup, remover `node_modules/@rollup` e repetir.  
2) Rodar `npm run typecheck`.  
3) Rodar `npm run test:unit` (cobre webhook/reconcile).  
4) Rodar `npm run test:smoke` e `npm run test:flows` se ambiente permitir.  
5) Rodar `npx playwright test tests/admin-mercadopago-connect.spec.ts` (usa mocks, não precisa de credenciais MP).  
6) Validar que nenhuma suite referencia `MP_ACCESS_TOKEN`.

## Checklist de staging (dois tenants reais ou controlados)
1) Garantir coluna `expires_at` criada em `MP_CONNECTIONS`.  
2) Conectar tenant A à conta MP-A; tenant B à conta MP-B.  
3) Criar checkout no tenant A e confirmar que `init_point/sandbox_init_point` usa token A.  
4) Forçar expiração (ou reduzir TTL) e verificar refresh preventivo + retry único; esperar que `reconnect_required` só apareça após falha dupla.  
5) Disparar webhook real (ou replay) e confirmar que `webhook.payment_synced` aparece com `tenantId` correto.  
6) Rodar `/api/jobs/payments/repair-connections?secret=...` em staging com duplicidades fabricadas e confirmar auditoria `mercadopago.connection_repaired`.  
7) Conferir CSP report reachability enviando um reporte de teste para `/api/security/csp-report`.  
8) Validar UI admin: bloqueios de produção aparecem, readiness libera `init_point` quando completo.

## Go-live em produção
1) Replicar checklist de staging com duas contas reais (ou sandbox oficial) antes do switch final.  
2) Confirmar `productionReady=true` e `effectiveCheckoutUrlKind=init_point` em `/api/admin/payments/settings`.  
3) Habilitar webhooks no painel MP apontando para `/api/checkout/webhook` com segredo configurado.  
4) Garantir cron/job de reconcile agendado com `CRON_SECRET`. No modo Hobby, a referência oficial é `0 6 * * *`; qualquer aumento de frequência deve vir junto com migração para Pro.  
5) Registrar endpoints de observabilidade no painel (logs + CSP reports).

## Operação e suporte
- Eventos esperados: `mercadopago.refresh_success`, `mercadopago.refresh_failed`, `checkout.preference_created`, `checkout.preference_failed`, `webhook.payment_synced`, `webhook.payment_sync_failed`, `mercadopago.connection_repaired`.
- Estados da conexão:
  - `connected`: OK.
  - `reconnect_required`: disparar reconnect no admin; repair job mantém só a conexão mais recente.
  - `disconnected`: sem pagamentos até reconectar.
- Tokens:
  - Refresh preventivo ocorre quando `expires_at <= agora + 5min`.
  - Retry único após 401/403; se falhar, conexão cai para reconnect.
- Repair job: `GET /api/jobs/payments/repair-connections?secret=CRON_SECRET` (ou header Bearer). Mantém apenas a conexão ativa mais recente por tenant.
- Reconcile automático: em Hobby roda 1x por dia; webhook continua sendo a sincronização primária e o job/manual endpoint cobre suporte e recuperação.
- CSP: relatórios chegam em `/api/security/csp-report`; logs devem ser sanitizados e rate-limited.

## Rollback rápido
1) Se checkout falhar em massa por token: reconectar conta pelo admin (gera nova conexão e substitui antiga).  
2) Se o reconnect não resolver: marcar conexão manualmente como desconectada e repetir OAuth.  
3) Se CSP bloquear recursos acidentalmente: manter em Report-Only (atual), revisar política e só então aplicar modo enforce.  
4) Se a UI admin quebrar por API: usar `repair-connections` e `settings` via curl/postman para recuperar estado.

## Referências rápidas
- Código crítico: `api/checkout/webhook.ts`, `api/jobs/reconcile.ts`, `src/server/integrations/mercadopago/connections.ts`, `src/server/payments/service.ts`, `src/pages/admin/payments/SettingsPage.tsx`, `vercel.json`.
- Testes adicionados: `tests/mercadopago-webhook-handler.test.ts`, `tests/mercadopago-reconcile-handler.test.ts`, `tests/admin-mercadopago-connect.spec.ts`.
