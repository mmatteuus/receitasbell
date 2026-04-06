# TASK-005: Implementar Rate Limiting em Rotas Sensíveis

**STATUS**: `[PLANEJAMENTO]`
**PRIORIDADE**: P2 (MÉDIA)
**RESPONSÁVEL**: OpenCode
**ESTIMATIVA**: 60 minutos
**DATA**: 2026-04-06

---

## 🎯 OBJETIVO

Implementar rate limiting em rotas sensíveis (Pagamentos, Login, API) para proteger contra brute force, DoS e abuso.

## 📋 CONTEXTO

**Por que é importante?**

- Proteção contra brute force em login
- Proteção de API contra DoS
- Proteção de pagamento contra teste de cartão
- Conformidade de segurança

---

## 🔍 ANÁLISE DAS ROTAS

### Rotas Sensíveis Identificadas

**1. Autenticação**

- `/admin/login` - Login admin
- `/auth/reset-password` - Reset de senha
- `/admin/forgot-password` - Recuperação de senha

**2. Pagamentos**

- `/api/payments/checkout/session` - Criar sessão de pagamento
- `/api/payments/webhooks/stripe` - Webhook Stripe

**3. Perfil de Usuário**

- `/api/me/*` - Endpoints de perfil
- `/pwa/login` - Login PWA

### Limites Recomendados

| Rota                             | Limite          | Janela     | Razão               |
| -------------------------------- | --------------- | ---------- | ------------------- |
| `/admin/login`                   | 5 tentativas    | 15 minutos | Brute force         |
| `/admin/forgot-password`         | 3 tentativas    | 1 hora     | Vazamento de emails |
| `/api/payments/checkout/session` | 10 requisições  | 1 minuto   | Proteção de API     |
| `/api/payments/webhooks/stripe`  | 100 requisições | 1 minuto   | Webhook legítimo    |
| `/pwa/login`                     | 5 tentativas    | 15 minutos | Brute force mobile  |

---

## 🛠️ IMPLEMENTAÇÃO

### Tecnologia: `@upstash/ratelimit`

**Por quê Upstash?**

- ✅ Serverless (funciona com Vercel)
- ✅ Redis distribuído
- ✅ Sem gerenciamento de infra
- ✅ Pay-as-you-go
- ✅ Já está no projeto (verificar package.json)

### Passo 1: Verificar Dependência

```bash
grep -i "upstash" package.json
```

**Se não existir**:

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Passo 2: Criar Middleware de Rate Limiting

**Arquivo a criar**: `src/server/middleware/ratelimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiters específicos por rota
export const loginRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 req em 15 min
  analytics: true,
});

export const passwordRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 req em 1 hora
  analytics: true,
});

export const paymentRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req em 1 min
  analytics: true,
});

export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  const result = await limiter.limit(identifier);
  return result;
}
```

### Passo 3: Aplicar em Rotas

**Exemplo: Login Admin**

```typescript
// Em src/server/auth/handlers/login.ts
import { checkRateLimit, loginRateLimit } from '../middleware/ratelimit';

export default withApiHandler(async (request, response) => {
  // Obter IP ou email para identificar cliente
  const identifier = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
  const email = request.body?.email;

  // Check rate limit por email (mais específico)
  const key = `login:${email}`;
  const limit = await checkRateLimit(loginRateLimit, key);

  if (!limit.success) {
    return json(response, 429, {
      error: 'Too many login attempts',
      retryAfter: Math.ceil(limit.resetAfter / 1000),
    });
  }

  // Continuar com login...
});
```

### Passo 4: Aplicar em Checkout

```typescript
// Em src/server/payments/application/handlers/checkout/session.ts
import { checkRateLimit, paymentRateLimit } from '../middleware/ratelimit';

export default withApiHandler(async (request, response) => {
  const email = request.body?.email;

  // Check rate limit
  const limit = await checkRateLimit(paymentRateLimit, `payment:${email}`);

  if (!limit.success) {
    return json(response, 429, {
      error: 'Too many payment attempts. Please try again later.',
    });
  }

  // Continuar com checkout...
});
```

---

## 📊 EVIDÊNCIAS DE NECESSIDADE

### Risco de Brute Force

**Sem rate limiting**:

- Atacante pode fazer 10.000 tentativas por segundo
- Login admin vulnerável
- Senhas podem ser descobertas

**Com rate limiting**:

- Máximo 5 tentativas em 15 minutos
- Atacante precisaria de horas para descobrir senha
- Detectável por alertas

### Risco de DoS

**Sem rate limiting**:

- Checkout pode ser chamado 1000x/seg
- Banco de dados sobrecarrega
- Serviço fica indisponível

**Com rate limiting**:

- Máximo 10 requisições por minuto por usuário
- Protege banco de dados
- Serviço mantém disponibilidade

---

## 🔍 STATUS DOS RECURSOS

### Verificar Variáveis Ambiente

```bash
# Deve existir em .env.production.local
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

**Resultado esperado**: Ambas devem estar preenchidas (já estão no arquivo)

---

## ✅ IMPLEMENTAÇÃO PROPOSTA

### Fase 1: Criar Middleware (10 min)

- [ ] Arquivo `src/server/middleware/ratelimit.ts`
- [ ] 3 limiters: login, password, payment

### Fase 2: Integrar em Rotas (30 min)

- [ ] `/admin/login`
- [ ] `/admin/forgot-password`
- [ ] `/api/payments/checkout/session`
- [ ] `/pwa/login`

### Fase 3: Testar (15 min)

- [ ] Teste local com falsos requests
- [ ] Verificar 429 responses
- [ ] Verificar reset após janela

### Fase 4: Deploy (5 min)

- [ ] Build e deploy em produção
- [ ] Monitorar logs iniciais

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Documentação criada
2. ⏭️ Implementar middleware de rate limiting
3. ⏭️ Integrar em rotas sensíveis
4. ⏭️ Testar e validar
5. ⏭️ Deploy em produção

---

## 📚 REFERÊNCIAS

- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Brute_Force_Protection_Cheat_Sheet.html)

---

**Planejamento realizado por**: OpenCode - 2026-04-06
**Status**: Pronto para implementação
