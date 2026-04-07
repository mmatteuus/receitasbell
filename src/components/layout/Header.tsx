import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Heart,
  ChefHat,
  Settings,
  UserCircle2,
  ListChecks,
  ShoppingBag,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/app-context';
import ThemeModeToggle from '@/components/layout/ThemeModeToggle';
import { CartButton } from '@/components/cart/CartButton';
import { InstallAppButton } from '@/components/layout/InstallAppButton';
import { buildTenantAdminPath, extractTenantSlugFromPath } from '@/lib/tenant';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/buscar', label: 'Buscar receitas', icon: Search },
  { to: '/minha-conta', label: 'Minha Conta', icon: UserCircle2 },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { categories, settings } = useAppContext();
  const tenantSlug = extractTenantSlugFromPath(pathname);
  const adminPath = buildTenantAdminPath('', tenantSlug);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Construir URL compartilhado: siteUrl + pathname atual
        const baseUrl = settings.siteUrl || window.location.origin;
        const shareUrl = `${baseUrl}${pathname}`;

        await navigator.share({
          title: settings.siteName,
          text: 'Confira receitas deliciosas no Receitas Bell!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-500 ${
        scrolled ? 'glass-strong shadow-lg shadow-black/[0.03] dark:shadow-black/20' : 'glass'
      }`}
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:h-16">
        <Link to="/" className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.siteName}
              className="h-6 w-6 rounded object-cover sm:h-7 sm:w-7"
            />
          ) : (
            <ChefHat aria-hidden="true" className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          )}
          <span className="font-heading text-lg font-bold text-foreground sm:text-xl">
            {settings.siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.icon && <link.icon aria-hidden="true" className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}

          <CartButton />

          <InstallAppButton />

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Compartilhar site"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          <div className="group relative" role="navigation" aria-label="Receitas">
            <button
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-haspopup="true"
            >
              Receitas
            </button>
            <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="w-48 rounded-lg border bg-card p-2 shadow-lg">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/categorias/${cat.slug}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <ThemeModeToggle />

          <Link to={adminPath}>
            <Button variant="outline" size="sm" className="ml-2 gap-1.5">
              <Settings aria-hidden="true" className="h-3.5 w-3.5" />
              Admin
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <CartButton mobile />
          <ThemeModeToggle compact />
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={open}
            className="p-1"
          >
            <Menu aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-full max-h-screen w-full flex-col border-none p-0 sm:max-w-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Menu de Navegação</DialogTitle>
            <DialogDescription>Acesse as principais áreas do site e sua conta.</DialogDescription>
          </DialogHeader>

          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold">{settings.siteName}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-2 hover:bg-muted"
              aria-label="Fechar menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Principal
                </p>
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Home
                </Link>
                <Link
                  to="/buscar"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${isActive('/buscar') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Search aria-hidden="true" className="h-4 w-4" /> Buscar receitas
                </Link>
                <Link
                  to="/buscar"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground`}
                >
                  <ChefHat aria-hidden="true" className="h-4 w-4" /> Receitas
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pessoal
                </p>
                <Link
                  to="/minha-conta"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${isActive('/minha-conta') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <UserCircle2 aria-hidden="true" className="h-4 w-4" /> Minha Conta
                </Link>
                <Link
                  to="/minha-conta/favoritos"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${isActive('/minha-conta/favoritos') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Heart aria-hidden="true" className="h-4 w-4" /> Favoritos
                </Link>
                <Link
                  to="/minha-conta/lista-de-compras"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${isActive('/minha-conta/lista-de-compras') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ListChecks aria-hidden="true" className="h-4 w-4" /> Lista
                </Link>
                <Link
                  to="/minha-conta/compras"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${isActive('/minha-conta/compras') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ShoppingBag aria-hidden="true" className="h-4 w-4" /> Meus Pedidos
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sistema
                </p>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Tema:</span>
                  <ThemeModeToggle compact />
                </div>

                <InstallAppButton
                  showLabel
                  className="w-full justify-start px-3"
                  context="mobile"
                />

                <button
                  onClick={() => {
                    handleShare();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Share2 aria-hidden="true" className="h-4 w-4" />
                  Compartilhar
                </button>

                <Link to={adminPath} onClick={() => setOpen(false)} className="block mt-4 px-3">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Settings aria-hidden="true" className="h-3.5 w-3.5" />
                    Painel Admin
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
}
