
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { paymentsRepo } from "@/lib/payments/repo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SETTINGS_KEY = 'bell_mp_settings';

interface MpSettings {
  mode: 'sandbox' | 'production';
  accessToken: string;
  publicKey: string;
  webhooksEnabled: boolean;
  paymentTopicEnabled: boolean;
}

const defaultSettings: MpSettings = {
    mode: 'sandbox',
    accessToken: 'TEST-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    publicKey: 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    webhooksEnabled: true,
    paymentTopicEnabled: true,
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MpSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast({
      title: "Configurações salvas!",
      description: "As configurações do Mercado Pago foram salvas (mock).",
    });
  };

  const handleTestWebhook = () => {
    // Get a random pending payment to update
    const pendingPayments = paymentsRepo.listPayments({ status: ['pending'] });
    if (pendingPayments.length > 0) {
      const randomPayment = pendingPayments[Math.floor(Math.random() * pendingPayments.length)];
      paymentsRepo.updateMockStatus(randomPayment.id, 'approved', 'accredited');
      toast({
        title: "Webhook de teste enviado!",
        description: `O pagamento ${randomPayment.id} foi atualizado para "Aprovado".`,
      });
    } else {
        toast({
            title: "Nenhum pagamento pendente",
            description: "Não há pagamentos pendentes para testar o webhook.",
            variant: "destructive"
        })
    }
  };

  const handleChange = (field: keyof MpSettings, value: any) => {
    setSettings(prev => ({...prev, [field]: value}))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações do Mercado Pago</h1>
      
      <Card>
          <CardHeader>
              <CardTitle>Credenciais</CardTitle>
              <CardDescription>Suas chaves de API para integração com o Mercado Pago.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
                <Label htmlFor="mode-switch">Modo</Label>
                <Switch 
                    id="mode-switch"
                    checked={settings.mode === 'production'}
                    onCheckedChange={(checked) => handleChange('mode', checked ? 'production' : 'sandbox')}
                />
                <span className="text-sm text-muted-foreground">{settings.mode === 'production' ? 'Produção' : 'Sandbox'}</span>
            </div>

            <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input 
                    id="access-token" 
                    type="password"
                    value={settings.accessToken}
                    onChange={(e) => handleChange('accessToken', e.target.value)}
                    />
            </div>

            <div className="space-y-2">
                <Label htmlFor="public-key">Public Key</Label>
                <Input 
                    id="public-key"
                    type="password"
                    value={settings.publicKey} 
                    onChange={(e) => handleChange('publicKey', e.target.value)}
                />
            </div>
          </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Receba notificações sobre o status dos pagamentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" readOnly value={`${window.location.origin}/api/mercadopago/webhook`} />
                <p className="text-sm text-muted-foreground">
                    Configure esta URL na sua aplicação do Mercado Pago.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Switch 
                    id="webhooks-enabled"
                    checked={settings.webhooksEnabled}
                    onCheckedChange={(checked) => handleChange('webhooksEnabled', checked)}
                />
                <Label htmlFor="webhooks-enabled">Receber notificações via Webhooks</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Switch 
                    id="payment-topic-enabled"
                    checked={settings.paymentTopicEnabled}
                    onCheckedChange={(checked) => handleChange('paymentTopicEnabled', checked)}
                />
                <Label htmlFor="payment-topic-enabled">Ativar tópico "payment"</Label>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> O uso de IPN (Instant Payment Notification) é legado e não é recomendado. Use Webhooks para maior segurança e confiabilidade.
                </p>
            </div>
          </CardContent>
      </Card>

      <div className="flex space-x-2">
        <Button onClick={handleSave}>Salvar</Button>
        <Button variant="outline" onClick={handleTestWebhook}>
          Testar Webhook
        </Button>
      </div>
    </div>
  );
}
