# 01 — Ordem de Execução

## Sequência obrigatória
1. Conter segredo exposto.
2. Congelar deploy manual até o gate ficar verde.
3. Corrigir todos os handlers no padrão novo de `withApiHandler`.
4. Normalizar role de sessão.
5. Rodar `npm run gate`.
6. Atualizar README e `.env.example`.
7. Endurecer CI/CD com secret scan, SAST e SBOM.
8. Implementar idempotência do webhook Stripe.
9. Criar artefatos `/backend`.
10. Preparar canário para mudanças críticas.

## Dependências
- TASK-002 depende de TASK-001.
- TASK-003 depende de TASK-002.
- TASK-004 depende de TASK-002.
- TASK-005 depende de TASK-002.
- TASK-006 depende de TASK-003 e validação das envs reais.
- TASK-007 depende de todas as anteriores.

## Gate obrigatório antes de deploy
```bash
npm run gate
```



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

