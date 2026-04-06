# PRD — Recuperação do Stripe Connect em produção

Projeto: `mmatteuus/receitasbell`  
Branch obrigatória: `main`  
Ambiente principal: produção na Vercel  
Status atual: admin funcional, Stripe Connect quebrado por ausência de rotas backend.

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

---

## 1. Objetivo

Restabelecer o fluxo Stripe Connect ponta a ponta sem quebrar o projeto atual.

O executor deve:
1. Implementar os endpoints ausentes do Stripe Connect.
2. Persistir e sincronizar o estado da conta conectada no Supabase.
3. Validar onboarding, refresh, retorno e leitura de status.
4. Publicar na `main`.
5. Validar em produção.

---

## 2. Problema confirmado

Os seguintes endpoints chamados pelo frontend retornam `404` em produção:

- `POST /api/payments/connect/account`
- `POST /api/payments/connect/onboarding-link`

Conclusão operacional: o frontend aponta para rotas que não existem no backend atualmente implantado.

---

## 3. Escopo incluído

Incluído:
- criação de conta Connect Express
- criação de account link de onboarding
- refresh flow do onboarding
- retorno do onboarding com leitura de status
- sincronização com `public.stripe_connect_accounts`
- endpoint de leitura do status da conta conectada
- webhook `account.updated`
- documentação de env e validação

Fora de escopo neste passo:
- checkout marketplace completo
- split de taxa da plataforma
- payout customization avançada
- embedded components

---

## 4. Resultado esperado

Ao final da execução, o seguinte fluxo deve funcionar:

1. admin clica em conectar Stripe
2. backend cria ou reutiliza conta Connect Express
3. backend cria link de onboarding
4. admin é redirecionado ao Stripe
5. ao retornar, backend lê `charges_enabled`, `details_submitted`, `payouts_enabled`
6. estado é salvo em `public.stripe_connect_accounts`
7. webhook mantém estado sincronizado

---

## 5. Restrições duras

- não criar branch
- não alterar domínio principal
- não quebrar autenticação admin já estabilizada
- não remover rotas existentes
- não sobrescrever envs sem conferir nomes
- não expor segredos no repositório
- toda mudança deve ser aditiva primeiro

---

## 6. Dados operacionais confirmados

- Stripe account id: `acct_1T4JaqCXD5Lwt8YN`
- Stripe display name: `Área restrita de New business`
- Stripe dashboard API keys: `https://dashboard.stripe.com/acct_1T4JaqCXD5Lwt8YN/apikeys`
- Supabase URL: `https://ixfwvaszmngbyxrdiaha.supabase.co`
- Vercel team: `team_eSrpVaqo7ajxagf5Fl4YcH3A`
- Vercel project: `prj_j1CPT7Y6j9ezx26rifAfrl29x9GE`
- Vercel project name: `receitasbell`
- Runtime Vercel: Node `20.x`
- Build command atual: `npm run gate`

---

## 7. Critério de aceite final

O PRD só é considerado concluído quando:

- `POST /api/payments/connect/account` retorna `200`
- `POST /api/payments/connect/onboarding-link` retorna `200`
- `GET /api/payments/connect/status` retorna status persistido
- tabela `public.stripe_connect_accounts` contém registro do tenant
- retorno do onboarding não quebra o painel
- webhook recebe `account.updated`
- deploy em produção fica `READY`

---

## 8. Risco principal

Risco atual: médio.  
Motivo: as rotas do Stripe Connect inexistem; ao adicionar endpoints, há risco baixo de regressão porque a mudança é aditiva.

Mitigação:
- não alterar auth atual
- não alterar endpoints antigos de pagamento
- adicionar somente novas rotas e sincronização
- validar com curl antes de testar no frontend

---

## 9. Decisão de trilha

Trilha escolhida: **TRILHA B — Evoluir existente**

Justificativa:
- o produto já roda
- admin já autentica
- problema atual é ausência parcial de backend específico
- solução correta é completar a integração existente sem redesenhar a aplicação
