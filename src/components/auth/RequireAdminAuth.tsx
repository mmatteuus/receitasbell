import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAdminSession } from "@/lib/api/adminSession";

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const result = await getAdminSession();
        if (!active) return;
        setStatus(result.authenticated ? "authenticated" : "unauthenticated");
      } catch {
        if (!active) return;
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

  if (status === "unauthenticated") {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <>{children}</>;
}
