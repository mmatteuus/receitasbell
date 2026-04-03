# Auditoria do deploy Vercel e plano de correcao

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Objetivo

Registrar o que foi validado de forma objetiva sobre o erro atual de deploy e deixar a menor correcao reversivel pronta para o Agente Executor aplicar na `main`.

---

## 2. FATO

### FATO 1 — o deploy atual falha antes da aplicacao publicar
Projeto Vercel atual:
- projeto: `receitasbell`
- framework: `vite`
- node: `20.x`
- ultimo deployment de producao: `ERROR`

### FATO 2 — o erro atual do build e este
No build da Vercel, a sequencia validada foi:
1. `Running "install" command: npm install`
2. `Running "npm run gate"`
3. `> eslint .`
4. `sh: line 1: eslint: command not found`
5. `Error: Command "npm run gate" exited with 127`

### FATO 3 — o repositório confirma a causa tecnica
No `package.json`, o `eslint` esta em `devDependencies`.

No `vercel.json`, a configuracao atual e:

```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run gate"
}
```

---

## 3. CONCLUSAO DO PENSANTE

O bloqueio atual do deploy **nao** e:
- Supabase
- dominio
- Stripe
- auth admin
- plano gratis em si

O bloqueio atual do deploy e:

**pipeline de build da Vercel entrando em `npm run gate` sem garantir a instalacao correta das dependencias de desenvolvimento exigidas pelo lint.**

---

## 4. MENOR CORRECAO REVERSIVEL

Trocar apenas o `installCommand` no `vercel.json`:

### Antes
```json
"installCommand": "npm install"
```

### Depois
```json
"installCommand": "npm ci --include=dev"
```

### Trecho final esperado
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "devCommand": "vite --port $PORT",
  "installCommand": "npm ci --include=dev",
  "buildCommand": "npm run gate"
}
```

---

## 5. POR QUE ESTA E A CORRECAO CERTA AGORA

- e a menor mudanca possivel
- nao mexe em banco
- nao mexe em dominio
- nao mexe em auth
- nao abre nova frente
- ataca exatamente o erro atual validado
- e facil de reverter

---

## 6. O QUE O EXECUTOR DEVE FAZER NESTA RODADA

Executar somente esta frente:

1. editar `vercel.json`
2. trocar `npm install` por `npm ci --include=dev`
3. salvar
4. commitar na `main`
5. fazer push para `origin main`
6. acompanhar o novo deploy da Vercel
7. registrar o resultado em `IMPLANTAR/STATUS-EXECUCAO.md`
8. registrar o resultado em `IMPLANTAR/CAIXA-DE-SAIDA.md`
9. atualizar `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml`
10. parar no final

---

## 7. COMANDOS EXATOS PARA O EXECUTOR

```bash
git checkout main
git pull origin main
python - <<'PY'
from pathlib import Path
p = Path('vercel.json')
s = p.read_text(encoding='utf-8')
old = '"installCommand": "npm install"'
new = '"installCommand": "npm ci --include=dev"'
if old not in s:
    raise SystemExit('installCommand esperado nao encontrado em vercel.json')
p.write_text(s.replace(old, new, 1), encoding='utf-8')
print('OK: vercel.json atualizado')
PY
git add vercel.json
git commit -m "fix: install devDependencies no build da vercel"
git push origin main
```

---

## 8. VALIDACAO OBRIGATORIA DEPOIS DO PUSH

O Executor deve acompanhar o deployment novo e verificar:

### Sinal esperado no log
```text
Running "install" command: `npm ci --include=dev`...
```

### Sinal que nao pode mais aparecer
```text
sh: line 1: eslint: command not found
```

---

## 9. SAIDAS POSSIVEIS DA RODADA

### Saida A — sucesso parcial esperado
- o erro `eslint: command not found` desaparece
- o build avanca para a etapa real seguinte
- se aparecer novo erro, registrar o novo erro exato

### Saida B — sucesso total
- o build passa
- o deployment entra em `READY`
- registrar URL final e status final

### Saida C — falha diferente
- o erro muda
- registrar exatamente qual novo erro apareceu
- nao abrir nova frente antes da validacao do Pensante

---

## 10. O QUE NAO FAZER NESTA RODADA

- nao mexer em banco
- nao mexer em dominio
- nao mexer em auth admin
- nao mexer em imagens quebradas
- nao mexer em Stripe
- nao abrir outra frente paralela
- nao criar branch nova

---

## 11. CRITERIO DE ACEITE

Esta rodada so sera considerada aprovada se todos abaixo forem verdadeiros:

- `vercel.json` foi alterado na `main`
- houve commit
- houve push
- o novo deploy foi acompanhado
- o erro antigo `eslint: command not found` deixou de acontecer
- o resultado foi registrado em `IMPLANTAR/STATUS-EXECUCAO.md`
- o resultado foi registrado em `IMPLANTAR/CAIXA-DE-SAIDA.md`
- o `RETORNO CURTO` foi preenchido

---

## 12. RETORNO CURTO ESPERADO DO EXECUTOR

```md
### RETORNO CURTO — DEPLOY VERCEL
Feito: `vercel.json` ajustado na `main`, commit e push realizados, novo deploy acompanhado.
Estado: AGUARDANDO REVISAO.
Proximo passo: o Pensante deve validar se o erro antigo sumiu e decidir a proxima correcao ou aprovacao.
Responsavel agora: pensante.
```
