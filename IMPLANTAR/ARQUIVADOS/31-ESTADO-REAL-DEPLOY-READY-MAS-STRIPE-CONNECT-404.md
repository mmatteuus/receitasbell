# Estado real — deploy READY, Stripe Connect ainda quebrado

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo

Corrigir o entendimento operacional atual e orientar o próximo ciclo do Executor com base no estado real validado.

---

## 2. FATO validado agora

### FATO 1 — o deploy mais recente está READY
O projeto Vercel `receitasbell` agora possui deployment de produção `READY`.

### FATO 2 — o domínio principal voltou
O projeto voltou a listar `receitasbell.vercel.app` nos domínios do projeto.

### FATO 3 — as rotas admin respondem
Foi validado que `/api/admin/auth/session` responde `200` no domínio final.

### FATO 4 — Stripe Connect continua quebrado em produção
Foi validado que `GET /api/payments/connect/status` no domínio final responde `404 NOT_FOUND`.

### FATO 5 — o backend de Connect existe no repositório
Arquivos confirmados no repositório:
- `api/payments/[...path].ts`
- `src/server/payments/router.ts`
- `src/server/payments/application/handlers/connect/account.ts`
- `src/server/payments/application/handlers/connect/onboarding-link.ts`
- `src/server/payments/application/handlers/connect/status.ts`

### FATO 6 — a tabela de persistência ainda está vazia
Consulta no Supabase validou que `public.stripe_connect_accounts` está sem registros.

---

## 3. Conclusão do Pensante

O estado real atual é este:

- deploy: `READY`
- admin auth: vivo
- Stripe Connect em produção: **ainda não funcional**
- banco de Connect: **sem registro persistido**

Logo, o problema atual do Stripe Connect **não está resolvido**.

---

## 4. Hipótese operacional mais forte

Como o domínio final responde em `/api/admin/*`, mas `/api/payments/connect/status` responde `404`, a falha atual mais provável é uma destas:

1. o build publicado não está expondo corretamente o namespace `/api/payments/*`
2. há desalinhamento entre o handler consolidado `api/payments/[...path].ts` e a forma como a Vercel está roteando a produção
3. o commit `READY` atual não contém a versão correta do backend de Connect que o barramento presume publicada

---

## 5. Próximo passo correto do Executor

Executar somente esta frente:

### Frente única
**validar e corrigir a exposição real das rotas `/api/payments/*` em produção, depois testar novamente o Stripe Connect.**

### Ordem obrigatória
1. confirmar no código atual da `main` se `api/payments/[...path].ts` e `src/server/payments/router.ts` estão corretos
2. validar localmente que `/api/payments/connect/status` resolve para o handler esperado
3. corrigir o menor delta que esteja impedindo o roteamento real em produção
4. rodar `npm run gate`
5. commitar na `main`
6. fazer push para `origin main`
7. acompanhar o novo deploy
8. testar em produção:
   - `/api/payments/connect/status`
   - `/api/payments/connect/account`
   - `/api/payments/connect/onboarding-link`
9. registrar tudo na pasta `IMPLANTAR/`

---

## 6. O que não fazer agora

- não mexer em banco além de leitura diagnóstica
- não mexer em domínio
- não mexer em imagens
- não abrir outra frente paralela
- não criar outro ramo

---

## 7. Critério de aceite

A rodada só passa se todos abaixo forem verdadeiros:

- `/api/payments/connect/status` deixa de retornar `404`
- `/api/payments/connect/account` deixa de retornar `404`
- `/api/payments/connect/onboarding-link` deixa de retornar `404`
- o resultado do teste em produção fica registrado
- houve commit
- houve push

---

## 8. Prompt pronto para o Executor

```text
Leia nesta ordem:
1. IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md
2. IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md
3. IMPLANTAR/00C-PADRAO-DE-RETORNO-CURTO.md
4. IMPLANTAR/00D-LIMPEZA-FINAL.md
5. IMPLANTAR/02B-PUSH-E-ACESSO-A-SERVICOS.md
6. IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
7. IMPLANTAR/STATUS-EXECUCAO.md
8. IMPLANTAR/CAIXA-DE-ENTRADA.md
9. IMPLANTAR/CAIXA-DE-SAIDA.md
10. IMPLANTAR/31-ESTADO-REAL-DEPLOY-READY-MAS-STRIPE-CONNECT-404.md

Voce e o Agente Executor.

Sua tarefa nesta rodada e executar somente esta frente:
validar e corrigir a exposicao real das rotas `/api/payments/*` em producao, depois testar novamente o Stripe Connect.

Objetivo:
- eliminar o `404` atual em `/api/payments/connect/status`
- validar as rotas reais de Connect em producao
- registrar tudo na pasta `IMPLANTAR/`
- fazer commit e push ao final

Voce deve:
1. revisar `api/payments/[...path].ts`
2. revisar `src/server/payments/router.ts`
3. validar localmente o roteamento de `/api/payments/connect/status`
4. corrigir o menor delta necessario
5. rodar `npm run gate`
6. commitar na `main`
7. fazer push para `origin main`
8. acompanhar o novo deploy da Vercel
9. testar em producao:
   - `/api/payments/connect/status`
   - `/api/payments/connect/account`
   - `/api/payments/connect/onboarding-link`
10. atualizar `IMPLANTAR/STATUS-EXECUCAO.md`
11. atualizar `IMPLANTAR/CAIXA-DE-SAIDA.md`
12. atualizar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
13. deixar o `RETORNO CURTO`
14. parar no final

Nesta rodada, nao fazer:
- nao mexer em dominio
- nao abrir outra frente
- nao criar outro ramo
- nao mexer em imagens

Criterio de aceite:
- as rotas de Connect deixam de retornar `404` em producao
- o resultado fica registrado em `IMPLANTAR/`
- houve commit
- houve push
```
