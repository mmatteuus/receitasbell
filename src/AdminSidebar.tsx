import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Utensils, CreditCard, LogOut,
  ChevronLeft, ChevronRight, Moon, Sun, Menu, X, Settings, Home, FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAdmin } from "@/lib/api/adminSession";
import { buildTenantAdminPath, extractTenantSlugFromPath } from "@/lib/tenant";
import { trackEvent } from "@/lib/telemetry";
import { SidebarContext, useAdminSidebar } from "@/hooks/use-admin-sidebar";

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("rdb_admin_dark") === "true";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("rdb_admin_dark", String(dark));
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [dark]);

  return (
    <SidebarContext.Provider value={{
      collapsed, toggle: () => setCollapsed(c => !c),
      mobileOpen, setMobileOpen,
      dark, toggleDark: () => setDark(d => !d),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

/* ── Sidebar items ── */
const sidebarItems = [
  { title: "Dashboard", path: "", icon: LayoutDashboard, exact: true },
  { title: "Receitas", path: "receitas", icon: Utensils },
  { title: "Categorias", path: "categorias", icon: FolderTree },
  { title: "Pagamentos", path: "pagamentos", icon: CreditCard },
  { title: "Configurações", path: "configuracoes", icon: Settings },
  { title: "Página Inicial", path: "configuracoes/pagina-inicial", icon: Home },
];

import { InstallAppButton } from "@/pwa/components/InstallAppButton";

/* ── Sidebar nav content (shared between desktop and mobile) ── */
function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = extractTenantSlugFromPath(location.pathname);

  async function handleLogout() {
    try {
      await logoutAdmin();
      trackEvent("admin.logout");
    } catch {
      // Ignora erro de logout para não bloquear saída.
    }
    onNavigate?.();
    navigate(buildTenantAdminPath("login", tenantSlug), { replace: true });
  }

  return (
    <>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const href = buildTenantAdminPath(item.path, tenantSlug);
          const isActive = item.exact
            ? location.pathname === href
            : location.pathname.startsWith(href);

          return (
            <Link
              key={item.path || "dashboard"}
              to={href}
              aria-label={collapsed ? item.title : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md transition-colors text-sm font-medium",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {!collapsed && item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2 space-y-1">
        <DarkModeButton collapsed={collapsed} />
        {!collapsed && (
          <div className="px-1 py-1">
            <InstallAppButton context="admin" className="w-full justify-start h-9 text-xs" variant="ghost" />
          </div>
        )}
        <button
          aria-label="Sair do Admin"
          onClick={() => {
            void handleLogout();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          )}
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          {!collapsed && "Sair do Admin"}
        </button>
      </div>
    </>
  );
}

/* ── Dark mode button ── */
function DarkModeButton({ collapsed }: { collapsed: boolean }) {
  const { dark, toggleDark } = useAdminSidebar();
  return (
    <button
      onClick={toggleDark}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      className={cn(
        "flex items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
      )}
    >
      {dark ? <Sun aria-hidden="true" className="h-4 w-4 shrink-0" /> : <Moon aria-hidden="true" className="h-4 w-4 shrink-0" />}
      {!collapsed && (dark ? "Modo Claro" : "Modo Escuro")}
    </button>
  );
}

/* ── Desktop sidebar ── */
export function AdminSidebar() {
  const { collapsed, toggle } = useAdminSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 flex-col border-r bg-card transition-all duration-300 hidden md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 border-b p-4">
        <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs font-bold shrink-0">RB</span>
        {!collapsed && <h2 className="text-xl font-bold text-primary whitespace-nowrap">Admin</h2>}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight aria-hidden="true" className="h-4 w-4" /> : <ChevronLeft aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>

      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}

/* ── Mobile sidebar (drawer overlay) ── */
export function AdminMobileSidebar() {
  const { mobileOpen, setMobileOpen } = useAdminSidebar();

  return (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full invisible pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 border-b p-4">
          <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs font-bold">RB</span>
          <h2 className="text-xl font-bold text-primary">Admin</h2>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}

/* ── Mobile menu trigger ── */
export function AdminMobileMenuButton() {
  const { setMobileOpen } = useAdminSidebar();
  return (
    <button
      onClick={() => setMobileOpen(true)}
      aria-label="Abrir menu de navegação"
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
    >
      <Menu aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
