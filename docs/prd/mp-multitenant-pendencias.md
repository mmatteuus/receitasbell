# PRD — Pendências para Go-Live do Mercado Pago Multi-Tenant

## Objetivo
Fechar os itens restantes para declarar o fluxo Mercado Pago multi-tenant como pronto para produção, com segurança, previsibilidade operacional e cobertura de testes.

## Contexto atual
- Fluxo seller-aware já existe no código para checkout, webhook e reconciliação.
- Persistência de conexão já foi movida para tabela dedicada com backfill legado.
- Hardening de borda iniciou com `Content-Security-Policy-Report-Only`.
- Ainda faltam validação operacional real, observabilidade e rollout controlado.

## Escopo pendente

### 1. Infra de produção
- Criar/validar tabela `BASEROW_TABLE_MP_CONNECTIONS` com campos:
  - `tenant_id`
  - `mercado_pago_user_id`
  - `access_token_encrypted`
  - `refresh_token_encrypted`
  - `public_key`
  - `status`
  - `connected_at`
  - `disconnected_at`
  - `last_refresh_at`
  - `last_error`
  - `created_by_user_id`
  - `updated_at`
- Garantir `ENCRYPTION_KEY` válido (base64 de 32 bytes) em `dev`, `staging` e `prod`.
- Confirmar permissões do token Baserow para CRUD na nova tabela.

### 2. Testes críticos de integração/E2E
- Executar em CI:
  - `npm run typecheck`
  - `npm run test:unit`
  - `npm run test:smoke`
  - `npm run test:flows`
- Cobrir cenários obrigatórios:
  - tenant A conecta conta A e recebe nela;
  - tenant B conecta conta B sem interferência;
  - disconnect bloqueia checkout futuro;
  - reconnect substitui conta ativa anterior;
  - webhook com assinatura válida atualiza pedido correto por tenant;
  - webhook/reconcile não usa token global.

### 3. Robustez de token
- Implementar refresh automático on-demand antes de falha final de checkout.
- Persistir metadado de expiração para refresh preditivo quando disponível.
- Padronizar política de erro para transição `connected -> reconnect_required`.

### 4. Observabilidade e operação
- Publicar dashboard com:
  - checkouts por tenant,
  - erro MP por status HTTP,
  - conexões em `reconnect_required`,
  - webhooks rejeitados por assinatura.
- Criar alertas para:
  - pico de falha em checkout,
  - aumento de `reconnect_required`,
  - reconciliação com baixa taxa de sucesso.

### 5. Hardening fase 2
- Coletar relatórios de CSP por 7-14 dias.
- Ajustar política e migrar de `Report-Only` para `Content-Security-Policy` enforce sem regressão.

## Não objetivo
- Split marketplace.
- Múltiplas contas ativas por tenant.
- Troca de gateway.

## Critérios de aceite finais
- Cada tenant processa pagamento somente na própria conta MP.
- Nenhum token em claro na `settings`.
- No máximo 1 conexão ativa por tenant, com histórico preservado.
- CI verde com testes críticos do fluxo multi-tenant.
- CSP em enforce após validação de telemetria.

