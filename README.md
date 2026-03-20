# Receitas do Bell

Fase 1 da integracao Mercado Pago OAuth multi-tenant com Checkout Pro. O catalogo continua em Google Sheets, e a nova camada de tenants, auth, conexoes OAuth, pagamentos e webhooks roda em Postgres via Prisma.

## Pre-requisitos

- Node.js 20+
- PostgreSQL
- Conta/app Mercado Pago com OAuth habilitado
- Credenciais Google ja usadas pelo projeto

## Variaveis de ambiente

Obrigatorias:

- `DATABASE_URL`
- `APP_BASE_URL`
- `ADMIN_API_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `MERCADO_PAGO_CLIENT_ID`
- `MERCADO_PAGO_CLIENT_SECRET`
- `MERCADO_PAGO_REDIRECT_URI`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SPREADSHEET_ID`

Opcionais:

- `GOOGLE_DRIVE_FOLDER_ID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Use `.env.example` como base. `ENCRYPTION_KEY` deve ser uma chave AES-256-GCM em base64 com 32 bytes reais.

## Rodando localmente

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha os valores.
3. Gere o Prisma Client: `npx prisma generate`
4. Aplique a migration: `npx prisma migrate deploy`
5. Rode a app: `npm run dev`

## Banco e migracoes

- Schema Prisma: `prisma/schema.prisma`
- Migration inicial: `prisma/migrations/20260320_mercadopago_multitenant/migration.sql`

Modelos principais:

- `tenants`
- `tenant_domains`
- `tenant_users`
- `tenant_sessions`
- `mercado_pago_connections`
- `mercado_pago_oauth_states`
- `payments`
- `payment_events`
- `payment_notes`
- `audit_logs`

## Bootstrap do primeiro tenant

1. Acesse `/admin/login`
2. Informe a senha legado (`ADMIN_API_SECRET`)
3. Crie o primeiro tenant, slug e admin por e-mail/senha
4. Depois disso, o login passa a ser tenant-scoped

Em homologacao/local sem dominio por tenant, use:

- `/t/{tenantSlug}/admin/login`

## Redirect URI do Mercado Pago

Cadastre no painel da app Mercado Pago:

- Local: `http://localhost:8080/api/mercadopago/oauth/callback`
- Producao: `https://seu-dominio/api/mercadopago/oauth/callback`

O sistema inicia a conexao por `POST /api/admin/mercadopago/connect` e completa em `GET /api/mercadopago/oauth/callback`.

## Webhook do Mercado Pago

Configure no Mercado Pago:

- URL: `https://seu-dominio/api/payments/mercadopago/webhook`
- Assinatura secreta em `MERCADO_PAGO_WEBHOOK_SECRET`
- Evento `payment`

O checkout registra `tenantId` e `paymentId` no `notification_url`, permitindo buscar os detalhes do pagamento com o token do seller correto.

## Testando a conexao Mercado Pago

1. Entre no admin do tenant
2. Abra `Pagamentos > Configuracoes`
3. Clique em `Conectar com Mercado Pago`
4. Autorize a conta no fluxo OAuth
5. Volte para a aplicacao e valide o estado `Conta conectada`

## Testando um pagamento

1. Garanta que o tenant esta conectado
2. Ative `Modo producao` no admin se quiser usar Mercado Pago real
3. Inicie o checkout publico no tenant correto
4. Confirme que a preferencia e criada com `external_reference = t:{tenantId}:p:{paymentId}`
5. Verifique se o webhook atualiza `payments.status`

## Reconectar e desconectar

- Reconectar: use o mesmo botao de conexao; estados `reconnect_required` sao tratados no painel.
- Desconectar: `POST /api/admin/mercadopago/disconnect`
- Tokens invalidos/revogados sao marcados como `reconnect_required` quando refresh falha ou a API retorna `401/403`

## Testes

- `npm run typecheck`
- `npm run test:unit`
- `npm run build`

Cobertura adicionada:

- state OAuth
- resolucao de tenant
- assinatura de webhook
- servico OAuth
- servico de checkout tenant-aware

## Limitacoes e pendencias reais

- `[PENDENTE]` Confirmar documentalmente suporte oficial a PKCE no fluxo seller OAuth atual do Mercado Pago antes de implementar `code_challenge`.
- `[PENDENTE]` Confirmar endpoint oficial de revogacao remota da autorizacao; hoje a desconexao local limpa os segredos e a revogacao remota e detectada por erro/refresh.
- `[PENDENTE]` O restante do catalogo continua global em Google Sheets. Esta entrega tenantiza auth + Mercado Pago + pagamentos; tenantizacao completa do conteudo fica para a fase 2.
- `[PENDENTE]` Para desenvolvimento local multi-tenant completo no storefront ainda faltam aliases/links tenant-aware em toda a area publica; o modo slug foi priorizado para admin e checkout.
