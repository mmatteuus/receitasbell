# Proxima correcao oficial do deploy

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Fato

O deploy falha no fim por limite de funcoes do plano Hobby da Vercel.

## Causa alvo

A proxima funcao a ser eliminada sem quebrar a aplicacao e `api/payments/webhook.ts`.

## Acao oficial do executor

1. Manter a rota externa de webhook funcionando.
2. Migrar o tratamento do webhook para o catch-all de pagamentos.
3. Preservar o funcionamento do checkout.
4. Remover a funcao dedicada `api/payments/webhook.ts`.
5. Rodar `npm run gate`.
6. Fazer push na `main`.

## Regras de nao-quebra

- nao quebrar a rota externa do webhook
- nao quebrar checkout
- nao mexer no admin
- nao criar novas funcoes
- se o gate falhar, registrar o bloqueio em `IMPLANTAR/20`

## Criterio de aceite

- gate ok
- deploy sem erro de limite Hobby
- aplicacao preservada
