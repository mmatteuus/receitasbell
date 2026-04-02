# Regra Permanente — Branch Única

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Regra absoluta

Neste projeto, o Executor e o Pensante **não podem trabalhar em outro ramo**.

A única branch permitida para execução operacional é:

```text
main
```

---

## Proibição explícita

É proibido:
- criar branch nova
- usar branch temporária
- usar branch de teste
- usar branch de correção
- usar branch paralela
- usar fork como fluxo de execução

Qualquer execução fora da `main` está fora do padrão oficial do projeto.

---

## Regra para o Executor

O Executor deve sempre:

1. trabalhar somente na `main`
2. fazer commit somente na `main`
3. fazer push somente para `origin main`
4. registrar no arquivo de execução que a branch usada foi `main`

---

## Regra para fechamento do lote

O fechamento do lote só é válido se constar:

```md
- Branch usada: main
- Push executado: SIM
```

Se a branch não for `main`, a execução deve ser considerada inválida.

---

## Regra de auditoria

Se o Executor usar qualquer branch diferente de `main`, ele deve registrar em `IMPLANTAR/20-BLOQUEIOS-E-NAO-EXECUTADO.md`:

- qual branch usou
- por que usou
- por que descumpriu a regra
- impacto operacional
- como vai corrigir voltando tudo para a `main`

---

## Regra final

Neste projeto:

**sem branch paralela**  
**sem fluxo alternativo**  
**sem exceção operacional**  
**somente `main`**
