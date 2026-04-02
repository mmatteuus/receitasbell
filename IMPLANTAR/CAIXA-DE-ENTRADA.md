# Caixa de Entrada do ciclo atual

> Somente o Agente Pensante deve abrir a proxima instrucao aqui.
> Cada mensagem deve autorizar apenas um passo.

---

## MSG-IN-0001

**Destino**: executor  
**Trigger de saida esperado**: EXECUTOR_DONE_AWAITING_REVIEW  
**Passo autorizado**: PASSO-1  
**Objetivo**: confirmar dominio final e host do tenant principal  

**Instrucao exata**:
1. identificar o tenant principal em `public.organizations`
2. registrar o `slug`, `host` e `is_active` do tenant principal
3. identificar os dominios atuais configurados no projeto da Vercel
4. registrar qual dominio esta sendo usado como principal no momento
5. comparar host do tenant e dominios atuais da Vercel
6. registrar se existe alinhamento ou divergencia
7. nao alterar codigo
8. nao alterar banco
9. nao fazer deploy neste passo

**Arquivos que podem ser alterados neste passo**:
- `IMPLANTAR/CAIXA-DE-SAIDA.md`
- `IMPLANTAR/STATUS-EXECUCAO.md`
- `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`

**Nao fazer neste passo**:
- nao mudar variavel de ambiente
- nao trocar dominio na Vercel
- nao editar `public.organizations`
- nao rodar recovery de admin
- nao abrir novo passo

**Criterio de aceite**:
- tenant principal identificado
- host atual identificado
- dominios Vercel identificados
- divergencia ou alinhamento documentado com evidencias

**Se falhar**:
- marcar `BLOCKED`
- explicar exatamente o bloqueio
- nao prosseguir
