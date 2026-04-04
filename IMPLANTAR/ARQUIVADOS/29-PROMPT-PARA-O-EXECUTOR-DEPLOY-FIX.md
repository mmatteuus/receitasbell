# Prompt pronto para o Executor — correção do deploy

Copiar e colar exatamente isto no agente executor:

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
9. IMPLANTAR/28-AUDITORIA-DEPLOY-VERCEL-E-PLANO-DE-CORRECAO.md

Voce e o Agente Executor.

Sua tarefa nesta rodada e executar somente o passo autorizado em `IMPLANTAR/CAIXA-DE-ENTRADA.md`.

Contexto principal ja validado pelo Pensante:
- o deploy atual da Vercel esta falhando antes de publicar
- o erro atual validado e `eslint: command not found`
- o `package.json` usa `eslint` em `devDependencies`
- o `vercel.json` atual usa `installCommand: npm install`
- a menor correcao reversivel e trocar para `installCommand: npm ci --include=dev`

Objetivo:
- aplicar a correcao minima no `vercel.json`
- commitar e fazer push na `main`
- acompanhar o novo deploy
- registrar tudo na pasta `IMPLANTAR/`

Regra dura:
- nao abrir outra frente
- nao criar outro ramo
- nao mexer em banco
- nao mexer em dominio
- nao mexer em auth admin
- nao mexer em imagens
- nao mexer em Stripe

Ao terminar:
- atualizar `IMPLANTAR/STATUS-EXECUCAO.md`
- atualizar `IMPLANTAR/CAIXA-DE-SAIDA.md`
- atualizar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
- deixar o `RETORNO CURTO`
- parar no final
```
