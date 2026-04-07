# AUDITORIA ESTRUTURAL — STRIPE (Receitas Bell)

**Data:** 2026-04-06  
**Autor:** ChatGPT  
**Objetivo:** avaliar se a integração Stripe está correta hoje e se a organização atual vai escalar sem virar bagunça  
**Resultado curto:** a integração tem partes corretas, mas a arquitetura atual **não está coesa** e tende a virar dívida técnica rápida se não for consolidada.

---

# 1. RESUMO EXECUTIVO

## O que está certo

- existe separação básica entre checkout, webhook e connect
- a assinatura do webhook Stripe já é validada
- existe persistência local para conta conectada (`stripe_connect_accounts`)
- existe intenção de rastrear pagamentos, eventos e grants
- existe sincronização de produto/preço Stripe no fluxo de receita paga

## O que está errado / desalinhado

- o checkout, o webhook, o repo de pagamentos e o repo de entitlement **não usam o mesmo modelo de dados**
- o banco real e o código atual têm drift importante
- há **duas estratégias de catálogo Stripe ao mesmo tempo**:
  1. sync de produto/preço da receita
  2. checkout com `price_data` inline
- o sistema ainda mistura `recipe_purchases` e `entitlements` como se fossem fontes de verdade equivalentes
- não existe trilha de evento Stripe robusta e canônica para auditoria/admin
- a identidade do comprador ainda está inconsistente (`user_id uuid` vs `payerEmail`)

## Veredito

**Do jeito atual, funciona parcialmente, mas não está organizado de forma segura para crescer.**  
Se continuar assim, tende a gerar:

- grants duplicados ou perdidos
- pagamentos aprovados sem liberação consistente
- catálogo Stripe órfão/desnecessário
- admin sem rastreabilidade confiável
- retrabalho em toda mudança de preço/checkout/refund

---

# 2. AVALIAÇÃO POR CAMADA

## 2.1 Checkout

### Está correto

- cria `Checkout Session`
- usa `client_reference_id`
- envia `tenantId` em metadata
- usa `transfer_data.destination` + `application_fee_amount`

### Problema estrutural

O checkout ainda tenta resolver identidade do comprador de forma ambígua.

Hoje existe o padrão perigoso de permitir que `userId` caia para `payerEmail`, o que é incompatível com o banco real quando `payment_orders.user_id` é UUID.

### Risco futuro

- pedido criado com identidade inconsistente
- difícil reconciliar compra por usuário logado vs compra por email
- grants quebrando quando o usuário loga depois

### Correção obrigatória

- definir identidade canônica do comprador
- `payment_orders.user_id` só recebe UUID válido
- email do comprador vai para `metadata.payerEmail`
- `customer_email` deve ser setado no Checkout Session

---

## 2.2 Repo de pagamentos

### Está correto

- existe camada central para CRUD de pagamento
- já existe noção de idempotência (`idempotency_key`)
- já existe mapeamento para admin/payment detail

### Problema estrutural

O repo ainda carrega legado de outro schema. Está tentando operar colunas que não batem com o banco atual.

### Risco futuro

- qualquer refactor de pagamento vai quebrar em mais de um lugar
- painel admin ficará inconsistente
- filtros e queries vão depender de coluna que não existe

### Correção obrigatória

- consolidar `payment_orders` como fonte canônica
- usar `amount_cents`
- usar `metadata` para `payerEmail`, `payerName`, `sessionId`
- usar `provider_event_id` e `provider_metadata_json`
- parar de depender de `payer_email` no schema

---

## 2.3 Webhook Stripe

### Está correto

- valida assinatura
- trata eventos mínimos de checkout e connect
- tenta aprovar pedido e conceder acesso

### Problema estrutural

O webhook ainda grava grant de acesso em um modelo incompatível com o banco atual e não fecha idempotência de forma robusta.

### Risco futuro

- Stripe reenviar evento e duplicar grant
- pedido aprovado sem acesso
- acesso liberado mas sem trilha auditável
- suporte/admin sem conseguir reconstruir o que aconteceu

### Correção obrigatória

- deduplicar por `event.id`
- persistir trilha em `payment_events`
- salvar `provider_event_id`
- usar `entitlements` como concessão de acesso
- parar de tratar `recipe_purchases` como se tivesse colunas legadas

---

## 2.4 Entitlements / Liberação de acesso

### Está correto

- existe a intenção de ter uma camada separada para entitlement

### Problema estrutural

A implementação atual ainda está acoplada a um formato legado de `recipe_purchases` e não reflete a estrutura real do banco.

### Risco futuro

- o frontend/admin acha que existe um estado de entitlement que o banco não tem
- grants podem parecer ativos sem estar coerentes com o pagamento
- revogação/refund vira dor de cabeça

### Correção obrigatória

- `entitlements` vira fonte de verdade de acesso pago
- `recipe_purchases` precisa ser removida do papel de entitlement ou redefinida formalmente
- `recipeSlug` deve ser resolvido via `recipes`, não persistido como cópia solta se não for necessário

---

## 2.5 Stripe Connect

### Está correto

- criação de conta conectada
- onboarding link
- sincronização de status via `account.updated`
- persistência local de `charges_enabled`, `payouts_enabled`, `requirements`

### Problema estrutural

O Connect está funcional, mas a arquitetura ainda está muito presa a handlers. Falta uma camada de domínio mais clara para estados da conta conectada.

### Risco futuro

- regras de readiness espalhadas
- dificuldade para suportar novos flows (re-onboarding, disable, payouts review)
- inconsistência entre admin UI, webhook e sync manual

### Correção recomendada

- criar um serviço/camada canônica de `connect account state`
- centralizar regra de `ready / pending / blocked`
- expor estado pronto para admin sem duplicação de lógica

---

## 2.6 Catálogo de produto/preço Stripe

### Está correto

- receitas pagas têm `stripe_product_id` e `stripe_price_id`
- existe `productSync.ts`

### Problema estrutural grave

A aplicação sincroniza produto/preço no Stripe **e ao mesmo tempo** ignora isso no checkout, criando `price_data` inline.

Ou seja: existem duas verdades de catálogo.

### Por que isso vai virar bagunça

- preços no Stripe podem proliferar sem uso real
- `stripe_price_id` salvo na receita pode não ser o preço efetivamente cobrado
- reconciliação financeira fica confusa
- update de preço vira duplicação de estratégia
- time futuro não saberá se o preço certo vem do banco, do `price_data` inline ou do `stripe_price_id`

### Decisão obrigatória

Escolher **uma** destas estratégias:

#### Estratégia A — Checkout com preço inline

- remover `productSync.ts`
- remover dependência de `stripe_product_id` / `stripe_price_id` para venda
- usar Stripe só como meio de cobrança e payout

#### Estratégia B — Catálogo Stripe canônico

- `stripe_product_id` / `stripe_price_id` passam a ser a verdade
- checkout deve usar `price: recipe.stripePriceId`
- sync precisa ser confiável e versionado

### Recomendação

Para este projeto, **Estratégia A** tende a ser mais simples e menos sujeita a bagunça, a menos que exista necessidade real de catálogo Stripe administrável.

---

## 2.7 Observabilidade e auditoria

### Está correto

- existem `payment_events`, `payment_notes`, `audit_logs`

### Problema estrutural

A rastreabilidade ainda está fragmentada.

### Risco futuro

- um incidente de pagamento exigirá abrir 3 tabelas e mesmo assim talvez falte contexto
- painel admin continuará cego para a vida real do webhook

### Correção obrigatória

- `payment_events` deve armazenar os eventos Stripe recebidos/relevantes
- `payment_orders.provider_event_id` deve apontar para o último evento relevante
- `provider_metadata_json` deve guardar snapshot mínimo útil
- `audit_logs` não deve substituir trilha canônica de evento de pagamento

---

# 3. O QUE PRECISA SER CORRIGIDO AGORA

## P0 — obrigatório antes de LIVE

1. alinhar `checkout/session.ts` à identidade real do comprador
2. alinhar `src/server/payments/repo.ts` ao schema real
3. alinhar `webhooks/stripe.ts` ao schema real
4. alinhar `src/server/identity/entitlements.repo.ts`
5. definir uma única fonte de verdade para grants pagos
6. implementar idempotência real de evento Stripe
7. registrar `payment_events` de forma canônica
8. parar de usar a rota errada `/api/payments/stripe/webhook`

## P1 — obrigatório para não virar bagunça em breve

9. decidir se o catálogo Stripe é real ou se será removido
10. remover uma das estratégias duplicadas: `price_data` inline vs `stripe_price_id`
11. centralizar regra de readiness do Connect
12. fazer o admin ler dados reais de evento/payment status
13. padronizar nomenclatura: payment order / payment event / entitlement / purchase

## P2 — melhora forte de arquitetura

14. mover regras Stripe para uma camada de domínio/serviço
15. criar testes de integração para checkout + webhook + entitlement
16. preparar fluxo de refund/revoke se isso existir no roadmap
17. criar runbook de incidentes de pagamento

---

# 4. DECISÕES DE ARQUITETURA RECOMENDADAS

## Decisão 1 — Fonte de verdade

- `payment_orders` = pedido/estado financeiro local
- `payment_events` = trilha de eventos externos
- `entitlements` = acesso liberado
- `stripe_connect_accounts` = estado de seller/connect

## Decisão 2 — Identidade do comprador

- `user_id` = UUID somente quando houver usuário autenticado
- `payerEmail` = sempre guardado em metadata
- grants podem usar email normalizado quando não houver user UUID, **mas isso precisa ser explícito**

## Decisão 3 — Catálogo

- ou remover `productSync.ts`
- ou fazer checkout usar `stripe_price_id`

**Não manter os dois caminhos ativos ao mesmo tempo.**

## Decisão 4 — Webhook

- handler fino
- lógica de negócio em serviço
- persistência de evento antes/depois do processamento conforme estratégia definida

---

# 5. TAREFA PRONTA PARA AGENTE EXECUTOR

## Agente principal

- **OpenCode**: correção estrutural do código

## Agente complementar

- **Antigravity**: validação de produção canônica, webhook e live cutover

## Arquivos já prontos para execução

- `IMPLANTAR/tasks/TASK-004-stripe-schema-webhook-align.md`
- `IMPLANTAR/tasks/TASK-006-canonical-prod-check.md`
- `IMPLANTAR/patches/`
- `IMPLANTAR/checklists/CHECKLIST-VALIDACAO-STRIPE-POS-PATCH-E-LIVE-2026-04-06.md`

---

# 6. CONCLUSÃO FINAL

## Resposta objetiva

**Não, o Stripe não está organizado de forma suficientemente correta para garantir que não vire bagunça depois.**

Ele tem base boa, mas hoje sofre de:

- drift entre código e banco
- duas estratégias de catálogo ao mesmo tempo
- identidade do comprador inconsistente
- grants e eventos sem modelo canônico forte

## O que fazer

O agente executor deve tratar essa integração como **refactor estrutural controlado**, não como ajuste pontual de env var ou webhook.

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
