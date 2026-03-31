# Execução Final para o Executor

Siga na ordem exata.

1. Rotacione a credencial exposta e remova o arquivo sensível do repositório.
2. Rode `grep -R "withApiHandler(request, response" -n api api_handlers src || true`.
3. Corrija todos os handlers no padrão HOF novo.
4. Crie `normalizeSessionRole` e remova fallback `"member"`.
5. Rode `npm run gate`.
6. Corrija o que restar até `npm run gate` ficar verde.
7. Atualize `README.md` e `.env.example` para refletir Supabase, Stripe e dependências reais.
8. Endureça `.github/workflows/ci.yml` com secret scan, SAST e SBOM.
9. Implemente idempotência do webhook Stripe com persistência de `event.id`.
10. Troque `console.*` por logger estruturado nos handlers críticos.
11. Crie e preencha toda a árvore `/backend`.
12. Execute smoke em preview.
13. Faça rollout em canário.
14. Se error rate subir acima do tolerado, reverta imediatamente.
15. Registre evidências em commit e PR.

## Rollback 1 comando
```bash
git revert HEAD
git push origin main
```



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

