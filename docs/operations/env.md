# Variáveis de Ambiente Operacionais

Guia de configuração para os ambientes da aplicação.

## Variáveis Críticas (Sustentação)
| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `CRON_SECRET` | Chave de autenticação para os Jobs (Headers/Query) | `super-secret-uuid-or-string` |
| `SENTRY_DSN` | URL de integração com o Sentry | `https://x@sentry.io/y` |
| `NODE_ENV` | Ambiente de execução | `production`, `preview`, `development` |
| `APP_BASE_URL` | URL base para geração de links Absolute/OAuth | `https://receitasbell.com.br` |

## Integrações Externas
| Variável | Descrição |
| :--- | :--- |
| `BASEROW_API_TOKEN` | Token de acesso à API do Baserow |
| `BASEROW_API_URL` | URL da API do Baserow (padrão: api.baserow.io) |
| `RESEND_API_KEY` | Chave de API do serviço de e-mail Resend |
| `MERCADO_PAGO_CLIENT_ID` | Client ID para OAuth do Mercado Pago |
| `MERCADO_PAGO_CLIENT_SECRET` | Secret para OAuth do Mercado Pago |

## IDs de Tabelas (Baserow)
Garantir que os IDs das tabelas em Produção coincidam com as variáveis:
- `BASEROW_TABLE_TENANTS`
- `BASEROW_TABLE_RECIPES`
- `BASEROW_TABLE_PAYMENTS`
- ... (demais listadas no `src/server/integrations/baserow/client.ts`)
