# 02 — Compliance Assessment

## Escopo regulatório
- LGPD
- GDPR apenas se houver titulares da UE
- retenção mínima auditável
- trilha de auditoria para ações sensíveis

## Dados identificados
**FATO**
- email
- IP
- user-agent
- user_id
- tenant_id
- dados de compra
- identificadores de pagamento

## Lacunas
1. Não há artefato formal de PII mapping no projeto auditado.
2. Não há política explícita de retenção observada.
3. Não há fluxo formal documentado de exclusão/anomização.
4. Não há evidência de audit log schema separado.

## Requisitos mínimos
1. Criar `backend/compliance/pii-mapping.md`
2. Criar `backend/compliance/data-retention-policy.md`
3. Criar `backend/compliance/audit-log-schema.json`
4. Definir rotina de exclusão ou anonimização
5. Garantir masking de PII em logs

## Classificação preliminar
| Item | Status |
|---|---|
| Mapeamento PII | NOK |
| Retenção | NOK |
| Deleção | NOK |
| Mascaramento em logs | NOK parcial |
| Audit logging formal | NOK |



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

