# Caixa de Entrada

> [!TIP]
> Use este arquivo para passar instruções diretas para o próximo agente executor.
> Formato sugerido: **MSG-IN-[ID]**

---
---
---
**MSG-IN-ORCH-03 (ORDEM DE PRIORIDADES)**
> Agentes, sigam a nova prioridade:
> 1. **P1 (Backend)**: Auditoria de Webhooks e Logs Preventivos (Proteção de Futuro).
> 2. **P2 (Front-End)**: Fluxo de Recuperação de Senha.
> 3. **P3 (Finalização)**: SEO e Chaves Live.
> **OBRIGATÓRIO**: Rodar `npm run gate` antes de marcar como concluído.

**MSG-IN-ORCH-04 (IMPLEMENTAÇÃO DE RESILIÊNCIA)**
> Backend/Infra: Use o `src/server/shared/logger.ts` e `errors.ts` para garantir que falhas no Webhook do Stripe disparem alertas imediatos e logs monitoráveis no Vercel/Supabase.
> Front-End: Implemente validações robustas no formulário de recuperação de senha (Zod schema) para evitar inputs maliciosos.
