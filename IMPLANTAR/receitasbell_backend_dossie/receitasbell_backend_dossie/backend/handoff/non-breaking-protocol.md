# Protocolo de Não-Quebra

## Checklist obrigatório por mudança
- [ ] Mudança aditiva primeiro
- [ ] Feature flag para mudança de comportamento
- [ ] Testes baseline antes
- [ ] Testes depois
- [ ] Rollback em 1 comando
- [ ] Canary quando crítico
- [ ] Monitor pós-deploy
- [ ] Snapshot antes de mudança destrutiva
- [ ] Compatibilidade retroativa preservada

## Flags previstas
- `ff_auth_role_normalization`
- `ff_stripe_webhook_v2`
