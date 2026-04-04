# Padrão Obrigatório de Fechamento e Push do Executor

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Regra permanente

Sempre que o Executor terminar a lista de tarefas liberadas no ciclo atual, ele deve obrigatoriamente:

1. atualizar o status final das tasks no arquivo de planejamento
2. registrar o que foi feito no arquivo de execução
3. registrar o que não foi feito e por quê, se houver
4. fazer o commit final do ciclo
5. fazer o `push` para a `main`
6. registrar a evidência do push dentro de `IMPLANTAR/19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`

Sem `push`, o ciclo não está encerrado.

---

## Regra de encerramento

O Executor só pode declarar o lote de tasks como encerrado quando estes itens forem verdadeiros:

- tasks liberadas estão com status atualizado
- resultado está escrito em `IMPLANTAR/19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`
- bloqueios estão escritos em `IMPLANTAR/20-BLOQUEIOS-E-NAO-EXECUTADO.md`, se existirem
- commit final foi criado
- `push` foi executado

---

## Regra para push obrigatório

Depois de concluir a execução do lote atual, o Executor deve rodar:

```bash
git add .
git commit -m "exec: conclui lote atual de tarefas"
git push origin main
```

Se o repositório já estiver com commit preparado, o Executor deve ajustar apenas a mensagem, mas o `push` continua obrigatório.

---

## Evidência mínima do push

O Executor deve registrar no `IMPLANTAR/19-REGISTRO-DE-EXECUCAO-DO-EXECUTOR.md`:

- mensagem do commit
- branch usada
- confirmação de `push` concluído
- hash do commit final, quando disponível
- se houve deploy automático depois do push, registrar também o deployment id ou o status

---

## Template obrigatório para fechamento do lote

Adicionar no final do bloco do Executor:

```md
### FECHAMENTO DO LOTE
- Commit final criado: SIM | NAO
- Mensagem do commit:
- Branch usada: main
- Push executado: SIM | NAO
- Hash final do commit:
- Deploy disparado após push: SIM | NAO
- Evidência do push:
```

---

## Se não conseguir fazer push

Se o Executor não conseguir fazer `push`, ele deve obrigatoriamente registrar em `IMPLANTAR/20-BLOQUEIOS-E-NAO-EXECUTADO.md`:

- motivo técnico
- comando tentado
- erro retornado
- impacto de ficar sem push
- o que o Pensante precisa decidir

Sem isso, o retorno do Executor está incompleto.

---

## Regra de autoridade

Este padrão vale para todos os ciclos futuros do Executor dentro de `IMPLANTAR/`.

Sempre que houver dúvida de encerramento, considerar:
- sem `push` = execução não finalizada
