import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Menu,
  X,
  Settings,
  Home,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAdmin } from '@/lib/api/adminSession';
import { buildTenantAdminPath, extractTenantSlugFromPath } from '@/lib/tenant';
import { trackEvent } from '@/lib/telemetry';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SidebarContext, useAdminSidebar } from '@/hooks/use-admin-sidebar';

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('rdb_admin_dark') === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('rdb_admin_dark', String(dark));
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [dark]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle: () => setCollapsed((c) => !c),
        mobileOpen,
        setMobileOpen,
        dark,
        toggleDark: () => setDark((d) => !d),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/* ── Sidebar items ── */
const sidebarItems = [
  { title: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { title: 'Receitas', path: 'receitas', icon: Utensils },
  { title: 'Categorias', path: 'categorias', icon: FolderTree },
  { title: 'Financeiro', path: 'pagamentos', icon: CreditCard },
  { title: 'Configurações', path: 'configuracoes', icon: Settings },
  { title: 'Página Inicial', path: 'configuracoes/pagina-inicial', icon: Home },
];

import { InstallAppButton } from '@/pwa/components/InstallAppButton';

/* ── Sidebar nav content (shared between desktop and mobile) ── */
function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = extractTenantSlugFromPath(location.pathname);

  async function handleLogout() {
    try {
      await logoutAdmin();
      trackEvent('admin.logout');
    } catch {
      // Ignora erro de logout para não bloquear saída.
    }
    onNavigate?.();
    navigate(buildTenantAdminPath('login', tenantSlug), { replace: true });
  }

  return (
    <>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const href = buildTenantAdminPath(item.path, tenantSlug);

          // Lógica de ativação:
          // 1. Dashboard deve ser exata se for o index técnico da rdb_admin
          // 2. Outras rotas verificam se começam com o href, mas se houver uma rota mais profunda, a mais profunda ganha?
          // Simplificação: se for Dashboard ou Configurações base, exata. Se for subcaminhos de configuração etc.
          // Para esta task: Financeiro, Dashboard e Configurações são irmãos.
          const isActive =
            item.path === 'dashboard'
              ? location.pathname.endsWith('/dashboard') ||
                location.pathname.endsWith('/admin') ||
                location.pathname.endsWith('/admin/')
              : location.pathname.includes(href);

          return (
            <Link
              key={item.path || 'dashboard'}
              to={href}
              aria-label={collapsed ? item.title : undefined}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md transition-colors text-sm font-medium',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
        <button
          aria-label="Sair do Admin"
          onClick={() => {
            void handleLogout();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          )}
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sair do Admin'}
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
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'flex items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
      )}
    >
      {dark ? (
        <Sun aria-hidden="true" className="h-4 w-4 shrink-0" />
      ) : (
        <Moon aria-hidden="true" className="h-4 w-4 shrink-0" />
      )}
      {!collapsed && (dark ? 'Modo Claro' : 'Modo Escuro')}
    </button>
  );
}

/* ── Desktop sidebar ── */
export function AdminSidebar() {
  const { collapsed, toggle } = useAdminSidebar();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 hidden md:flex h-screen shrink-0 flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center gap-2 border-b p-4">
        <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs font-bold shrink-0">
          RB
        </span>
        {!collapsed && <h2 className="text-xl font-bold text-primary whitespace-nowrap">Admin</h2>}
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          )}
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
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
      <DialogContent className="fixed inset-y-0 left-0 z-50 flex h-full w-64 translate-x-0 flex-col border-r bg-card p-0 transition-transform duration-300 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 sm:max-w-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Menu Administrativo</DialogTitle>
          <DialogDescription>Acesse as ferramentas de gestão do site.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b p-4">
          <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs font-bold">
            RB
          </span>
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
      </DialogContent>
    </Dialog>
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
