import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateInvite,
  acceptInvite,
  requestNewInvite,
  type InviteStatus,
  type ValidateInviteResponse,
} from "@/lib/api/adminInvites";
import { ApiClientError } from "@/lib/api/client";
import { AdminInviteBanner } from "./AdminInviteBanner";
import { trackEvent } from "@/lib/telemetry";

export interface AdminInviteAcceptanceProps {
  token: string;
  onSuccess: () => void;
}

export function AdminInviteAcceptance({ token, onSuccess }: AdminInviteAcceptanceProps) {
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("loading");
  const [inviteData, setInviteData] = useState<ValidateInviteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [requestingNewInvite, setRequestingNewInvite] = useState(false);

  const passwordsMatch = password === passwordConfirm && password.length > 0;
  const isError = inviteStatus === "expired" || inviteStatus === "invalid" || inviteStatus === "used";

  // Validar convite ao carregar
  useEffect(() => {
    let active = true;

    async function validate() {
      try {
        const data = await validateInvite(token);
        if (!active) return;

        setInviteData(data);
        setInviteStatus(data.status as InviteStatus);

        if (data.status === "valid") {
          trackEvent("admin.invite.validated", {
            tenantSlug: data.tenantSlug,
            email: data.email,
          });
        } else {
          trackEvent("admin.invite.validation_failed", {
            status: data.status,
          });
        }
      } catch (err) {
        if (!active) return;
        setInviteStatus("invalid");
        setInviteData(null);
        trackEvent("admin.invite.validation_error");

        if (err instanceof ApiClientError) {
          setError(err.message || "Não foi possível validar o convite.");
        } else {
          setError("Erro ao validar convite. Tente novamente.");
        }
      }
    }

    void validate();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleAcceptInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordsMatch || !inviteData) return;

    setLoading(true);
    setError("");

    try {
      const result = await acceptInvite({
        token,
        password,
        passwordConfirm,
      });

      trackEvent("admin.invite.accepted", {
        email: inviteData.email,
        tenantSlug: inviteData.tenantSlug,
      });

      onSuccess();
    } catch (err) {
      trackEvent("admin.invite.acceptance_failed");

      if (err instanceof ApiClientError) {
        setError(err.message || "Não foi possível aceitar o convite.");
      } else {
        setError("Erro ao aceitar convite. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestNewInvite() {
    if (!inviteData?.email) return;

    setRequestingNewInvite(true);

    try {
      await requestNewInvite(inviteData.email, "Convite anterior expirou");

      trackEvent("admin.invite.new_requested", {
        email: inviteData.email,
      });

      setError("");
      // Mostrar feedback
      alert("Solicitação enviada! Um novo convite será enviado para seu e-mail em breve.");
    } catch (err) {
      trackEvent("admin.invite.new_request_failed");

      if (err instanceof ApiClientError) {
        setError(err.message || "Não foi possível solicitar novo convite.");
      } else {
        setError("Erro ao solicitar novo convite.");
      }
    } finally {
      setRequestingNewInvite(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminInviteBanner
        status={inviteStatus}
        tenantName={inviteData?.tenantName}
        email={inviteData?.email}
        message={inviteData?.message}
        onRequestNewInvite={isError ? handleRequestNewInvite : undefined}
        isRequestingNew={requestingNewInvite}
      />

      {!isError && inviteStatus === "valid" && (
        <form className="space-y-4" onSubmit={handleAcceptInvite}>
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                value={inviteData?.email || ""}
                readOnly
                className="pl-9 bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-password" className="text-sm font-medium">
              Senha inicial
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Crie uma senha forte"
                className="pl-9 pr-10"
                required
                aria-invalid={passwordConfirm && !passwordsMatch ? "true" : "false"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showPassword ? "Ocultar senha" : "Exibir senha"}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-password-confirm" className="text-sm font-medium">
              Confirmar senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-password-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="Repita a senha"
                className="pl-9 pr-10"
                required
                aria-invalid={passwordConfirm && !passwordsMatch ? "true" : "false"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showPassword ? "Ocultar senha" : "Exibir senha"}</span>
              </Button>
            </div>
            {passwordConfirm && !passwordsMatch && (
              <p className="text-xs text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !passwordsMatch}
            aria-live="polite"
          >
            {loading ? "Criando acesso..." : "Criar acesso admin"}
          </Button>
        </form>
      )}
    </div>
  );
}
