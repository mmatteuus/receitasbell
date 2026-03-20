import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/app-context';
import {
  disconnectMercadoPagoConnection,
  getAdminPaymentSettings,
  startMercadoPagoConnection,
} from '@/lib/api/payments';
import { updateSettings } from '@/lib/api/settings';
import type { AdminPaymentSettingsResponse } from '@/types/payment';
import { Loader2 } from 'lucide-react';
import { MercadoPagoConnectionCard } from '@/components/payments/MercadoPagoConnectionCard';

type PaymentFlags = {
  payment_mode: 'sandbox' | 'production';
  webhooks_enabled: boolean;
  payment_topic_enabled: boolean;
  mp_client_id: string;
  mp_client_secret: string;
  mp_webhook_secret: string;
  app_base_url: string;
};

export default function SettingsPage() {
  const location = useLocation();
  const { settings, refreshSettings } = useAppContext();
  const [form, setForm] = useState<PaymentFlags>({
    payment_mode: 'sandbox',
    webhooks_enabled: true,
    payment_topic_enabled: true,
    mp_client_id: '',
    mp_client_secret: '',
    mp_webhook_secret: '',
    app_base_url: '',
  });
  const [adminSettings, setAdminSettings] = useState<AdminPaymentSettingsResponse | null>(null);
  const [loadingAdminSettings, setLoadingAdminSettings] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      payment_mode: settings.payment_mode,
      webhooks_enabled: settings.webhooks_enabled,
      payment_topic_enabled: settings.payment_topic_enabled,
      mp_client_id: settings.mp_client_id || '',
      mp_client_secret: settings.mp_client_secret || '',
      mp_webhook_secret: settings.mp_webhook_secret || '',
      app_base_url: settings.app_base_url || '',
    });

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('error') === 'mp_not_configured') {
        toast.error('Integração não configurada', {
          description: 'Entre em contato com o responsável técnico do site para configurar as variáveis de ambiente do Mercado Pago.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('error') === 'mp_oauth_failed') {
        toast.error('Falha na autenticação', {
          description: 'Não conseguimos verificar sua conta no Mercado Pago. Tente novamente ou entre em contato com o suporte.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('error') === 'mp_missing_code') {
        toast.error('Autorização incompleta', {
          description: 'O processo de autorização não foi concluído. Por favor, tente novamente.',
          duration: 8000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('connected') === '1') {
        toast.success('🎉 Conta do Mercado Pago conectada!', {
          description: 'Você já pode receber pagamentos pelo site.',
          duration: 6000,
        });
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
        if (active) setLoadingAdminSettings(false);
      }
    }

    void loadAdminSettings();
    return () => { active = false; };
  }, [settings.payment_mode, settings.webhooks_enabled, settings.payment_topic_enabled]);

  function setField<K extends keyof PaymentFlags>(key: K, value: PaymentFlags[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(form);
      await refreshSettings();
      const next = await getAdminPaymentSettings();
      setAdminSettings(next);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Failed to save payment settings', error);
      toast.error('Não foi possível salvar as configurações de pagamento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Tem certeza que deseja desconectar a conta do Mercado Pago?\n\nVocê deixará de receber pagamentos pelo site até reconectar.')) return;
    setDisconnecting(true);
    try {
      await disconnectMercadoPagoConnection();
      const next = await getAdminPaymentSettings();
      setAdminSettings(next);
      toast.success('Conta desconectada com sucesso.');
    } catch {
      toast.error('Não foi possível desconectar. Tente novamente.');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const authorizationUrl = await startMercadoPagoConnection(
        `${location.pathname}${location.search}${location.hash}`,
      );
      window.location.assign(authorizationUrl);
    } catch (error) {
      console.error('Failed to start Mercado Pago OAuth', error);
      toast.error('Não foi possível iniciar a conexão com o Mercado Pago.');
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receber Pagamentos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Conecte sua conta do Mercado Pago para começar a receber pagamentos das receitas premium do seu site.
        </p>
      </div>

      <MercadoPagoConnectionCard
        settings={adminSettings}
        loading={loadingAdminSettings}
        connecting={connecting}
        disconnecting={disconnecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* ── STEP 2 — ADVANCED SETTINGS ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações avançadas</CardTitle>
          <CardDescription>Controle o comportamento do checkout e dos webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credenciais da Aplicação</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="mp-client-id" className="text-xs">Client ID do Mercado Pago</Label>
              <Input
                id="mp-client-id"
                value={form.mp_client_id}
                onChange={(e) => setField('mp_client_id', e.target.value)}
                placeholder="Ex: 852..."
                className="h-9 text-xs"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mp-client-secret" className="text-xs">Client Secret do Mercado Pago</Label>
              <Input
                id="mp-client-secret"
                type="password"
                value={form.mp_client_secret}
                onChange={(e) => setField('mp_client_secret', e.target.value)}
                placeholder="Ex: oZ9..."
                className="h-9 text-xs"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mp-webhook-secret" className="text-xs">Webhook Secret (Assinatura)</Label>
              <Input
                id="mp-webhook-secret"
                type="password"
                value={form.mp_webhook_secret}
                onChange={(e) => setField('mp_webhook_secret', e.target.value)}
                placeholder="Configurar na Vercel"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="app-base-url" className="text-xs">URL Base do Site (https://...)</Label>
              <Input
                id="app-base-url"
                value={form.app_base_url}
                onChange={(e) => setField('app_base_url', e.target.value)}
                placeholder="https://receitasbell.mtsferreira.dev"
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Usado para gerar as URLs de redirecionamento e Webhook.
              </p>
            </div>
          </div>

          <div className={`rounded-lg border p-3 text-sm ${
            form.payment_mode === 'production'
              ? 'border-green-500/30 bg-green-500/5 text-green-800 dark:text-green-300'
              : 'border-border bg-muted/30 text-muted-foreground'
          }`}>
            {form.payment_mode === 'production'
              ? '✅ Modo produção ativo. Os clientes serão cobrados de verdade.'
              : '🧪 Modo sandbox ativo. Nenhum cliente será cobrado — ideal para testes.'}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mode-switch" className="font-medium">Ambiente de checkout</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alterne entre modo teste (Sandbox) e cobrança real (Produção).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sandbox</span>
              <Switch
                id="mode-switch"
                checked={form.payment_mode === 'production'}
                onCheckedChange={(checked) => setField('payment_mode', checked ? 'production' : 'sandbox')}
              />
              <span className="text-xs text-muted-foreground">Produção</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="webhooks-enabled" className="font-medium">Notificações de pagamento</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receba atualizações automáticas quando um pagamento for aprovado ou recusado.
              </p>
            </div>
            <Switch
              id="webhooks-enabled"
              checked={form.webhooks_enabled}
              onCheckedChange={(checked) => setField('webhooks_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="payment-topic-enabled" className="font-medium">Tópico de pagamento</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Necessário para que as notificações de checkout sejam recebidas corretamente.
              </p>
            </div>
            <Switch
              id="payment-topic-enabled"
              checked={form.payment_topic_enabled}
              onCheckedChange={(checked) => setField('payment_topic_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Salvando…' : 'Salvar configurações'}
      </Button>
    </div>
  );
}
