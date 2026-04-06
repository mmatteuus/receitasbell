# Sistema de Monitoramento Automático

> Status: ✅ ATIVO

## 🔍 Configuração

**Agent**: Claude Code (Haiku 4.5)  
**Intervalo**: A cada 5 minutos  
**Job ID**: `a4c16a80`  
**Tipo**: Recorrente (7 dias, auto-expira)

## 📋 O que é monitorado

1. **TAREFAS_PENDENTES.md**
   - Novas tarefas marcadas como `[EM EXECUÇÃO - ...]`
   - Tarefas concluídas que precisam ser movidas para HISTORICO_CONCLUIDO.md
   - Mudanças nas prioridades (P1, P2, P3)

2. **CAIXA-DE-ENTRADA.md**
   - Novas mensagens `MSG-IN-*`
   - Ordens diretas de agentes
   - Instruções de Antigravity

3. **CONTEXTO_AGERIAL.md**
   - Mudanças no registro de atividades
   - Novos bloqueios ou estado

4. **HEARTBEAT.json**
   - Status de atividade
   - Último agente ativo

## 🚀 Ações Automáticas

Quando detectadas novas tarefas, Claude Code irá:

1. ✅ Ler a instrução completa
2. ✅ Verificar o contexto em CONTEXTO_AGERIAL.md
3. ✅ Registrar `[EM EXECUÇÃO - Claude Code]` na tarefa
4. ✅ Executar a tarefa conforme instruído
5. ✅ Rodar `npm run gate` para validar
6. ✅ Atualizar documentação
7. ✅ Fazer commits com as mudanças
8. ✅ Registrar na CAIXA-DE-SAIDA.md

## ⏰ Timeline

- **Próxima verificação**: +5 minutos
- **Auto-expira em**: 7 dias
- **Renovar**: Pedir ao usuário para reiniciar

---

_Criado em: 2026-04-06_  
_Monitoramento iniciado: Claude Code_
