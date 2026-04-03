# Caixa de Entrada do ciclo atual

> Somente o Agente Pensante deve abrir a proxima instrucao aqui.
> Cada mensagem deve autorizar apenas um passo.

---

## MSG-IN-DEPLOY-0001

**Destino**: executor  
**Trigger de saida esperado**: EXECUTOR_DONE_AWAITING_REVIEW  
**Passo autorizado**: DEPLOY-FIX-0001  
**Objetivo**: corrigir o erro atual de deploy da Vercel atacando a causa validada pelo Pensante  

**Arquivo-base desta rodada**:
- `IMPLANTAR/28-AUDITORIA-DEPLOY-VERCEL-E-PLANO-DE-CORRECAO.md`

**Instrucao exata**:
1. ler integralmente `IMPLANTAR/28-AUDITORIA-DEPLOY-VERCEL-E-PLANO-DE-CORRECAO.md`
2. editar `vercel.json`
3. trocar `"installCommand": "npm install"` por `"installCommand": "npm ci --include=dev"`
4. salvar
5. commitar na `main`
6. fazer push para `origin main`
7. acompanhar o novo deploy da Vercel
8. registrar o resultado em `IMPLANTAR/STATUS-EXECUCAO.md`
9. registrar o resultado em `IMPLANTAR/CAIXA-DE-SAIDA.md`
10. atualizar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
11. deixar o `RETORNO CURTO` padronizado
12. parar no final

**Arquivos que podem ser alterados nesta rodada**:
- `vercel.json`
- `IMPLANTAR/STATUS-EXECUCAO.md`
- `IMPLANTAR/CAIXA-DE-SAIDA.md`
- `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`

**Nao fazer nesta rodada**:
- nao mexer em banco
- nao mexer em dominio
- nao mexer em auth admin
- nao mexer em imagens
- nao mexer em Stripe
- nao abrir outra frente
- nao criar outro ramo

**Criterio de aceite**:
- `vercel.json` ajustado na `main`
- commit realizado
- push realizado
- novo deploy acompanhado
- o erro antigo `eslint: command not found` deixa de acontecer
- resultado registrado na pasta `IMPLANTAR/`

**Se falhar**:
- marcar `EXECUTOR_DONE_AWAITING_REVIEW`
- registrar o novo erro exato
- nao prosseguir para outra frente
