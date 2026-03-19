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
    <footer className="mt-auto border-t bg-muted/30">
      <div className="container px-4 py-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <ChefHat className="h-6 w-6 text-primary" />
              )}
              <span className="font-heading text-lg font-bold">{settings.siteName}</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              {settings.siteDescription}
            </p>
          </div>

          <nav aria-label="Links públicos" className="space-y-3">
            <h2 className="text-sm font-semibold">Explorar</h2>
            <div className="flex flex-col gap-2 text-sm">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-label="Links institucionais" className="space-y-3">
            <h2 className="text-sm font-semibold">Informações</h2>
            <div className="flex flex-col gap-2 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} {settings.siteName}. Portal de receitas com catálogo,
          carrinho e checkout em evolução.
        </div>
      </div>
    </footer>
  );
}
