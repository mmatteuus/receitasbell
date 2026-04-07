# Diretório — Front-End

**Objetivo:** consolidar todas as tarefas, status e handoffs do time de Front-End (web + PWA) em um único lugar dentro de `IMPLANTAR/`. Cada subtarefa nesta pasta referencia o código correspondente em `src/`, as prioridades vigentes e os arquivos de acompanhamento (CAIXA-DE-ENTRADA/SAÍDA, TAREFAS_PENDENTES etc.).

## 📂 Estrutura

| Arquivo            | Descrição                                                                               |
| ------------------ | --------------------------------------------------------------------------------------- |
| `STATUS-FRONT.md`  | Quadro-resumo com todos os itens críticos do Front (ID, prioridade, status, owner).     |
| `TASKS-FRONT.md`   | Detalhamento de cada item (contexto, resultado entregue, próximos passos).              |
| _(novos arquivos)_ | Adicione dossiês específicos (ex.: `FRONT-SEO.md`, `FRONT-PWA.md`) conforme necessário. |

## 🔝 Prioridades atuais

1. **FRONT-004 — Validação de convites admin** (bloqueia onboarding do time do cliente)
2. **FRONT-005 — SEO final do app/pwa** (P3 em TAREFAS_PENDENTES, depende de ajustes finais)
3. **FRONT-006 — Checklist de insights PWA** (experiência de instalação e uso offline)

Itens **FRONT-001 a FRONT-003** foram concluídos (rota tenant, recuperação de senha, CTA de instalação PWA) e documentados aqui para referência rápida.

## ✅ Como trabalhar nesta pasta

1. **Antes de começar:**
   - Ler `STATUS-FRONT.md` e verificar se o item desejado está `🟢 PRONTO` ou `🟡 EM EXECUÇÃO`.
   - Se estiver livre, atualizar o status para `⏳ EM PROGRESSO` e adicionar seu nome + timestamp.
2. **Durante a execução:**
   - Atualizar `TASKS-FRONT.md` com decisões técnicas relevantes.
   - Registrar bloqueios em `IMPLANTAR/03-BLOQUEIOS.md`.
3. **Ao concluir:**
   - Atualizar o item para `✅ CONCLUÍDO`.
   - Referenciar commits/PRs e mover o item para o histórico adequado (se aplicável).

## 🔗 Referências rápidas

- `IMPLANTAR/CAIXA-DE-ENTRADA.md` — Prioridades definidas pelo orquestrador.
- `IMPLANTAR/CAIXA-DE-SAIDA.md` — Evidências entregues para Antigravity.
- `IMPLANTAR/TAREFAS_PENDENTES.md` — Lista macro (Front aparece em P1/P3).
- `src/pages/` / `src/components/` / `src/pwa/` — Código alvo das tarefas.

---

**Mantido por:** OpenCode — atualizado em 2026-04-06.
