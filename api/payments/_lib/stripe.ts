import Stripe from 'stripe';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-02-24.acacia',
  maxNetworkRetries: 2,
  timeout: 10000,
});

export function getAppUrl(): string {
  // Alinhado com a task STRIPE-001 que priorizou APP_BASE_URL
  return (process.env.APP_BASE_URL || getEnv('APP_URL')).replace(/\/$/, '');
}
