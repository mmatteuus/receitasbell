# Status Real — Correção do Deploy na Vercel

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## FATO confirmado agora

A remoção das rotas duplicadas de Connect em `/api/payments/connect/` já está refletida na `main`.

Confirmações objetivas:
- `api/payments/connect/account.ts` não existe mais na `main`
- `api/payments/connect/onboarding-link.ts` não existe mais na `main`
- o projeto continua com a função agregadora `api/payments/[...path].ts`
- o roteamento interno continua em `src/server/payments/router.ts`

---

## O que isso significa

A correção cirúrgica principal para reduzir a contagem de funções já foi aplicada no repositório.

Portanto, o erro original de excesso de funções:

```text
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

não deve mais ser analisado como se o repositório ainda estivesse no estado antigo com as rotas duplicadas.

---

## Estado operacional novo

### Resolvido no código
- rotas duplicadas de Connect removidas da camada `/api`
- reaproveitamento do catch-all de pagamentos mantido

### Ainda pendente
- verificar o erro do deploy mais recente após essa limpeza
- confirmar se o limite do plano Hobby foi realmente eliminado
- se ainda houver erro, capturar a nova causa real

---

## Regra a partir daqui

Não repetir a análise antiga do deploy como se os arquivos duplicados ainda existissem.

A partir deste ponto, toda nova auditoria deve considerar:
- o código já foi enxugado
- o próximo erro pode ser outro

---

## Próximo passo oficial

1. capturar o log do deploy mais recente
2. identificar a falha atual real
3. só então decidir a próxima correção

---

## Decisão do Pensante

Ação já considerada executada no código:
- correção cirúrgica mínima de redução de funções duplicadas

Próximo foco:
- auditar o último deployment depois dessa correção
