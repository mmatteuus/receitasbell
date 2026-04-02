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
```

---

## HISTORICO

_Aguardando a primeira resposta do Executor para o PASSO-1._
