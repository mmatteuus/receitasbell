# Audit Findings: System Hardening (Março 2026)

## Execução do Plano de Limpeza
Cumprimos 100% dos objetivos do "Plano 10/10":
- [x] Limpeza de arquivos obsoletos (`health.ts`, `router.ts`).
- [x] Remoção de lógica legada de identidade baseada em email no cliente.
- [x] Padronização de erros HTTP para RFC 7807 (aprox).

## Melhorias Implementadas

### Segurança
1. **Sessões no Servidor**: Migramos da confiança cega no client para sessões persistidas no Baserow com TTL de 14 dias.
2. **CSRF**: Introduzimos validação de token em todos os métodos que alteram estado (`POST`, `PATCH`, `DELETE`).
3. **Assinatura de Webhook**: O sistema agora rejeita notificações do Mercado Pago que não venham com HMAC válido.

### Resiliência
1. **Idempotência**: Protegemos a criação de checkouts contra duplicidade de rede.
2. **Reconciliação Automática**: Um cron job garante que o status do Baserow reflita a realidade do Mercado Pago mesmo em caso de falha no webhook.
3. **Timeouts & Retries**: O client do Mercado Pago agora possui retries inteligentes para erros 5xx/429.

### Observabilidade
1. **Request ID**: Cada resposta da API carrega um ID único que é propagado para o log do servidor e UI.
2. **Audit Logs Full**: Ações críticas (auth, admin, pagamentos) agora geram traces auditáveis.

## Recomendações Futuras
- **WAF**: Ativar Vercel Firewall para o endpoint de webhooks em caso de ataque DoS volumétrico.
- **Sentry**: Integrar os logs estruturados existentes no Sentry para alertas em tempo real.
