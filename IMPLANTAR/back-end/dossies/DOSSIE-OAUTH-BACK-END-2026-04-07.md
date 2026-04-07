# Dossie OAuth Back-end

Data: 2026-04-07
Status: correcao aplicada no main

## Problema encontrado
1. O callback social exigia `tenantId` na query.
2. O fluxo de start OAuth nao garantia esse `tenantId` na volta do provedor.
3. O `redirectTo` salvo no state podia carregar valor nao saneado para o redirect final.

## Correcao aplicada
- o callback passou a aceitar ausencia de `tenantId` na query
- o tenant agora pode ser resolvido a partir do state salvo no banco
- o `redirectTo` passou a ser saneado para caminho interno

## Impacto evitado
- quebra do login social em producao
- acoplamento fragil ao query string de callback
- risco de redirect indevido ao finalizar o fluxo

## Arquivos corrigidos
- `api_handlers/auth/oauth-callback.ts`
- `src/server/auth/social/service.ts`

## Commit
- `1c7beb72d4ebec223e5f250db0595bc0cc7a703b`
