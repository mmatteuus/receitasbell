import { AdminSidebar, AdminSidebarProvider, AdminMobileSidebar, AdminMobileMenuButton } from "@/AdminSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { AdminNotifications } from "./AdminNotifications";
import { BackToTop } from "@/components/BackToTop";
import { useAdminSidebar } from "@/hooks/use-admin-sidebar";
import { Helmet } from "react-helmet-async";
import { AdminInstallPwaButton } from "@/components/pwa/AdminInstallPwaButton";
import { extractTenantSlugFromPath, buildTenantAdminPath } from "@/lib/tenant";
function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <AdminInstallPwaButton />
      <AdminNotifications />
    </div>
  );
}

function AdminShell() {
  const { collapsed } = useAdminSidebar();
  const location = useLocation();
  const sidebarWidth = collapsed ? "64px" : "256px";
  const tenantSlug = extractTenantSlugFromPath(location.pathname);
  const adminLoginUrl = buildTenantAdminPath("login", tenantSlug);
  const adminScope = tenantSlug ? `/${tenantSlug}/admin/` : "/admin/";
  const manifestUrl = `/api/admin-manifest?startUrl=${encodeURIComponent(adminLoginUrl)}&scope=${encodeURIComponent(adminScope)}`;

  return (
    // NOTE: `position: sticky` does not work reliably when any ancestor has
    // `overflow` set (including only-x overflow). Use `overflow-x-clip` to
    // prevent horizontal scroll without breaking the sticky admin header.
    <div className="flex min-h-screen overflow-x-clip">
      <Helmet>
        {/* Manifesto do PWA do admin — inicia na tela de login do painel */}
        <link rel="manifest" href={manifestUrl} />
      </Helmet>
      {/* Desktop sidebar */}
      <AdminSidebar />
      {/* Mobile sidebar drawer */}
      <AdminMobileSidebar />

      {/* Main column */}
      <div
        className="flex-1 flex min-w-0 flex-col overflow-x-clip md:pl-[var(--admin-sidebar-width)] transition-[padding]"
        style={{ ['--admin-sidebar-width' as string]: sidebarWidth }}
      >
        {/* Top header bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-4 md:px-8">
          <AdminMobileMenuButton />
          <AdminBreadcrumbs />
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>

        <main className="flex-1 bg-background p-4 md:p-8">
          <Outlet />
        </main>
        
        <footer className="mt-auto border-t bg-card px-4 py-4 text-center text-xs text-muted-foreground md:px-8">
          Desenvolvido por{' '}
          <a 
            href="https://mtsferreira.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            MTSFerreira
          </a>
        </footer>
        <BackToTop />
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminSidebarProvider>
      <AdminShell />
    </AdminSidebarProvider>
  );
}
