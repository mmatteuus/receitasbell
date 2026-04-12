# DOSSIÊ COMPLETO — AUDITORIA GERAL DA APLICAÇÃO + STRIPE + VERCEL + SUPABASE

**Data:** 2026-04-06  
**Autor:** ChatGPT  
**Objetivo:** entregar para um agente IA um diagnóstico executável da aplicação, com foco em rotas, lógica, organização, segurança, Stripe, Vercel e Supabase.

---

# 0. REGRA CRÍTICA

## NÃO GRAVAR SEGREDOS REAIS NO GIT

Este repositório **não deve** receber:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_SECRET`
- `APP_COOKIE_SECRET`
- `ENCRYPTION_KEY`
- tokens Vercel
- cookies, session tokens, bypass secrets, OIDC tokens

### O que o agente deve fazer

- documentar **nomes** das variáveis
- documentar **onde** cada uma deve ser configurada
- usar placeholders no repo
- aplicar valores reais apenas em Vercel / Stripe / Supabase / secret manager

---

# 1. O QUE FOI CONFIRMADO

## 1.1 Vercel

Projeto confirmado:

- **Projeto:** `receitasbell`
- **Team:** `matdev`
- **Project ID:** `prj_j1CPT7Y6j9ezx26rifAfrl29x9GE`
- **Node:** `20.x`
- **Deploy mais recente:** `READY`
- **Domínios vistos:**
  - `receitasbell.vercel.app`
  - `receitasbell.mtsferreira.dev`
  - `receitasbell-matdev.vercel.app`
  - `receitasbell-git-main-matdev.vercel.app`

## 1.2 Stripe

Conta Stripe confirmada neste ambiente:

- **Account ID:** `acct_1T4JaqCXD5Lwt8YN`
- **Display name:** `Área restrita de New business`

## 1.3 Rotas de pagamento confirmadas no código

Rotas do payments router:

- `/api/payments/connect/account`
- `/api/payments/connect/onboarding-link`
- `/api/payments/connect/status`
- `/api/payments/checkout/session`
- `/api/payments/webhooks/stripe`
- alias: `/api/payments/webhook`

### Rota errada que NÃO deve ser usada

- `/api/payments/stripe/webhook`

---

# 2. VEREDITO GERAL

## Estado atual

A aplicação tem base boa, mas **a organização ainda não está amarrada o suficiente** para crescer com segurança sem virar dívida técnica.

## Problemas mais críticos

1. drift entre código e schema de pagamentos
2. identidade do comprador inconsistente
3. entitlement inconsistente
4. catálogo Stripe duplicado em estratégia
5. tenancy resolver permissivo demais
6. fallback de sessão stateless que aumenta superfície de risco
7. cron secret aceito por query string
8. parsing JSON tolerante demais em rotas críticas
9. rate limit importado no handler comum, mas não imposto centralmente
10. não foi possível confirmar advisors/estado real do Supabase deste projeto nesta sessão

---

# 3. AUDITORIA DE ROTAS E LÓGICA

## 3.1 Router de pagamentos

### Está OK

- existe um router específico de pagamentos
- separa connect / checkout / webhook
- rota correta do webhook está definida

### Risco

A documentação operacional antiga já apontava endpoint errado. Isso é risco real de produção.

### Ação

- manter apenas `/api/payments/webhooks/stripe`
- manter `/api/payments/webhook` apenas como alias temporário
- remover qualquer doc/playbook com `/api/payments/stripe/webhook`

---

## 3.2 Lógica de checkout

### Problema

A identidade do comprador ainda pode colapsar `userId` com email.

### Consequência

- quebra com `user_id` UUID
- reconciliação ruim
- grant inconsistente

### Ação

- `payment_orders.user_id` recebe UUID somente
- email do comprador vai em `metadata.payerEmail`
- `customer_email` deve ser enviado ao Stripe Checkout
- `payment_intent_data.metadata` também deve ser preenchido

---

## 3.3 Lógica de acesso pago

### Problema

O sistema ainda mistura `recipe_purchases` e `entitlements` como se fossem equivalentes.

### Consequência

- acesso pago inconsistente
- admin não consegue confiar na fonte de verdade
- refund/revoke vira bagunça

### Ação

Definir:

- `payment_orders` = estado financeiro local
- `payment_events` = trilha de evento externo
- `entitlements` = acesso concedido
- `recipe_purchases` = remover do papel de fonte principal ou redefinir formalmente

---

# 4. AUDITORIA DE SEGURANÇA DO BACKEND

## 4.1 HTTP base (`src/server/shared/http.ts`)

### O que está bom

- correlation/request id
- response em problem+json
- no-store em erro
- leitura de raw body para webhook disponível

### Problemas

#### A. `requireCronAuth` aceita secret na query string

Isso é ruim porque query string vaza fácil em:

- logs
- analytics
- history
- traces
- ferramentas de observabilidade

### Ação

- aceitar **somente** header Authorization Bearer
- remover fallback por query param

#### B. `readJsonBody()` engole erro e devolve `{}`

Isso é ruim em rota crítica porque input inválido vira “objeto vazio” silenciosamente.

### Consequência

- difícil diferenciar cliente bugado de payload inválido
- risco de fluxo parcialmente executado

### Ação

- em rotas críticas, parse inválido deve gerar `400`
- manter modo tolerante apenas onde isso fizer sentido

#### C. rate limit não está centralizado no wrapper

O arquivo importa rate limit, mas não o aplica de forma determinística para todas as rotas sensíveis.

### Ação

- aplicar rate limit em auth/login
- aplicar rate limit em admin sensível
- aplicar rate limit em webhook só se compatível com provedor
- aplicar rate limit em endpoints públicos suscetíveis a abuso

---

## 4.2 Sessões (`src/server/auth/sessions.ts`)

### O que está bom

- cookie `HttpOnly`
- `SameSite=Lax`
- `Secure` em produção
- hash do token persistido em `auth_sessions`
- revogação persistente
- checagem de `profile.is_active`

### Problemas

#### A. fallback para sessão stateless quando falha o banco

Se o insert em `auth_sessions` falha, o sistema cai para cookie criptografado localmente.

### Risco

- perde trilha central de sessão
- revogação fica desigual
- incidente em banco vira mudança silenciosa de modelo de sessão

### Ação

- remover fallback stateless em produção
- aceitar fallback apenas em modo desenvolvimento, se muito necessário
- em produção, falha de sessão deve falhar o login

#### B. cookie de admin e usuário compartilha o mesmo mecanismo base

Não é necessariamente errado, mas merece revisão de escopo/segregação.

### Ação

- avaliar separação entre sessão user e sessão admin
- pelo menos endurecer controles nas rotas admin

---

## 4.3 Tenancy (`src/server/tenancy/resolver.ts`)

### Problema crítico

O tenant pode ser resolvido por:

- header `x-tenant-slug`
- body
- query
- host

Isso é conveniente, mas **muito permissivo**.

### Risco

- spoofing de tenant em rota interna mal protegida
- confusão entre origem canônica e origem declarada pelo cliente
- superfície de escalada lateral entre tenants

### Ação obrigatória

- para rotas públicas: usar host como origem canônica, com exceções controladas
- para rotas admin/session: usar tenant da sessão autenticada, não do cliente
- para rotas internas de sistema: exigir origem autenticada + tenant explícito validado
- reduzir ou eliminar prioridade de tenant vindo do body/query em rotas sensíveis

---

## 4.4 Admin / Guards

### Risco presumido alto

As rotas admin dependem de sessão + contexto de tenant. Isso é correto como direção, mas precisa auditoria linha a linha nas rotas de admin para garantir:

- tenant vindo da sessão
- não do payload
- não do query

### Ação

- revisar `src/server/admin/*`
- revisar `src/server/auth/guards.ts`
- revisar `src/server/admin/guards.ts`
- revisar `src/server/admin/auth.ts`

---

## 4.5 Stripe Webhook

### O que está bom

- valida assinatura
- usa raw body
- trata eventos principais

### Problemas

- idempotência ainda não está robusta o suficiente
- grant e trilha ainda não estão canônicos
- metadata no PaymentIntent subjacente não está claramente preenchido

### Ação

- registrar `event.id`
- usar `payment_events` como trilha formal
- salvar `provider_event_id`
- usar `provider_metadata_json`
- preencher `payment_intent_data.metadata`
- deduplicar reenvio de evento

---

# 5. AUDITORIA DE STRIPE

## 5.1 O que está correto

- uso de Checkout Session
- uso de webhook com assinatura
- uso de Connect com onboarding/status
- uso de transfer + application fee

## 5.2 O que está errado

### Estratégia duplicada de catálogo

Hoje coexistem dois modelos:

1. sincronização de `stripe_product_id` / `stripe_price_id`
2. checkout criando `price_data` inline

### Consequência

- catálogo órfão
- preço salvo que não é o preço efetivamente cobrado
- reconciliação pior
- manutenção pior

### Decisão necessária

Escolher uma estratégia:

#### Opção A — inline price

- remover papel do catálogo Stripe para cobrança
- usar Stripe apenas como checkout/pagamento

#### Opção B — catálogo Stripe canônico

- checkout passa a usar `price: stripe_price_id`
- sync de preço vira fonte de verdade

### Recomendação

Para o estado atual do projeto: **Opção A** é a mais simples e menos bagunçada, a não ser que exista exigência operacional explícita de catálogo Stripe.

---

## 5.3 O que faltou configurar nesta sessão

### Não foi possível configurar completamente via ferramentas disponíveis:

- webhook endpoint na dashboard Stripe
- secrets reais de webhook
- Connect/platform settings avançados
- métodos de pagamento por dashboard
- organização/estrutura interna adicional na conta Stripe

### Motivo

As ferramentas expostas nesta sessão não incluem mutações administrativas completas da dashboard Stripe.

### O que o agente deve fazer

No Stripe Dashboard:

1. confirmar conta da plataforma correta
2. confirmar modo TEST e LIVE
3. configurar webhook de TEST e LIVE
4. ativar métodos de pagamento aprovados para o negócio
5. revisar Connect settings
6. documentar account ID, webhook endpoints e eventos ativos

---

# 6. AUDITORIA DE VERCEL

## O que está bom

- projeto correto identificado
- deploy atual pronto
- múltiplos domínios identificados

## Pontos de segurança a aplicar

### A. variáveis sensíveis

No Vercel, configurar como **sensitive** ou equivalente seguro de ambiente:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_SECRET`
- `APP_COOKIE_SECRET`
- `ENCRYPTION_KEY`
- `CRON_SECRET`

### B. ambientes separados

Separar no mínimo:

- `production`
- `preview`
- `development`

Não misturar segredo real de produção com preview.

### C. deployment protection

Se a proteção do deploy bloquear webhook externo, o agente deve avaliar:

- bypass seguro para webhook
- ou domínio/rota pública controlada para webhook

Sem improviso.

### D. headers

Revisar `vercel.json` e confirmar:

- CSP correta
- no-store em APIs sensíveis
- HSTS
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy

---

# 7. AUDITORIA DE SUPABASE

## Limitação desta sessão

Não foi possível inspecionar o projeto Supabase do `receitasbell` com as mesmas permissões que tive em sessão anterior. Portanto, **não estou confirmando advisors, RLS ou logs deste projeto agora**.

## O que o agente deve fazer no Supabase

### Banco

- revisar tabelas: `payment_orders`, `payment_events`, `entitlements`, `stripe_connect_accounts`, `auth_sessions`
- confirmar colunas reais
- confirmar drift com código

### Segurança

- revisar RLS em tabelas sensíveis
- revisar uso de service role
- revisar funções/edge functions públicas
- revisar advisors de segurança e performance

### Auth

- revisar política de sessão
- revisar perfis inativos
- revisar convites/admins

---

# 8. MATRIZ DE CREDENCIAIS E CONFIGURAÇÕES NECESSÁRIAS

## Stripe

- `STRIPE_SECRET_KEY` → Vercel Production/Preview
- `STRIPE_WEBHOOK_SECRET` → Vercel Production/Preview
- `STRIPE_ACCOUNT_ID_PLATFORM` → documentar no dossiê, não precisa expor em env se não usado pelo app

## Supabase

- `SUPABASE_URL` → Vercel
- `SUPABASE_ANON_KEY` ou publishable key → frontend/runtime apropriado
- `SUPABASE_SERVICE_ROLE_KEY` → server only

## Sessão / Criptografia

- `APP_COOKIE_SECRET`
- `ENCRYPTION_KEY`

## Admin / Sistema

- `ADMIN_API_SECRET`
- `CRON_SECRET`

## Base URL

- `APP_BASE_URL`

### Regra

Todos os itens acima devem ser documentados no repo **somente com nome, escopo, ambiente e owner**, sem valor real.

---

# 9. ORGANIZAÇÃO RECOMENDADA

## Fonte de verdade final

- `payment_orders` = estado do pedido
- `payment_events` = trilha do Stripe
- `entitlements` = liberação de acesso
- `stripe_connect_accounts` = estado do seller
- `auth_sessions` = sessão persistente

## Organização operacional do repo

Manter em `IMPLANTAR`:

- dossiê geral
- dossiê Stripe
- checklist pós-patch/live
- matriz de credenciais
- tarefas por agente
- bloqueios

---

# 10. TAREFAS PARA O AGENTE IA

## P0

1. corrigir drift payments repo / checkout / webhook / entitlements
2. endurecer tenancy resolver
3. remover cron secret por query string
4. endurecer parse de body em rotas críticas
5. remover fallback stateless em produção
6. decidir estratégia única de catálogo Stripe

## P1

7. auditar `src/server/admin/*`
8. revisar guards/admin auth
9. aplicar rate limit nas rotas sensíveis
10. revisar headers/CSP efetiva no deploy
11. revisar RLS e advisors no Supabase

## P2

12. separar melhor sessão user/admin se necessário
13. criar testes de integração de pagamento
14. criar runbook de incidentes financeiros

---

# 11. O QUE NÃO FOI EXECUTADO NESTA SESSÃO

## Não concluído por limitação de ferramenta/acesso

- criação efetiva de organização no banco deste projeto
- configuração total da dashboard Stripe
- configuração total de env vars no projeto Vercel por API nesta sessão
- validação live do Supabase do `receitasbell`
- gravação de segredos reais

## Isso é intencionalmente correto

- segredos não devem entrar em git
- operações administrativas reais precisam usar o ambiente certo e confirmação operacional

---

# 12. CONCLUSÃO FINAL

## Resposta direta

A aplicação **não está ruim**, mas **ainda não está amarrada o suficiente** para crescer sem gerar bagunça operacional e risco de segurança.

## Onde está o maior risco

- tenant resolution permissiva
- sessão com fallback stateless em produção
- cron secret por query param
- drift entre pagamentos/webhook/schema
- duplicidade de estratégia no Stripe

## Próximo passo correto

O agente IA deve usar este dossiê como plano de execução e complementar com:

- revisão do Supabase real do projeto
- configuração manual assistida na dashboard Stripe
- configuração segura de ambientes no Vercel

---

## Leitura complementar

- `IMPLANTAR/dossies/AUDITORIA-ARQUITETURA-STRIPE-2026-04-06.md`
- `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`
- `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`
- `IMPLANTAR/checklists/CHECKLIST-VALIDACAO-STRIPE-POS-PATCH-E-LIVE-2026-04-06.md`

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
