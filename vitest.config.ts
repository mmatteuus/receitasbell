import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    execArgv: ['--max-old-space-size=4096'],
    disableConsoleIntercept: true,
    setupFiles: ['tests/setup-vitest.ts'],
    clearMocks: true,
    restoreMocks: true,
    env: {
      APP_BASE_URL: 'http://localhost:3000',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-supabase-service-role-key',
      SUPABASE_ANON_KEY: 'mock-supabase-anon-key',
      CRON_SECRET: 'mock-cron-secret',
      RESEND_API_KEY: 'mock-resend-key',
      APP_COOKIE_SECRET: 'mock-cookie-secret-very-long-and-secure-123456',
      ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
      ADMIN_API_SECRET: 'mock-admin-secret',
      STRIPE_WEBHOOK_SECRET: 'mock-stripe-webhook-secret',
      STRIPE_CLIENT_ID: 'ca_mock_client_id',
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_REDIRECT_URI: 'http://localhost:3000/api/payments/connect/callback',
    },
  },
});
