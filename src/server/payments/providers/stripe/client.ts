import Stripe from 'stripe';
import { env } from '../../../shared/env.js';

const stripeSecretKey = env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required for Stripe server handlers.');
}

// Inicializar cliente do Stripe
export const stripeClient = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
  timeout: 10000, // 10 segundos
  maxNetworkRetries: 3, // Retentativas automáticas em falhas de rede
  appInfo: {
    name: 'Receitasbell',
    version: '1.0.0',
  },
});
