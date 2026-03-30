# Compliance assessment

Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Escopo
Fluxo de pagamentos, dados de comprador, conta conectada e auditoria operacional.

## LGPD
### Dados pessoais mapeados
- email do comprador
- identificadores do usuário
- ids de pagamento
- ids de conta conectada
- IP e user-agent em logs técnicos, se presentes

### Regras
- não armazenar dados bancários brutos do administrador no Baserow
- não armazenar documentos de identificação brutos no Baserow
- persistir somente IDs, estados, capabilities e requirements
- mascarar PII em logs
- manter trilha de auditoria para connect, checkout, webhook, refund e disconnect

## Retenção
- pedidos: conforme obrigação operacional/financeira
- eventos técnicos: retenção mínima necessária
- logs de auditoria: retenção mais longa que logs de aplicação
- material sensível bruto: **não persistir**

## Riscos
- persistência indevida de payloads completos de webhook
- logging acidental de segredos/PII
- campos de conexão com semântica ambígua

## Ações obrigatórias
- redaction automática em logs
- revisão de payloads persistidos em `payment_events`
- política de retenção documentada
- endpoint/processo de anonimização quando aplicável
