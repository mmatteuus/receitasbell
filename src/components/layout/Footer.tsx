import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";

export function Footer() {
  const { settings } = useAppContext();

  return (
    <footer className="border-t bg-muted/30 py-8 mt-auto">
      <div className="container px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteName} className="h-5 w-5 rounded object-cover" />
              ) : (
                <ChefHat className="h-5 w-5 text-primary" />
              )}
              <span className="font-heading text-lg font-bold">{settings.siteName}</span>
            </div>
            <p className="text-sm text-muted-foreground">{settings.siteDescription}</p>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Navegação</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Início</Link></li>
              <li><Link to="/buscar" className="text-muted-foreground hover:text-foreground transition-colors">Buscar</Link></li>
              <li><Link to="/minha-conta/favoritos" className="text-muted-foreground hover:text-foreground transition-colors">Favoritos</Link></li>
              <li><Link to="/carrinho" className="text-muted-foreground hover:text-foreground transition-colors">Carrinho</Link></li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Institucional</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/institucional/termos" className="text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link to="/institucional/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</Link></li>
              <li><Link to="/institucional/contato" className="text-muted-foreground hover:text-foreground transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Admin (desktop only) */}
          <div className="hidden lg:block">
            <h3 className="mb-3 text-sm font-semibold">Administração</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">Painel Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. Desenvolvido por{" "}
            <a href="https://mtsferreira.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              MtsFerreira
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
