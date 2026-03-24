# Checklist de Deploy - Receitas Bell

Este documento descreve o fluxo de deploy seguro para os ambientes de Preview e Produção.

## 1. Ambientes
- **Preview**: Gerado automaticamente para cada Pull Request. Usado para validação funcional e smoke tests.
- **Produção**: Branch `main`. Usada pelos usuários finais.

## 2. Checklist Pré-Deploy (Produção)
- [ ] Validação funcional em ambiente de **Preview**.
- [ ] Verificar se todas as variáveis de ambiente críticas estão configuradas na Vercel.
- [ ] Garantir que o `SENTRY_DSN` e `CRON_SECRET` estejam presentes.
- [ ] Validar integração com Mercado Pago em modo Sandbox (se houver alterações no fluxo).
- [ ] Executar testes de fumaça localmente: `npm run test:smoke`.

## 3. Fluxo de Deploy
1. Abrir Pull Request contra a branch `main`.
2. Validar o deployment de Preview gerado pela Vercel.
3. Merge na `main` dispara o deploy de Produção.
4. Validar o Health Check de produção: `https://meu-app.vercel.app/api/health`.

## 4. Verificação Pós-Deploy
- [ ] Acessar `/api/health` e verificar se todos os checks estão `true`.
- [ ] Verificar logs da Vercel em busca de erros 500 inesperados.
- [ ] Confirmar recepção de e-mails de teste (se aplicável).
