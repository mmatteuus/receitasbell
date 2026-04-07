import { AlertCircle, CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type InviteStatus = "loading" | "valid" | "expired" | "invalid" | "used";

export interface AdminInviteBannerProps {
  status: InviteStatus;
  tenantName?: string;
  email?: string;
  message?: string;
  onRequestNewInvite?: () => void;
  isRequestingNew?: boolean;
}

const statusConfig: Record<InviteStatus, { icon: React.ReactNode; variant: "default" | "destructive"; title: string }> = {
  loading: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    variant: "default",
    title: "Validando convite...",
  },
  valid: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    variant: "default",
    title: "Convite válido",
  },
  expired: {
    icon: <Clock className="h-4 w-4" />,
    variant: "destructive",
    title: "Convite expirado",
  },
  invalid: {
    icon: <AlertCircle className="h-4 w-4" />,
    variant: "destructive",
    title: "Convite inválido",
  },
  used: {
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: "destructive",
    title: "Convite já utilizado",
  },
};

export function AdminInviteBanner({
  status,
  tenantName,
  email,
  message,
  onRequestNewInvite,
  isRequestingNew,
}: AdminInviteBannerProps) {
  const config = statusConfig[status];
  const isError = status === "expired" || status === "invalid" || status === "used";

  return (
    <Alert variant={config.variant} className="mb-6">
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription className="mt-1 space-y-2">
            {status === "valid" && (
              <>
                <p>Você foi convidado para administrar o tenant <strong>{tenantName}</strong>.</p>
                <p className="text-sm">Defina sua senha inicial para concluir o onboarding.</p>
              </>
            )}

            {status === "expired" && (
              <>
                <p>O seu convite expirou e não pode mais ser utilizado.</p>
                <p className="text-sm">Solicite um novo convite ao administrador principal.</p>
              </>
            )}

            {status === "invalid" && (
              <>
                <p>O convite fornecido não é válido.</p>
                <p className="text-sm">Verifique o link no e-mail ou solicite um novo.</p>
              </>
            )}

            {status === "used" && (
              <>
                <p>Este convite já foi utilizado anteriormente.</p>
                <p className="text-sm">Se é sua primeira vez, entre com suas credenciais normalmente.</p>
              </>
            )}

            {message && <p className="text-sm italic">{message}</p>}

            {isError && onRequestNewInvite && (
              <button
                onClick={onRequestNewInvite}
                disabled={isRequestingNew}
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                aria-live="polite"
              >
                {isRequestingNew ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  "Solicitar novo convite"
                )}
              </button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
