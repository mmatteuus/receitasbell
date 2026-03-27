import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Link2Off,
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminPaymentSettingsResponse } from "@/types/payment";
import { cn } from "@/lib/utils";

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
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      isConnected ? "border-green-500/30 bg-green-500/[0.02]" : "border-primary/10 shadow-sm"
    )}>
      {isConnected && (
        <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-600" />
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
              loading ? "bg-muted animate-pulse" :
              isConnected ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
              reconnectRequired ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
              "bg-primary/10 text-primary"
            )}>
              {loading ? (
                <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : isConnected ? (
                <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
              ) : reconnectRequired ? (
                <AlertCircle aria-hidden="true" className="h-6 w-6" />
              ) : (
                <CreditCard aria-hidden="true" className="h-6 w-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-heading">
                {loading
                  ? "Verificando conexão..."
                  : isConnected
                    ? "Conta Conectada"
                    : reconnectRequired
                      ? "Reconexão Necessária"
                      : "Mercado Pago"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isConnected
                  ? `Vinculada com sucesso ao seu site`
                  : "Acesse sua conta para receber pagamentos de forma segura."}
              </CardDescription>
            </div>
          </div>

          {isConnected && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded">Ativo</span>
            </div>
          )}
          {reconnectRequired && !isConnected && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">Atenção</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!loading && settings && !canConnect && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-800 dark:text-amber-200">
            <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold text-xs uppercase tracking-tight">Recurso Indisponível</p>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                A integração central com o Mercado Pago ainda não foi configurada pelo administrador da plataforma. Entre em contato com o suporte.
              </p>
            </div>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-green-500/[0.08] p-3 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-500/10">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Vendas Habilitadas
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 text-xs text-muted-foreground">
                <Zap aria-hidden="true" className="h-4 w-4 text-amber-500" />
                {settings.userId ? `ID: ${settings.userId}` : "Checkout Direto"}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
              <Network aria-hidden="true" className="h-3 w-3" />
              <span>Conexão estável estabelecida com a API do Mercado Pago</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 gap-2 text-destructive hover:bg-destructive/5 font-medium border border-transparent hover:border-destructive/20 transition-all"
              onClick={() => void onDisconnect()}
              disabled={disconnecting}
              aria-label="Desconectar conta Mercado Pago"
            >
              {disconnecting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Link2Off aria-hidden="true" className="h-4 w-4" />}
              {disconnecting ? "Desconectando..." : "Desconectar conta atual"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              disabled={!canConnect || loading || connecting}
              className={cn(
                "h-12 w-full gap-3 border-none text-white shadow-lg transition-all active:scale-[0.98]",
                canConnect 
                  ? "bg-[#009EE3] hover:bg-[#0081C0] hover:shadow-[#009EE3]/20" 
                  : "bg-muted text-muted-foreground grayscale"
              )}
              onClick={() => void onConnect()}
              aria-label={reconnectRequired ? 'Reconectar conta Mercado Pago' : 'Conectar com Mercado Pago'}
            >
              {connecting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <ExternalLink aria-hidden="true" className="h-5 w-5" />}
              <span className="font-bold tracking-tight">
                {reconnectRequired ? "Reconectar Conta" : "Conectar com Mercado Pago"}
              </span>
            </Button>
          </div>
        )}

        <div className="mt-2 border-t border-dashed pt-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground group cursor-default">
            <span>Webhook URL</span>
            <code className="rounded bg-muted px-2 py-1 font-mono text-[9px] group-hover:bg-primary/5 group-hover:text-primary transition-colors">
              {settings?.webhookUrl || "-"}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
