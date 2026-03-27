# Rollout — Mercado Pago Multi-Tenant

## Checklist Dev
- [ ] `ENCRYPTION_KEY` configurado localmente.
- [ ] `BASEROW_TABLE_MP_CONNECTIONS` apontando para tabela válida.
- [ ] Fluxo admin `conectar/desconectar` funcionando.
- [ ] Checkout cria preferência com conta do tenant conectado.
- [ ] Webhook atualiza pedido correto e dispara `syncPayment`.
- [ ] Reconciliação (`/api/jobs/reconcile`) atualiza pendências por tenant.

## Checklist Staging
- [ ] Variáveis revisadas (`env`, tabela MP, webhook secret).
- [ ] Teste com 2 tenants distintos:
  - [ ] tenant A recebe em conta A.
  - [ ] tenant B recebe em conta B.
- [ ] Reconnect substitui conta ativa sem quebrar pedidos.
- [ ] Disconnect impede novas cobranças até reconectar.
- [ ] Logs registram `connect`, `disconnect`, `reconnect`, `refresh_success`, `refresh_failed`, `connection_repaired`.
- [ ] CSP report-only coletando dados sem bloqueio.

## Checklist Produção
- [ ] Deploy com CI verde (`typecheck`, unit, smoke, flows).
- [ ] Ativar rollout por tenants piloto.
- [ ] Monitorar 24-48h:
  - [ ] erro de checkout,
  - [ ] `reconnect_required`,
  - [ ] falha de webhook/reconcile.
- [ ] Expandir rollout para 100% dos tenants após estabilidade.

## Plano de rollback
- Se falha crítica de checkout por tenant:
  - congelar onboarding de novas conexões;
  - manter leitura de pedidos existentes e reconciliar manualmente;
  - executar runbook de reconexão para tenants impactados.
- Se regressão ampla:
  - rollback da versão;
  - rodar reconcile manual para recuperar status dos pedidos pendentes.
