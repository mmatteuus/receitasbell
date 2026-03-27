# Hardening Audit Score (Atualizado)

Este score foi ajustado para refletir o estado real do código, sem superestimar controles que ainda estão em rollout.

## Resumo

| Critério | Peso | Nota | Status |
| :--- | :--- | :--- | :--- |
| Build & Typecheck | 2.5 | 2.0 | Parcialmente validado |
| Testes críticos de pagamento | 2.5 | 1.8 | Em evolução |
| Infra & headers de borda | 2.5 | 1.8 | Hardening parcial |
| Mercado Pago multi-tenant real | 2.5 | 2.0 | Fluxo principal implementado, validação contínua |
| **Média** | **10.0** | **7.6** | **Boa evolução, ainda não final** |

## Notas de precisão

- O projeto já possui base sólida para OAuth por tenant e roteamento seller-aware de checkout/webhook/reconcile.
- A proteção de headers de borda foi atualizada, porém CSP está em `Report-Only` por segurança de rollout.
- A documentação e o score devem permanecer alinhados com testes e evidências executadas no ambiente de CI.
