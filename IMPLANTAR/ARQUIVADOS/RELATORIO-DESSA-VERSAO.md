# Relatório de Bloqueios e Dúvidas — Receitas Bell

**Projeto:** Receitas Bell  
**Data:** 2026-04-02  
**Status:** BLOCKED (Aguardando instruções do Planejador)

---

## 1. O Arquivo Ausente (P0)

Fomos instruídos a ler o arquivo `IMPLANTAR/16-PROMPT-CURTO-EXECUTOR-STRIPE.md`, mas ele não existe no repositório atual. O histórico do Git (`commit f0f41db`) menciona um prompt de Stripe Connect, mas o arquivo físico está ausente da branch `main`.

- **Dúvida para o Planejador:** Onde está o conteúdo deste arquivo? Existe uma branch secundária ou o conteúdo deve ser enviado via chat?
- **O que precisa ser feito:** O Planejador deve fornecer as instruções exatas do "Passo 16" para prosseguirmos com a integração do Stripe.

## 2. Falha de Autenticação Admin (P0)

Embora a infraestrutura (CSRF, cookies e rotas) esteja validada e funcional, as credenciais `admin@receitasbell.com` / `TroqueAgora!123#` resultam em código `401 Unauthorized` no ambiente de produção da Vercel.

RELATORIO-DESSA-VERSAO.md [PENDENTE]
> [!NOTE]
> STATUS: PENDENTE - Aguardando resposta do Agente Planejador.

- **Dúvida para o Planejador:** Existe alguma restrição de IP, mudança de senha recente ou problema de sincronização de role (`owner`) que precisamos saber?
- **O que precisa ser feito:** Confirmar as credenciais vigentes ou autorizar a execução do script `fix-admin-receitasbell.mjs` diretamente contra o banco de produção para garantir o alinhamento.

## 3. Divergência de Domínio/Host (P1)

O banco de dados aponta o tenant principal para `receitasbell.vercel.app`, mas a Vercel está servindo o projeto em `receitasbell-matdev.vercel.app`.

- **Dúvida para o Planejador:** Qual o domínio definitivo? Devemos atualizar o banco (Estratégia B) ou restaurar o domínio na Vercel (Estratégia A)?
- **O que precisa ser feito:** Decidir o domínio oficial e autorizar a sincronização entre Vercel e o campo `host` na tabela `organizations`.

## 4. Configurações de Stripe e Pagamentos (P1)

As variáveis de ambiente `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` não estão presentes no `.env` analisado, e os IDs de produtos/preços para o ambiente de produção não foram fornecidos.

- **Dúvida para o Planejador:** Quais são os IDs de preços/produtos do Stripe para os tenants atuais? Como o Stripe Connect deve ser mapeado em relação ao multi-tenancy?
- **O que precisa ser feito:** Fornecer os segredos do Stripe ou autorizar a entrada na fase de configuração de pagamentos com dados reais.

## 5. Limpeza de Ambiente (P2)

Há 3 tenants ativos no banco (`default`, `receitasbell` e `receitasbell-preview`), o que causa ambiguidade na resolução automática (fallback).

- **Dúvida para o Planejador:** Podemos desativar os tenants `default` e `preview` em produção?
- **O que precisa ser feito:** Autorizar o SQL de desativação para deixar apenas o tenant `receitasbell` como ativo e único.

## 6. Pipeline de CI/CD e Qualidade (P3)

A branch `main` não possui um workflow de GitHub Actions ativo, o que permite pushes diretos sem validação automática (lint, typecheck, tests).

- **Dúvida para o Planejador:** Existe um template de CI preferido ou devemos criar um do zero seguindo o padrão mestre?
- **O que precisa ser feito:** Autorizar a criação de `.github/workflows/ci.yml`.

---

### Resumo para o Agente Planejador/Pensante

Para que o Executor possa retomar a velocidade de implantação, precisamos prioritariamente:
1. Do **conteúdo do arquivo 16** (Stripe).
2. Da **confirmação de credenciais** para encerrar o Passo de Login Admin.
3. Da **definição do domínio oficial** para alinhar Vercel e Supabase.

Aguardando retorno para atualização do `ESTADO-ORQUESTRACAO.yaml`.
