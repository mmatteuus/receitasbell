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
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, CreditCard, Zap, Link2Off, ExternalLink } from 'lucide-react';

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
  const [disconnecting, setDisconnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      payment_mode: settings.payment_mode,
      webhooks_enabled: settings.webhooks_enabled,
      payment_topic_enabled: settings.payment_topic_enabled,
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
      await updateSettings({ mp_access_token: '', mp_refresh_token: '', mp_public_key: '', mp_user_id: '' });
      await refreshSettings();
      const next = await getAdminPaymentSettings();
      setAdminSettings(next);
      toast.success('Conta desconectada com sucesso.');
    } catch {
      toast.error('Não foi possível desconectar. Tente novamente.');
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = Boolean(adminSettings?.accessTokenConfigured);
  const canConnect  = Boolean(adminSettings?.oauthConfigured);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receber Pagamentos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Conecte sua conta do Mercado Pago para começar a receber pagamentos das receitas premium do seu site.
        </p>
      </div>

      {/* ── STEP 1 — CONNECTION STATUS ─────────────────────── */}
      <Card className={isConnected ? 'border-green-500/40 bg-green-500/5' : ''}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {loadingAdminSettings ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base">
                {loadingAdminSettings ? 'Verificando conexão…' : isConnected ? 'Conta conectada' : 'Conecte sua conta do Mercado Pago'}
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                {isConnected
                  ? `ID da conta: ${adminSettings?.userId ?? 'autenticado'}`
                  : 'Processo simples e seguro — você será redirecionado ao site oficial do Mercado Pago.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Developer not configured — hidden message using friendly language */}
          {!loadingAdminSettings && adminSettings && !canConnect && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Configuração técnica pendente</p>
                <p className="mt-0.5 text-xs opacity-80">
                  O responsável técnico pelo site ainda precisa concluir a integração. Entre em contato para que ele configure as credenciais do aplicativo Mercado Pago no servidor.
                </p>
              </div>
            </div>
          )}

          {!loadingAdminSettings && adminSettings && !adminSettings.webhookSecretConfigured && !isConnected && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Confirmação de pagamentos pendente</p>
                <p className="mt-0.5 text-xs opacity-80">
                  Uma chave de segurança do servidor ainda não foi configurada. Pagamentos reais precisam dessa chave para serem confirmados automaticamente.
                </p>
              </div>
            </div>
          )}

          {isConnected ? (
            /* CONNECTED STATE */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pagamentos habilitados
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-card border px-3 py-2 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  Modo: {form.payment_mode === 'production' ? 'Produção' : 'Sandbox'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                onClick={() => void handleDisconnect()}
                disabled={disconnecting}
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
                {disconnecting ? 'Desconectando…' : 'Desconectar conta'}
              </Button>
            </div>
          ) : (
            /* CONNECT CTA */
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Como funciona?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
                  <li>Clique em <strong>"Conectar com Mercado Pago"</strong> abaixo.</li>
                  <li>Você será redirecionado para o site oficial do Mercado Pago.</li>
                  <li>Faça login com a sua conta e autorize a conexão.</li>
                  <li>Pronto! Você voltará automaticamente para esta página.</li>
                </ol>
              </div>

              <Button
                asChild={canConnect}
                disabled={!canConnect || loadingAdminSettings}
                className="w-full gap-2 h-11 text-sm font-semibold bg-[#009EE3] hover:bg-[#0081C0] text-white border-none shadow-sm disabled:pointer-events-none disabled:opacity-50"
              >
                {canConnect ? (
                  <a href="/api/mercadopago/login" className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.441 8.965l-2.76 2.77a.5.5 0 0 1-.708 0L12 9.763l-1.973 1.972a.5.5 0 0 1-.707 0L6.56 8.965a.5.5 0 0 1 0-.707l5.087-5.087a.5.5 0 0 1 .707 0l5.087 5.087a.5.5 0 0 1 0 .707z"/>
                    </svg>
                    Conectar com Mercado Pago
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                ) : (
                  <span>Conectar com Mercado Pago</span>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                🔒 Conexão segura via OAuth — suas senhas nunca são compartilhadas com o site.
              </p>
            </div>
          )}

          {/* Webhook URL internal reference */}
          <div className="mt-2 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">URL de Notificações (Webhook):</span>{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {adminSettings?.webhookUrl || (typeof window !== 'undefined'
                  ? `${window.location.origin}/api/payments/mercadopago/webhook`
                  : '/api/payments/mercadopago/webhook')}
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── STEP 2 — ADVANCED SETTINGS ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações avançadas</CardTitle>
          <CardDescription>Controle o comportamento do checkout e dos webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
