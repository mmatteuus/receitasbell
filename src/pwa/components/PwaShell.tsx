import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { fetchMe } from "@/lib/api/identity";
import { PwaTopBar } from "./PwaTopBar";
import { PwaBottomNav } from "./PwaBottomNav";
import { PwaInstallHintIOS } from "./PwaInstallHintIOS";

import { PwaUpdateBanner } from "./PwaUpdateBanner";

import { trackEvent } from "@/lib/telemetry";
import { OfflineBanner } from "@/pwa/offline/ui/OfflineBanner";
import { PendingChangesBar } from "@/pwa/offline/ui/PendingChangesBar";
import { SyncCenterSheet } from "@/pwa/offline/ui/SyncCenterSheet";
import { OfflineLockedScreen } from "@/pwa/offline/ui/OfflineLockedScreen";
import { ConflictResolutionDialog } from "@/pwa/offline/ui/ConflictResolutionDialog";
import { useConflictCenter } from "@/pwa/offline/hooks/useConflictCenter";

export function UserPwaShell() {
  const [loading, setLoading] = useState(true);
  const [offlineLocked, setOfflineLocked] = useState(false);
  const [syncCenterOpen, setSyncCenterOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { conflicts } = useConflictCenter();

  useEffect(() => {
    // Telemetry for PWA usage
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    trackEvent("pwa.vitals", { 
      mode: isStandalone ? "standalone" : "browser",
      path: location.pathname 
    });
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const user = await fetchMe();
        if (!active) return;
        if (!user?.email) {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            setOfflineLocked(true);
          } else {
            navigate("/pwa/login", { replace: true });
          }
        }
      } catch {
        if (!active) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setOfflineLocked(true);
        } else {
          navigate("/pwa/login", { replace: true });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void check();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (conflicts.length > 0) {
      setConflictDialogOpen(true);
    }
  }, [conflicts.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (offlineLocked) {
    return (
      <OfflineLockedScreen
        title="Conecte-se uma vez para liberar o modo offline"
        description="Este dispositivo ainda não possui uma sessão e um snapshot válidos para abrir o app sem internet."
        ctaHref="/pwa/login"
        ctaLabel="Ir para o login"
      />
    );
  }

  // Determine if it's a page that needs back button or if it's a main tab
  const mainTabs = ["/pwa/app", "/pwa/app/favoritos", "/pwa/app/lista-de-compras", "/pwa/app/compras"];
  const showBack = !mainTabs.includes(location.pathname);

  // Dynamic titles based on route
  const getTitle = () => {
    switch(location.pathname) {
      case "/pwa/app": return "Receitas Bell";
      case "/pwa/app/favoritos": return "Meus Favoritos";
      case "/pwa/app/lista-de-compras": return "Lista de Compras";
      case "/pwa/app/compras": return "Minhas Compras";
      default: return "Receitas Bell";
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-20 flex flex-col items-center">
      <PwaUpdateBanner />
      <PwaTopBar title={getTitle()} showBack={showBack} />
      <OfflineBanner />
      <PendingChangesBar onOpenSyncCenter={() => setSyncCenterOpen(true)} />
      <main className="w-full max-w-md mx-auto flex-1 overflow-x-hidden p-4 sm:p-6 animate-in fade-in duration-500">
        <Outlet />
      </main>
      <PwaBottomNav />
      <PwaInstallHintIOS />
      <SyncCenterSheet open={syncCenterOpen} onOpenChange={setSyncCenterOpen} />
      <ConflictResolutionDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen} />
    </div>
  );
}
