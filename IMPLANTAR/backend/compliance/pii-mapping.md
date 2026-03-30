# PII mapping

| Campo | Tipo | Store | Retenção | Observação |
|---|---|---|---|---|
| buyerEmail | contato | Payment_Orders | operacional | mascarar em logs |
| userId | identificador | Payment_Orders/Entitlements | operacional | uso interno |
| stripe_account_id | identificador técnico | stripe_connect_accounts | operacional | não é dado bancário bruto |
| provider_event_id | identificador técnico | payment_events | operacional | sem PII direta |
| IP / user-agent | técnico | logs/audit | mínima necessária | mascarar quando aplicável |
