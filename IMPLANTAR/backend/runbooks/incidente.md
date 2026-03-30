# Incidente

## Papéis
- IC: coordena
- Comms Lead: comunica
- Ops Lead: executa mitigação

## Severidade
- P0: pagamento indisponível ou compra sem concessão
- P1: atraso relevante ou erro parcial
- P2: degradação controlada

## Passos iniciais
1. congelar deploys
2. identificar se o problema é checkout, webhook, connect ou storage
3. validar logs por `payment_order_id` e `provider_event_id`
4. decidir rollback ou mitigação
5. registrar incidente e horário de início

## Critério de rollback
- error rate > 0.5% sustentado
- checkout sem URL
- webhook sem processamento confiável
- entitlement duplicando ou não sendo criado
