import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";

const publicLinks = [
  { to: "/", label: "Início" },
  { to: "/buscar", label: "Buscar" },
  { to: "/minha-conta/favoritos", label: "Favoritos" },
  { to: "/carrinho", label: "Carrinho" },
];

const legalLinks = [
  { to: "/institucional/termos", label: "Termos" },
  { to: "/institucional/privacidade", label: "Privacidade" },
  { to: "/institucional/contato", label: "Contato" },
];

export function Footer() {
  const { settings } = useAppContext();

  return (
    <footer className="relative mt-auto overflow-hidden border-t bg-muted/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container px-4 py-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="h-7 w-7 rounded-lg object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-600 shadow-sm">
                  <ChefHat className="h-4.5 w-4.5 text-white" />
                </div>
              )}
              <span className="font-heading text-lg font-bold">{settings.siteName}</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {settings.siteDescription}
            </p>
          </div>

          <nav aria-label="Links públicos" className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">Explorar</h2>
            <div className="flex flex-col gap-2.5 text-sm">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="link-underline w-fit text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-label="Links institucionais" className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">Informações</h2>
            <div className="flex flex-col gap-2.5 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="link-underline w-fit text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <span>© {new Date().getFullYear()} {settings.siteName}. Feito com ❤️ para quem ama cozinhar.</span>
            <span className="hidden sm:inline">•</span>
            <span>
              Desenvolvido por{' '}
              <a 
                href="https://mtsferreira.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                MtsFerreira
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
