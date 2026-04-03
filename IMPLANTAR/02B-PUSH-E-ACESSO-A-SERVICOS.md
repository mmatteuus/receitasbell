# Push obrigatório e acesso a serviços

Projeto: Receitas Bell  
Assinatura: Desenvolvido por MtsFerreira — mtsferreira.dev

---

## 1. Regra obrigatória de conclusão de rodada

Se o Agente Executor alterar qualquer arquivo do repositório ou da pasta `IMPLANTAR/`, ele deve obrigatoriamente:

1. salvar os arquivos
2. registrar evidências na pasta `IMPLANTAR/`
3. fazer commit objetivo
4. fazer push para `origin main`
5. somente depois encerrar a rodada

Sem push, a rodada deve ser considerada **incompleta**.

---

## 2. Sequência obrigatória

```bash
git status
git add <arquivos alterados>
git commit -m "<mensagem objetiva da rodada>"
git push origin main
```

---

## 3. Regra de mensagem de commit

A mensagem deve ser curta e refletir a tarefa concluída.

Exemplos válidos:
- `fix: corrigir gate da vercel`
- `fix: restaurar rotas de stripe connect em produção`
- `docs: registrar evidência da rodada`

---

## 4. Acesso autorizado do Executor

O Agente Executor está autorizado a usar, quando a fase exigir:

- navegador real
- GitHub
- Vercel
- Supabase
- Stripe
- arquivos locais do repositório
- logs e evidências operacionais

---

## 5. Regra de espelhamento

Toda mudança relevante feita fora do código local deve ser refletida em:

- `IMPLANTAR/STATUS-EXECUCAO.md`
- `IMPLANTAR/CAIXA-DE-SAIDA.md`
- `IMPLANTAR/ESTADO-ORQUESTRACAO.yaml` quando aplicável

Depois disso, o Executor deve commitar e fazer push.

---

## 6. Critério de aceite da rodada

Uma rodada só é considerada realmente concluída quando:

- evidências foram registradas
- arquivos foram atualizados
- existe `RETORNO CURTO`
- houve commit
- houve push para `main`

---

## 7. Regra final

O Executor não deve trabalhar apenas localmente.

Ao concluir qualquer tarefa com mudança real:
- registrar
- commitar
- fazer push na `main`
- parar no final
