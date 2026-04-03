# Reauditoria do estado real e proximo passo

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo

Registrar o estado real atual do projeto depois da nova rodada de auditoria e corrigir o entendimento do barramento operacional.

---

## 2. FATO — o que esta errado agora

### FATO 1 — o barramento esta desatualizado
O arquivo `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml` ainda descreve o projeto como `Stripe Connect Estabilizado` e `EXECUTOR_DONE_AWAITING_REVIEW`, mas a producao atual na Vercel continua em `ERROR`.

### FATO 2 — o erro antigo mudou
O erro anterior `eslint: command not found` deixou de ser o bloqueio principal.

Foi validado que o deploy mais recente agora executa com:
- `installCommand`: `npm install --include=dev`
- lint: OK
- typecheck: OK
- build: OK
- falha atual: `vitest run`

### FATO 3 — o bloqueio atual de deploy sao 2 testes falhando
Os testes que derrubam o deploy agora sao:

1. `tests/session-fallback.test.ts`
2. `src/components/layout/PublicLayout.test.tsx`

---

## 3. Diagnostico tecnico atual

### Teste 1 — `tests/session-fallback.test.ts`
Falha atual:
- `expected null to deeply equal { tenantId: 'tenant-1', ... }`

Leitura tecnica:
- o teste espera que `getSession()` recupere a sessao estateless criada no fallback
- a implementacao atual retorna `null`
- o problema agora esta no fluxo real de `createSession()` / `getSession()` em `src/server/auth/sessions.ts`

### Teste 2 — `src/components/layout/PublicLayout.test.tsx`
Falha atual:
- `act(...) is not supported in production builds of React`

Leitura tecnica:
- o teste de acessibilidade do layout publico esta rodando em uma configuracao que cai no build de React de producao
- isso estoura no uso de `@testing-library/react` + `cleanup()` / `act()`
- o problema agora nao e deploy da Vercel em si, mas suite de testes quebrando o gate dentro da Vercel

---

## 4. Conclusao do Pensante

O estado correto agora e este:

- Vercel continua em `ERROR`
- o pipeline avanca mais do que antes
- o erro de `eslint` foi superado
- o bloqueio atual e teste automatizado
- o barramento oficial ainda nao reflete essa verdade

---

## 5. Proximo passo correto do Executor

O Executor deve fazer somente esta frente:

### Frente unica
**corrigir os 2 testes que quebram o gate e repetir o deploy**

### Ordem obrigatoria
1. corrigir `tests/session-fallback.test.ts` ou a implementacao de `src/server/auth/sessions.ts` para o fallback funcionar de verdade
2. corrigir `src/components/layout/PublicLayout.test.tsx` e/ou `tests/setup-vitest.ts` para o teste nao cair no erro de `act(...)` em build de producao
3. rodar localmente:
   - `npm run test:unit`
   - `npm run gate`
4. commitar na `main`
5. fazer push para `origin main`
6. acompanhar o novo deploy da Vercel
7. registrar tudo na pasta `IMPLANTAR/`

---

## 6. O que nao fazer agora

- nao mexer em banco
- nao mexer em dominio
- nao mexer em auth admin funcional em producao
- nao mexer em imagens
- nao mexer em Stripe alem do necessario para o gate passar
- nao criar outro ramo
- nao abrir nova frente paralela

---

## 7. Prompt pronto para o Executor

```text
Leia nesta ordem:
1. IMPLANTAR/00-ORQUESTRACAO-ENTRE-AGENTES.md
2. IMPLANTAR/00B-GATILHOS-DE-CONVERSA.md
3. IMPLANTAR/00C-PADRAO-DE-RETORNO-CURTO.md
4. IMPLANTAR/00D-LIMPEZA-FINAL.md
5. IMPLANTAR/ESTADO-ORQUESTRACAO.yaml
6. IMPLANTAR/STATUS-EXECUCAO.md
7. IMPLANTAR/CAIXA-DE-ENTRADA.md
8. IMPLANTAR/CAIXA-DE-SAIDA.md
9. IMPLANTAR/30-REAUDITORIA-ESTADO-REAL-E-PROXIMO-PASSO.md

Voce e o Agente Executor.

Sua tarefa nesta rodada e executar somente esta frente:
**corrigir os 2 testes que estao quebrando o gate e repetir o deploy.**

Objetivo:
- remover o bloqueio atual do `vitest run`
- fazer `npm run gate` passar
- disparar novo deploy na `main`
- registrar tudo na pasta `IMPLANTAR/`

Voce deve:
1. corrigir `tests/session-fallback.test.ts` ou a implementacao de `src/server/auth/sessions.ts` para o fallback de sessao funcionar de verdade
2. corrigir `src/components/layout/PublicLayout.test.tsx` e/ou `tests/setup-vitest.ts` para o teste nao cair no erro `act(...) is not supported in production builds of React`
3. rodar `npm run test:unit`
4. rodar `npm run gate`
5. commitar na `main`
6. fazer push para `origin main`
7. acompanhar o novo deploy da Vercel
8. atualizar `IMPLANTAR/STATUS-EXECUCAO.md`
9. atualizar `IMPLANTAR/CAIXA-DE-SAIDA.md`
10. atualizar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
11. deixar o `RETORNO CURTO`
12. parar no final

Nesta rodada, nao fazer:
- nao mexer em banco
- nao mexer em dominio
- nao mexer em imagens
- nao criar outro ramo
- nao abrir outra frente

Criterio de aceite:
- `npm run test:unit` passa
- `npm run gate` passa
- o novo deploy chega mais longe ou entra em `READY`
- resultado registrado em `IMPLANTAR/`
```
