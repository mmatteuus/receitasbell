import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/app-context';
import {
  getAdminPaymentSettings,
  startStripeConnect,
  createStripeConnectAccount,
} from '@/lib/api/payments';
import { updateSettings } from '@/lib/api/settings';
import type { AdminPaymentSettingsResponse } from '@/types/payment';
import { ApiClientError } from '@/lib/api/client';
import { Info, ShieldCheck, Activity } from 'lucide-react';
import { StripeConnectCard } from '@/components/payments/StripeConnectCard';
import { PageHead } from '@/components/PageHead';

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
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      payment_mode: settings.payment_mode,
      webhooks_enabled: settings.webhooks_enabled,
      payment_topic_enabled: settings.payment_topic_enabled,
    });

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.get('stripe') === 'success') {
        toast.success('🎉 Stripe conectado!', {
          description:
            'Sua conta Stripe foi vinculada com sucesso. Você já pode receber pagamentos.',
          duration: 6000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('stripe') === 'refresh') {
        toast.info('Onboarding incompleto', {
          description: 'Finalize o cadastro no Stripe para ativar os pagamentos.',
          duration: 8000,
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
    return () => {
      active = false;
    };
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
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Failed to save payment settings', error);
      if (error instanceof ApiClientError && error.status === 409) {
        const details = (error.details ?? {}) as { blockingReasons?: string[] };
        const blockingReasons = Array.isArray(details.blockingReasons)
          ? details.blockingReasons
          : [];
        toast.error('Não foi possível ativar o modo produção.', {
          description: blockingReasons.length
            ? blockingReasons.join(' ')
            : 'Revise os pré-requisitos de conexão antes de tentar novamente.',
        });
      } else {
        toast.error('Erro ao salvar configurações.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      // Tenta obter o link de onboarding; se a conta ainda não existir, cria primeiro
      let onboardingUrl: string;
      const returnTo = `${window.location.pathname}${window.location.search}`;
      try {
        onboardingUrl = await startStripeConnect(returnTo);
      } catch {
        // Conta pode não existir ainda — cria e usa URL retornada
        const created = await createStripeConnectAccount(returnTo);
        onboardingUrl = created.onboardingUrl;
      }
      window.location.assign(onboardingUrl);
    } catch (error: unknown) {
      console.error('Failed to start Stripe Connect onboarding', error);
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível iniciar a conexão com o Stripe.';

      toast.error('Erro de Conexão', {
        description: message,
        duration: 10000,
      });
      setConnecting(false);
    }
  }

  const isConnected = adminSettings?.connectionStatus === 'connected';

  return (
    <>
      <PageHead
        title="Configurações de pagamento"
        description="Controle modo (teste ou produção) e integrações do Stripe."
        noindex={true}
      />
      <div className="space-y-8 max-w-4xl pb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Gerencie como você recebe pelas suas receitas premium via Stripe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Status da Conexão Stripe */}
            <StripeConnectCard
              settings={adminSettings}
              loading={loadingAdminSettings}
              connecting={connecting}
              disconnecting={false}
              onConnect={handleConnect}
            />

            {/* Guia de Primeiros Passos */}
            {!isConnected && (
              <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Como funciona o Stripe Connect
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3 text-muted-foreground leading-relaxed">
                  <p>
                    Clique em <strong>Conectar com Stripe</strong> acima e siga o onboarding seguro
                    do Stripe. Após concluir, o dinheiro das suas vendas cairá diretamente na sua
                    conta bancária vinculada, sem intermediários adicionais do sistema.
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Receba pagamentos em tempo real</li>
                    <li>Dashboard financeiro completo no Stripe</li>
                    <li>Segurança PCI DSS nível 1</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Controles Avançados */}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Modo de Operação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Ambiente</Label>
                    <p className="text-xs text-muted-foreground">
                      {form.payment_mode === 'production' ? 'Cobranças Reais' : 'Modo Teste'}
                    </p>
                  </div>
                  <Switch
                    checked={form.payment_mode === 'production'}
                    onCheckedChange={(checked) =>
                      setField('payment_mode', checked ? 'production' : 'sandbox')
                    }
                  />
                </div>

                <div
                  className={`p-3 rounded-lg text-[10px] leading-relaxed ${
                    form.payment_mode === 'production'
                      ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                  }`}
                >
                  {form.payment_mode === 'production'
                    ? 'O site está em PRODUÇÃO. As vendas são processadas e cobradas de verdade.'
                    : 'O site está em TESTE. Você pode simular compras com cartões de teste do Stripe (ex: 4242 4242 4242 4242).'}
                </div>

                <Button onClick={() => void handleSave()} disabled={saving} className="w-full">
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>

            {/* Nota de Segurança */}
            <div className="p-5 rounded-2xl border bg-gradient-to-br from-card to-muted/30 text-center space-y-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Conexão Blindada</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Utilizamos o protocolo OAuth 2.0 oficial do Stripe Connect. Suas credenciais
                bancárias nunca tocam nossos servidores — tudo é processado diretamente pelo Stripe
                com criptografia PCI DSS nível 1.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
