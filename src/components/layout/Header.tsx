import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Heart, ChefHat, Settings, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import ThemeModeToggle from "@/components/layout/ThemeModeToggle";
import { CartButton } from "@/components/cart/CartButton";
import { buildTenantAdminPath, extractTenantSlugFromPath } from "@/lib/tenant";
import { InstallAppButton } from "@/pwa/components/InstallAppButton";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/minha-conta", label: "Minha Conta", icon: UserCircle2 },
  { to: "/minha-conta/favoritos", label: "Favoritos", icon: Heart },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { pathname } = useLocation();
  const { categories, settings } = useAppContext();
  const tenantSlug = extractTenantSlugFromPath(pathname);
  const adminPath = buildTenantAdminPath("", tenantSlug);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => setIsAppInstalled(true);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsAppInstalled(true);
    }
    setDeferredInstallPrompt(null);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-500 ${
        scrolled
          ? "glass-strong shadow-lg shadow-black/[0.03] dark:shadow-black/20"
          : "glass"
      }`}
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:h-16">
        <Link to="/" className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteName} className="h-6 w-6 rounded object-cover sm:h-7 sm:w-7" />
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
                isActive(link.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.icon && <link.icon aria-hidden="true" className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}

          <CartButton />

          <div className="group relative" role="navigation" aria-label="Categorias">
            <button
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-haspopup="true"
            >
              Categorias
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
          <button onClick={() => setOpen(!open)} aria-label="Menu de navegação" aria-expanded={open}>
            {open ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t bg-card lg:hidden">
          <nav className="container flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${
                  isActive(link.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {link.icon && <link.icon aria-hidden="true" className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
            <Link to="/minha-conta" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground">
              <UserCircle2 aria-hidden="true" className="h-4 w-4" /> Minha Conta
            </Link>
            <CartButton onClick={() => setOpen(false)} />
            <div className="my-2 border-t" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categorias</p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/categorias/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <span>{cat.name}</span>
              </Link>
            ))}
            <div className="my-2 border-t" />
            <ThemeModeToggle className="w-full justify-start" onClick={() => setOpen(false)} />
            <div className="mt-3">
              <InstallAppButton context="user" className="w-full justify-center" variant="outline" />
            </div>
            <div className="my-2 border-t" />
            <Link to={adminPath} onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Settings aria-hidden="true" className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
