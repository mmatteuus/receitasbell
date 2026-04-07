# Dossie de Riscos Auth e Jobs

Data: 2026-04-07
Status: auditoria parcial

## Riscos identificados

### 1. Cron auth aceita secret por query string
- Origem: `src/server/shared/http.ts`
- Risco: segredo em URL pode vazar em logs, historico e observabilidade
- Status: nao corrigido ainda
- Acao sugerida: manter apenas `Authorization: Bearer <CRON_SECRET>` e remover fallback por query

### 2. readJsonBody mascara JSON invalido
- Origem: `src/server/shared/http.ts`
- Risco: cliente manda JSON invalido e o backend responde como se fosse body vazio
- Efeito: erros inconsistentes, validacao quebrada, diagnostico pior
- Status: nao corrigido ainda
- Acao sugerida: retornar 400 explicito para JSON invalido

### 3. Routing inconsistente
- Origem: `vercel.json` e catch-all routers
- Risco: operador muda rewrite e quebra rota que dependia de filesystem routing
- Status: documentado
- Acao sugerida: padronizar estrategia de roteamento apos estabilizar Stripe

## Correcao ja aplicada nesta rodada
- OAuth callback nao depende mais obrigatoriamente de `tenantId` na query
- redirectTo do OAuth foi saneado

## Prioridade
- P1 depois do Stripe em producao
