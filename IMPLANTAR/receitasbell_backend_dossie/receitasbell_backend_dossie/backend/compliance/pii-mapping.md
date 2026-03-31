# PII Mapping

| Campo | Tipo | Local | Retenção | Observação |
|---|---|---|---|---|
| email | contato | sessions / auth / compras | definir | mascarar em logs |
| ip | identificador | auth_sessions | definir | evitar retenção excessiva |
| user_agent | identificador | auth_sessions | definir | mascarar quando não necessário |
| user_id | identificador interno | auth / compras | vida útil da conta | técnico |
| tenant_id | identificador interno | auth / catálogo / compras | vida útil operacional | técnico |
| provider_payment_id | financeiro | pagamentos | definir por obrigação legal | auditável |
