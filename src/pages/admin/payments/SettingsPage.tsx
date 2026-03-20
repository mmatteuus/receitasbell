import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/app-context';
import { getAdminPaymentSettings } from '@/lib/api/payments';
import { updateSettings } from '@/lib/api/settings';
import type { AdminPaymentSettingsResponse } from '@/types/payment';

type PaymentFlags = {
  payment_mode: 'sandbox' | 'production';
  webhooks_enabled: boolean;
  payment_topic_enabled: boolean;
};

export default function SettingsPage() {
  const { settings, refreshSettings } = useAppContext();
  const [form, setForm] = useState<PaymentFlags>({
    payment_mode: 'sandbox',
    webhooks_enabled: true,
    payment_topic_enabled: true,
  });
  const [adminSettings, setAdminSettings] = useState<AdminPaymentSettingsResponse | null>(null);
  const [loadingAdminSettings, setLoadingAdminSettings] = useState(true);

  useEffect(() => {
    setForm({
      payment_mode: settings.payment_mode,
      webhooks_enabled: settings.webhooks_enabled,
      payment_topic_enabled: settings.payment_topic_enabled,
    });

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('error') === 'mp_not_configured') {
        toast.error('Erro de Integração', {
          description: 'Configure MP_CLIENT_ID e MP_CLIENT_SECRET na Vercel para liberar a conexão com o Mercado Pago.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('error') === 'mp_oauth_failed') {
        toast.error('Não foi possível autenticar com o Mercado Pago.', {
          description: 'Revise as credenciais do app e tente novamente.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('error') === 'mp_missing_code') {
        toast.error('Retorno do Mercado Pago inválido.', {
          description: 'O código de autorização não foi recebido.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('connected') === '1') {
        toast.success('Conta do Mercado Pago conectada com sucesso.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [settings]);

  useEffect(() => {
    let active = true;

    async function loadAdminSettings() {
      setLoadingAdminSettings(true);
      try {
        const next = await getAdminPaymentSettings();
        if (!active) return;
        setAdminSettings(next);
      } catch (error) {
        console.error('Failed to load admin payment settings', error);
        if (!active) return;
        setAdminSettings(null);
      } finally {
        if (active) {
          setLoadingAdminSettings(false);
        }
      }
    }

    void loadAdminSettings();

    return () => {
      active = false;
    };
  }, [settings.payment_mode, settings.webhooks_enabled, settings.payment_topic_enabled]);

  function setField<K extends keyof PaymentFlags>(key: K, value: PaymentFlags[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    try {
      await updateSettings(form);
      await refreshSettings();
      const next = await getAdminPaymentSettings();
      setAdminSettings(next);
      toast.success('Configurações de pagamento salvas');
    } catch (error) {
      console.error('Failed to save payment settings', error);
      toast.error('Nao foi possivel salvar as configurações de pagamento.');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações do Mercado Pago</h1>

      <Card>
        <CardHeader>
          <CardTitle>Integração com Mercado Pago</CardTitle>
          <CardDescription>
            Conecte sua conta oficial do Mercado Pago para habilitar o recebimento de pagamentos reais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {!loadingAdminSettings && adminSettings && !adminSettings.oauthConfigured && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              Faltam `MP_CLIENT_ID` e/ou `MP_CLIENT_SECRET` na Vercel. Sem essas variáveis, o botão de conexão do Mercado Pago não consegue abrir o OAuth.
            </div>
          )}

          {!loadingAdminSettings && adminSettings && !adminSettings.webhookSecretConfigured && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              Falta `MP_WEBHOOK_SECRET` na Vercel. Sem esse segredo, pagamentos reais não podem ser confirmados via webhook.
            </div>
          )}

          {adminSettings?.accessTokenConfigured ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-700 dark:text-green-400">Conta conectada com Sucesso</h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    ID da Conta: {adminSettings.userId || 'token configurado'}
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={async () => {
                    if (confirm('Tem certeza que deseja desconectar a conta do Mercado Pago? Você deixará de receber pagamentos.')) {
                      await updateSettings({ mp_access_token: '', mp_refresh_token: '', mp_public_key: '', mp_user_id: '' });
                      await refreshSettings();
                      const next = await getAdminPaymentSettings();
                      setAdminSettings(next);
                      toast.success('Desconectado do Mercado Pago com sucesso');
                    }
                  }}
                >
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <p className="text-sm">
                Sua aplicação não está autorizada a processar pagamentos. Clique no botão abaixo para logar no Mercado Pago e configurar tudo automaticamente.
              </p>
              <Button
                asChild
                disabled={!adminSettings?.oauthConfigured}
                className="bg-blue-600 font-semibold text-white hover:bg-blue-700 border-none transition-all shadow-md disabled:pointer-events-none disabled:opacity-60"
              >
                <a href="/api/mercadopago/login" data-astro-reload>
                  Conectar conta do Mercado Pago
                </a>
              </Button>
            </div>
          )}
          <div className="mt-4 border-t pt-4">
            <p>
              Webhook interno (referência):{' '}
              {adminSettings?.webhookUrl || (typeof window !== 'undefined'
                ? `${window.location.origin}/api/payments/mercadopago/webhook`
                : '/api/payments/mercadopago/webhook')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flags públicas</CardTitle>
          <CardDescription>Somente opções não sensíveis são persistidas no Sheets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            {form.payment_mode === 'production'
              ? 'Checkout real habilitado. O fluxo só é liberado quando webhooks e o tópico payment estão ativos.'
              : 'Modo sandbox ativo. O checkout continua local/simulado para validar o fluxo sem cobrar o cliente.'}
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="mode-switch">Modo</Label>
            <Switch
              id="mode-switch"
              checked={form.payment_mode === 'production'}
              onCheckedChange={(checked) =>
                setField('payment_mode', checked ? 'production' : 'sandbox')
              }
            />
            <span className="text-sm text-muted-foreground">
              {form.payment_mode === 'production' ? 'Produção' : 'Sandbox'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="webhooks-enabled"
              checked={form.webhooks_enabled}
              onCheckedChange={(checked) => setField('webhooks_enabled', checked)}
            />
            <Label htmlFor="webhooks-enabled">Receber notificações via Webhooks</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="payment-topic-enabled"
              checked={form.payment_topic_enabled}
              onCheckedChange={(checked) => setField('payment_topic_enabled', checked)}
            />
            <Label htmlFor="payment-topic-enabled">
              Ativar tópico "payment" para notificações operacionais
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void handleSave()}>Salvar</Button>
    </div>
  );
}
