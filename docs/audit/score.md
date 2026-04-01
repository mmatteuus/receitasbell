# Hardening Audit Score (Atualizado)

Este score foi ajustado para refletir o estado real do código, sem superestimar controles que ainda estão em rollout.

## Resumo

| Critério                     | Peso     | Nota    | Status                       |
| :--------------------------- | :------- | :------ | :--------------------------- |
| Build & Typecheck            | 2.5      | 2.5     | Validado                     |
| Testes críticos de pagamento | 2.5      | 2.2     | Cobertura boa                |
| Infra & headers de borda     | 2.5      | 2.2     | Hardening consistente        |
| Fluxo Stripe multi-tenant    | 2.5      | 2.3     | Operacional                  |
| **Média**                    | **10.0** | **9.2** | **Estado atual consistente** |

## Notas de precisão

- O projeto possui base sólida para Stripe Connect por tenant e webhook assinado.
- A proteção de headers de borda foi atualizada, porém CSP está em `Report-Only` por segurança de rollout.
- A documentação e o score devem permanecer alinhados com testes e evidências executadas no ambiente de CI.
