import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAdminSession } from "@/lib/api/adminSession";
import { OfflineLockedScreen } from "@/pwa/offline/ui/OfflineLockedScreen";

export function RequirePwaAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "authenticated" | "offline_locked" | "unauthenticated">("checking");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const result = await getAdminSession({ allowOffline: true });
        if (!active) {
          return;
        }

        if (result.authenticated) {
          setStatus("authenticated");
          return;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setStatus("offline_locked");
          return;
        }

        setStatus("unauthenticated");
      } catch {
        if (!active) {
          return;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setStatus("offline_locked");
          return;
        }

        setStatus("unauthenticated");
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Verificando acesso do admin...</p>
      </div>
    );
  }

  if (status === "offline_locked") {
    return (
      <OfflineLockedScreen
        title="Admin offline bloqueado"
        description="O admin offline só libera dados previamente sincronizados neste dispositivo e após uma validação online recente."
        ctaHref="/pwa/admin/login"
        ctaLabel="Ir para o login do admin"
      />
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/pwa/admin/login" replace />;
  }

  return <>{children}</>;
}
