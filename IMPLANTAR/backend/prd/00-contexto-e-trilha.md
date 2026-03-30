# Contexto e trilha

Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Objetivo
Consolidar **Stripe** como **única provedora de pagamento ponta a ponta**, remover **todo** o legado de Mercado Pago do código, do runtime, do `vercel.json`, das variáveis de ambiente, dos webhooks, dos jobs e da operação.

## Escopo
- checkout
- connect onboarding do administrador
- catálogo de produtos/preços na Stripe
- webhook Stripe
- storage de pedidos/eventos
- concessão de acesso
- observabilidade
- deploy, rollback e operação

## Fora do escopo
- redesign de frontend fora do fluxo de compra
- mudança de stack
- mudança de provedor de banco
- replatforming geral do projeto

## Trilha escolhida
**TRILHA B — Evoluir existente**

## Justificativa
Há fluxo de pagamento existente, storage operacional e integração Stripe parcial. A abordagem correta é:
1. tornar Stripe a única fonte de verdade;
2. remover Mercado Pago em fases curtas;
3. preservar integridade dos pedidos já existentes;
4. limpar o runtime e a operação ao final.

## Decisões congeladas
- provider oficial: **Stripe**
- branch operacional única: **main**
- uma pasta canônica para pagamentos: **`src/server/payments/**`**
- webhook oficial: **Stripe**
- reconcile: **manual/admin-only**, nunca cron contínuo
- onboarding: **admin-only**
- modelo Connect recomendado: **Custom + hosted/embedded onboarding + destination charges**

## FATO
- o `vercel.json` atual ainda carrega legado Mercado Pago e cron de reconcile legado.
- o core do checkout atual ainda usa Mercado Pago.
- a camada Stripe já existe para conexão por tenant, mas não como checkout ponta a ponta.

## SUPOSIÇÃO
- o tenant principal operará com uma conta recebedora Stripe Connect.
- o checkout atual é para venda de itens unitários/receitas em BRL.

## [PENDENTE]
- validar na conta Stripe usada em produção se o modo Connect pretendido está habilitado para o país da operação.
