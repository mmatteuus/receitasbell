/**
 * EXEMPLO DE INTEGRAÇÃO: Rate Limiting em Rotas Sensíveis
 *
 * Este arquivo demonstra como integrar rate limiting nas rotas
 * do aplicativo. Use como referência para implementar em suas rotas.
 *
 * Arquivo: src/server/middleware/ratelimit-examples.ts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  loginRateLimit,
  passwordResetRateLimit,
  paymentRateLimit,
  getClientIdentifier,
  checkRateLimit,
} from './ratelimit.js';
import { json } from '../shared/http.js';

/**
 * EXEMPLO 1: Rate Limiting em Login Admin
 *
 * Implementar em: src/server/auth/handlers/admin-login.ts
 */
export async function exampleAdminLogin(request: VercelRequest, response: VercelResponse) {
  const { email } = request.body || {};

  // 1. Obter identificador do cliente
  const identifier = getClientIdentifier(request, email);

  // 2. Verificar rate limit
  const limit = await checkRateLimit(loginRateLimit, `admin-login:${identifier}`);

  if (!limit.success) {
    // Bloquear requisição
    response.setHeader('Retry-After', limit.retryAfter || 60);
    return json(response, 429, {
      error: 'Too many login attempts',
      message: `Please try again in ${limit.retryAfter} seconds`,
      retryAfter: limit.retryAfter,
    });
  }

  // 3. Continuar com autenticação normal
  console.log(`✅ Login attempt allowed for ${email}`);
  // ... resto do handler ...
}

/**
 * EXEMPLO 2: Rate Limiting em Reset de Senha
 *
 * Implementar em: src/server/auth/handlers/forgot-password.ts
 */
export async function exampleForgotPassword(request: VercelRequest, response: VercelResponse) {
  const { email } = request.body || {};

  // 1. Usar limite mais restritivo para forgot-password
  const identifier = getClientIdentifier(request, email);

  // 2. Verificar rate limit (3 tentativas em 1 hora)
  const limit = await checkRateLimit(passwordResetRateLimit, `forgot-password:${identifier}`);

  if (!limit.success) {
    return json(response, 429, {
      error: 'Too many password reset attempts',
      message: 'For security, you can only request password reset 3 times per hour',
      retryAfter: limit.retryAfter,
    });
  }

  // 3. Continuar com envio de email
  console.log(`✅ Password reset email allowed for ${email}`);
  // ... resto do handler ...
}

/**
 * EXEMPLO 3: Rate Limiting em Criação de Sessão de Pagamento
 *
 * Implementar em: src/server/payments/application/handlers/checkout/session.ts
 */
export async function exampleCreateCheckoutSession(
  request: VercelRequest,
  response: VercelResponse
) {
  const { email } = request.body || {};

  // 1. Obter identificador
  const identifier = getClientIdentifier(request, email);

  // 2. Verificar rate limit (10 requisições por minuto)
  const limit = await checkRateLimit(paymentRateLimit, `checkout:${identifier}`);

  if (!limit.success) {
    return json(response, 429, {
      error: 'Too many checkout attempts',
      message: 'You are creating checkouts too quickly. Please slow down.',
      retryAfter: limit.retryAfter,
    });
  }

  // 3. Continuar com criação de sessão
  console.log(`✅ Checkout session allowed for ${email}`);
  // ... resto do handler ...
}

/**
 * EXEMPLO 4: Rate Limiting com withApiHandler
 *
 * Se usando o wrapper withApiHandler, pode integrar assim:
 */
export async function exampleWithApiHandler(request: VercelRequest, response: VercelResponse) {
  // Aplicar rate limit no início do handler
  const email = request.body?.email;
  const identifier = getClientIdentifier(request, email);

  const limit = await checkRateLimit(loginRateLimit, `login:${identifier}`);

  if (!limit.success) {
    response.setHeader('Retry-After', limit.retryAfter || 60);
    return json(response, 429, {
      error: 'Rate limit exceeded',
      retryAfter: limit.retryAfter,
    });
  }

  // Prosseguir com lógica de autenticação
  return json(response, 200, {
    success: true,
    message: 'Login successful',
  });
}

/**
 * INSTRUÇÕES DE IMPLEMENTAÇÃO
 *
 * 1. Identificar rotas sensíveis:
 *    - /api/auth/login (login admin)
 *    - /api/auth/forgot-password (reset de senha)
 *    - /api/payments/checkout/session (criar sessão de pagamento)
 *    - /api/payments/webhooks/stripe (webhook - muito permissivo)
 *    - /pwa/login (login mobile)
 *
 * 2. Para cada rota, adicionar no início:
 *    ```typescript
 *    import { loginRateLimit, getClientIdentifier, checkRateLimit } from '../middleware/ratelimit';
 *
 *    const identifier = getClientIdentifier(request, email);
 *    const limit = await checkRateLimit(loginRateLimit, identifier);
 *
 *    if (!limit.success) {
 *      return json(response, 429, { error: 'Too many requests' });
 *    }
 *    ```
 *
 * 3. Testar localmente:
 *    ```bash
 *    # Fazer múltiplas requisições para verificar rate limit
 *    for i in {1..10}; do
 *      curl -X POST http://localhost:3000/api/auth/login \
 *        -H "Content-Type: application/json" \
 *        -d '{"email":"test@example.com","password":"test"}'
 *    done
 *    # Deve retornar 429 após 5 tentativas
 *    ```
 *
 * 4. Deploy e monitorar:
 *    - Verificar logs de rate limit em Sentry
 *    - Monitorar métricas de 429 responses
 *    - Ajustar limites conforme necessário
 */

/**
 * PRÓXIMAS MÉTRICAS A MONITORAR
 *
 * Adicionar em dashboard:
 * - Número de 429 responses por minuto
 * - Endpoints mais limitados
 * - IPs mais frequentes nos limits
 * - Padrões de ataque detectados
 */
