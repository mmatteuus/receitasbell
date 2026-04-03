# Caixa de Saida do Executor e do Verificador

> O Executor responde aqui.
> O Verificador auxiliar, se existir, responde aqui em bloco separado.
> Nao apagar historico.

---

## TEMPLATE DO EXECUTOR

```md
## MSG-OUT-XXXX
**Origem**: executor
**Relacionado a**: MSG-IN-XXXX
**Status**: EXECUTOR_DONE_AWAITING_REVIEW | BLOCKED | ROLLBACK_REQUIRED
**Passo**: PASSO-X
**Comandos executados**:
```bash
# comandos aqui
```
**Arquivos tocados**:
- lista aqui
**Evidencias**:
```text
# evidencias aqui
```
**Resultado observado**: ...
**Bloqueios**: nenhum | listar
**Sugestao de proximo passo**: apenas 1

### RETORNO CURTO — PASSO X
Feito: <o que foi concluido em uma frase objetiva>.
Estado: <APROVADO | BLOQUEADO | FALHOU | AGUARDANDO REVISAO>.
Proximo passo: <o que precisa ser feito agora, em uma frase objetiva>.
Responsavel agora: <executor | pensante | verificador>.
```

---

## TEMPLATE DO VERIFICADOR

```md
## MSG-VERIFY-XXXX
**Origem**: verificador
**Relacionado a**: MSG-OUT-XXXX
**Status**: CONFERE | DIVERGE | EVIDENCIA_INSUFICIENTE
**Analise**: ...
**Pontos confirmados**:
- ...
**Pontos duvidosos**:
- ...
**Recomendacao ao Pensante**: APROVAR | PEDIR AJUSTE | ROLLBACK

### RETORNO CURTO — VERIFICADOR
Feito: <o que foi revisado em uma frase objetiva>.
Estado: <CONFERE | DIVERGE | EVIDENCIA_INSUFICIENTE>.
Proximo passo: <o que o Pensante deve decidir agora>.
Responsavel agora: pensante.
```

---

## HISTORICO

_Aguardando a primeira resposta do Executor para `MSG-IN-DEPLOY-0001`._
