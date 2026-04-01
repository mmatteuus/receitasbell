import { expect, test } from '@playwright/test';
import { openRoute, tenantSlug } from './helpers';

test.describe('admin access', () => {
  test('tenant-aware admin payments route redirects to tenant login preserving redirect', async ({
    page,
  }) => {
    await openRoute(page, '/admin/pagamentos/configuracoes');

    await expect(page).toHaveURL(
      new RegExp(
        `/t/${tenantSlug}/admin/login\\?redirect=.*%2Ft%2F${tenantSlug}%2Fadmin%2Fpagamentos%2Fconfiguracoes`
      )
    );
  });

  test('plain admin payments aliases redirect to plain login preserving redirect', async ({
    page,
  }) => {
    await openRoute(page, '/admin/pagamentos/transacoes', { tenantSlug: null });
    await expect(page).toHaveURL(/\/admin\/login\?redirect=.*%2Fadmin%2Fpagamentos%2Ftransacoes/);

    await openRoute(page, '/admin/financeiro/transacoes', { tenantSlug: null });
    await expect(page).toHaveURL(/\/admin\/login\?redirect=.*%2Fadmin%2Ffinanceiro%2Ftransacoes/);
  });
});
