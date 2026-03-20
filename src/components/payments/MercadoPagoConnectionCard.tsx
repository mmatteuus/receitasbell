import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Link2Off,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminPaymentSettingsResponse } from "@/types/payment";

type Props = {
  settings: AdminPaymentSettingsResponse | null;
  loading: boolean;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void | Promise<void>;
  onDisconnect: () => void | Promise<void>;
};

export function MercadoPagoConnectionCard({
  settings,
  loading,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: Props) {
  const isConnected = settings?.connectionStatus === "connected";
  const reconnectRequired = settings?.connectionStatus === "reconnect_required";
  const canConnect = Boolean(settings?.oauthConfigured);

  return (
    <Card className={isConnected ? "border-green-500/40 bg-green-500/5" : ""}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : reconnectRequired ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <CardTitle className="text-base">
              {loading
                ? "Verificando conexão..."
                : isConnected
                  ? "Conta conectada"
                  : reconnectRequired
                    ? "Reconexão necessária"
                    : "Conecte sua conta do Mercado Pago"}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {isConnected
                ? `ID da conta: ${settings?.userId ?? "autenticado"}`
                : "Processo seguro via OAuth oficial do Mercado Pago."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!loading && settings && !canConnect && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Configuração técnica pendente</p>
              <p className="mt-0.5 text-xs opacity-80">
                Configure as credenciais OAuth do aplicativo Mercado Pago no servidor para liberar a conexão.
              </p>
              {settings.missingConfig && settings.missingConfig.length > 0 && (
                <div className="mt-2 text-[10px] font-mono opacity-70">
                  <p>Faltando:</p>
                  <ul className="list-disc list-inside">
                    {settings.missingConfig.map(c => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && settings && !settings.webhookSecretConfigured && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Assinatura do webhook pendente</p>
              <p className="mt-0.5 text-xs opacity-80">
                Pagamentos reais precisam da assinatura secreta do webhook configurada na Vercel.
              </p>
            </div>
          </div>
        )}

        {reconnectRequired && settings?.lastError && (
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-amber-900 dark:text-amber-200">
            {settings.lastError}
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Pagamentos habilitados
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                {settings.connectedAt ? `Conectado em ${new Date(settings.connectedAt).toLocaleString("pt-BR")}` : "Conta ativa"}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => void onDisconnect()}
              disabled={disconnecting}
            >
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
              {disconnecting ? "Desconectando..." : "Desconectar conta"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Como funciona?</p>
              <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
                <li>Clique em "Conectar com Mercado Pago".</li>
                <li>Faça login no Mercado Pago e autorize a aplicação.</li>
                <li>Volte para esta tela com a conta vinculada ao seu tenant.</li>
              </ol>
            </div>

            <Button
              disabled={!canConnect || loading || connecting}
              className="h-11 w-full gap-2 border-none bg-[#009EE3] text-sm font-semibold text-white shadow-sm hover:bg-[#0081C0] disabled:pointer-events-none disabled:opacity-50"
              onClick={() => void onConnect()}
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {reconnectRequired ? "Reconectar com Mercado Pago" : "Conectar com Mercado Pago"}
              {!connecting ? <ExternalLink className="h-3.5 w-3.5 opacity-70" /> : null}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Conexão segura via OAuth. Segredos nunca são expostos no navegador.
            </p>
          </div>
        )}

        <div className="mt-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Webhook:</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{settings?.webhookUrl || "-"}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
