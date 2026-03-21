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
import { 
  Loader2, 
  HelpCircle, 
  Settings2, 
  Info, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  KeyRound,
  Globe
} from 'lucide-react';
import { MercadoPagoConnectionCard } from '@/components/payments/MercadoPagoConnectionCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        toast.error('Configurações pendentes', {
          description: 'Por favor, insira seu Client ID e Client Secret abaixo antes de conectar.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('error') === 'mp_oauth_failed') {
        toast.error('Falha na autenticação', {
          description: 'Não conseguimos verificar sua conta no Mercado Pago. Verifique suas chaves e tente novamente.',
          duration: 10000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (urlParams.get('connected') === '1') {
        toast.success('🎉 Tudo pronto!', {
          description: 'Sua conta do Mercado Pago foi conectada com sucesso.',
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
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Failed to save payment settings', error);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Deseja desconectar sua conta? Você não poderá receber novos pagamentos até reconectar.')) return;
    setDisconnecting(true);
    try {
      await disconnectMercadoPagoConnection();
      const next = await getAdminPaymentSettings();
      setAdminSettings(next);
      toast.success('Conta desconectada.');
    } catch {
      toast.error('Erro ao desconectar.');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleConnect() {
    // Check if we have credentials saved or in form
    if (!form.mp_client_id || !form.mp_client_secret) {
      toast.error("Chaves necessárias", {
        description: "Você precisa salvar o Client ID e Client Secret antes de conectar."
      });
      return;
    }

    setConnecting(true);
    try {
      // NOTE: Ensure the backend uses ASYNC config checks to read from DB!
      const authorizationUrl = await startMercadoPagoConnection(
        `${location.pathname}${location.search}${location.hash}`,
      );
      window.location.assign(authorizationUrl);
    } catch (error) {
      console.error('Failed to start Mercado Pago OAuth', error);
      toast.error('Não foi possível iniciar a conexão.');
      setConnecting(false);
    }
  }

  const isConnected = adminSettings?.connectionStatus === 'connected';

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">
          Gerencie como você recebe pelas suas receitas premium.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Status Section */}
          <MercadoPagoConnectionCard
            settings={adminSettings}
            loading={loadingAdminSettings}
            connecting={connecting}
            disconnecting={disconnecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />

          {/* Setup Steps - Only visible if not connected */}
          {!isConnected && (
            <Card className="border-primary/20 bg-primary/5 overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Passo a passo para conectar
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 text-muted-foreground leading-relaxed">
                <div className="flex gap-3">
                  <div className="flex-none h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                  <p>Acesse o <a href="https://www.mercadopago.com.br/developers/panel/applications" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">Painel de Desenvolvedor <ArrowRight className="h-2.5 w-2.5" /></a> do Mercado Pago.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                  <p>Crie uma aplicação (ou selecione uma existente) e copie o <strong>Client ID</strong> e o <strong>Client Secret</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                  <p>Cole nos campos de "Credenciais" abaixo e clique em <strong>Salvar Configurações</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">4</div>
                  <p>Clique no botão azul <strong>Conectar com Mercado Pago</strong> acima para finalizar.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credentials Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Credenciais da Aplicação
                  </CardTitle>
                  <CardDescription>Configure as chaves da sua conta de vendedor.</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      Suas chaves são armazenadas de forma segura e usadas apenas para processar os pagamentos no seu nome.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mp-client-id" className="text-xs font-semibold">Client ID</Label>
                  <Input
                    id="mp-client-id"
                    value={form.mp_client_id}
                    onChange={(e) => setField('mp_client_id', e.target.value)}
                    placeholder="Ex: 852..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mp-client-secret" className="text-xs font-semibold">Client Secret</Label>
                  <Input
                    id="mp-client-secret"
                    type="password"
                    value={form.mp_client_secret}
                    onChange={(e) => setField('mp_client_secret', e.target.value)}
                    placeholder="Ex: oZ9..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="app-base-url" className="text-xs font-semibold">URL do Site</Label>
                </div>
                <Input
                  id="app-base-url"
                  value={form.app_base_url}
                  onChange={(e) => setField('app_base_url', e.target.value)}
                  placeholder="https://sualoja.com.br"
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Importante para o redirecionamento pós-compra e notificações.
                </p>
              </div>

              <Button 
                onClick={() => void handleSave()} 
                disabled={saving} 
                className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all border-dashed border-primary/30"
                variant="outline"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}
                {saving ? 'Gravando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Advanced Controls */}
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
                  onCheckedChange={(checked) => setField('payment_mode', checked ? 'production' : 'sandbox')}
                />
              </div>

              <div className={`p-3 rounded-lg text-[10px] leading-relaxed ${
                form.payment_mode === 'production' 
                ? 'bg-green-500/10 text-green-700 border border-green-500/20' 
                : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
              }`}>
                {form.payment_mode === 'production' 
                  ? 'O site está em PRODUÇÃO. As vendas são processadas e cobradas de verdade.' 
                  : 'O site está em TESTE. Você pode simular compras com cartões de teste do Mercado Pago.'}
              </div>

              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Webhooks</Label>
                  <Switch
                    checked={form.webhooks_enabled}
                    onCheckedChange={(checked) => setField('webhooks_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Tópico de Pagamento</Label>
                  <Switch
                    checked={form.payment_topic_enabled}
                    onCheckedChange={(checked) => setField('payment_topic_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <div className="p-5 rounded-2xl border bg-gradient-to-br from-card to-muted/30 text-center space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Conexão Blindada</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Utilizamos o protocolo OAuth 2.0 oficial. Suas credenciais de login nunca tocam nossos servidores, garantindo total privacidade e segurança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
