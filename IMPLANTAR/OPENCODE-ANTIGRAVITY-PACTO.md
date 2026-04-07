# 🤝 Pacto de Colaboração OpenCode ↔ Antigravity

**Data:** 2026-04-06  
**Contexto:** Backend Stripe + Supabase realignment  
**Objetivo:** Trabalho paralelo sem bloqueios

---

## QUEM FAZ O QUÊ

### OpenCode (Claude Code)
**Papel:** AGENTE 2 — EXECUTOR DE CÓDIGO

**Responsabilidades:**
- Executar TASK-004 completa
- Implementar correções no código
- Validar testes e build
- Produzir código pronto para produção

**Entrada:**
- TASK-004-stripe-schema-webhook-align.md
- Schema real do Supabase
- Código atual em `/src/server/payments`

**Saída:**
- Código compilado e testado
- Branch com PR pronta para merge
- Validação de todos os critérios de aceite

**Duração estimada:** ~4h de trabalho concentrado

---

### Antigravity (ChatGPT)
**Papel:** AGENTE 1 — ARQUITETO PENSANTE

**Responsabilidades:**
- Executar TASK-006 (canonical prod check)
- Validar configuração real de Stripe
- Preparar webhook corretamente
- Documentar estado da produção real

**Entrada:**
- TASK-006-canonical-prod-check.md
- Credenciais Stripe
- Configuração Vercel

**Saída:**
- Documento com env vars corretas
- Webhook pronto (`whsec_...`)
- Confirmação que tudo está preparado

**Duração estimada:** ~2h de validações

---

## FLUXO SEQUENCIAL (SEM BLOQUEIOS)

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: Preparação Paralela (T+0 até T+6h)             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  OpenCode:                 Antigravity:                  │
│  └─ Analisa schema         └─ Valida produção           │
│  └─ Planeja fixes          └─ Prepara webhook           │
│  └─ Inicia TASK-004        └─ Documenta estado          │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FASE 2: Execução (T+6h até T+10h)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  OpenCode:                 Antigravity:                  │
│  └─ Implementa repo.ts     └─ Aguarda TASK-004 OK      │
│  └─ Corrige webhook        └─ Prepara cutover LIVE      │
│  └─ Testa tudo             └─ Valida checklist          │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FASE 3: Cutover (T+10h)                                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  TASK-004 ✅  +  TASK-006 ✅  →  SINAL VERDE PARA LIVE │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## COMUNICAÇÃO

### Regra de Ouro
- **OpenCode** não pede permissão a Antigravity
- **Antigravity** não pede código a OpenCode
- Ambos **só se comunicam via documentação** (este arquivo)

### Canais de Comunicação
1. **IMPLANTAR/CAIXA-DE-SAIDA.md** — para notificações de conclusão
2. **IMPLANTAR/03-BLOQUEIOS.md** — se algo inesperado aparecer
3. **IMPLANTAR/tasks/** — status de cada task

### Checkpoints
- ✅ OpenCode: TASK-004 100% completa e testada
- ✅ Antigravity: TASK-006 100% validada
- ✅ Ambos: Aviso em CAIXA-DE-SAIDA quando prontos

---

## CRITÉRIOS DE NÃO-QUEBRA

### OpenCode NUNCA vai
- Fazer deploy para produção
- Mudar valores em `.env.production.local`
- Deletar colunas ou tabelas
- Assumir que webhook está correto antes de TASK-006 ✅

### Antigravity NUNCA vai
- Tomar decisões de arquitetura de código
- Fazer merge de PR
- Alterar rotas ou métodos HTTP

---

## CHECKLIST DE EXECUÇÃO

### OpenCode — Antes de Iniciar
- [ ] Ler TASK-004 completo
- [ ] Mapear schema real vs. código atual
- [ ] Listar todas as mudanças necessárias
- [ ] Não fazer nada até entender tudo

### OpenCode — Durante Execução
- [ ] Manter branch limpa (1 commit por mudança lógica)
- [ ] Validar `npm run lint`, `npm run typecheck`, `npm run build`
- [ ] Testar cada mudança antes de mover para próxima
- [ ] Documentar desvios em IMPLANTAR/03-BLOQUEIOS.md

### OpenCode — Antes de "Completo"
- [ ] [ ] npm run test:unit passa
- [ ] [ ] Checkout funciona com schema real
- [ ] [ ] Webhook funciona com schema real
- [ ] [ ] Idempotência validada
- [ ] [ ] PR criada com descrição clara

### Antigravity — Antes de Iniciar TASK-006
- [ ] Ler TASK-006 completo
- [ ] Validar acesso a credenciais Stripe
- [ ] Validar acesso a Vercel

### Antigravity — Durante TASK-006
- [ ] Não fazer changes no repositório
- [ ] Apenas documentar estado atual
- [ ] Anotar qualquer surpresa

### Antigravity — Antes de "Completo"
- [ ] Webhook endpoint pronto
- [ ] Env vars documentadas
- [ ] Plano de cutover claro

---

## O QUE ACONTECE SE FALHAR?

### Se OpenCode falhar em TASK-004
1. Documentar erro em IMPLANTAR/03-BLOQUEIOS.md
2. `git revert HEAD` (volta último commit bom)
3. Restart de TASK-004 com ajuste
4. **Antigravity segue seu caminho normalmente**

### Se Antigravity falhar em TASK-006
1. Documentar bloqueio em IMPLANTAR/03-BLOQUEIOS.md
2. Marcar TASK-006 como BLOCKED
3. **OpenCode segue seu caminho normalmente** (código fica pronto)
4. Cutover fica pausado até TASK-006 ✅

---

## PRÓXIMAS FASES (Não são responsabilidade deste pacto)

Depois de TASK-004 ✅ + TASK-006 ✅:

1. **Antigravity** retoma TASK-001 (cutover LIVE)
2. **OpenCode** executa TASK-005 (rate limiting e hardening)
3. Agentes especializados (3-8) entram em paralelo

---

## ASSINATURA

```
OpenCode  → Claude Code (EXECUTOR)
Antigravity → ChatGPT (ARQUITETO)

Pacto formalizado: 2026-04-06
Próximo checkpoint: Após TASK-004 ✅
```

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)
