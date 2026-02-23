import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold">Receitas do Bell</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Receitas caseiras testadas e aprovadas para você fazer em casa com carinho.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold">Categorias</h4>
            <div className="flex flex-col gap-1.5">
              {["Salgadas", "Massas", "Doces", "Bolos", "Bebidas", "Saudáveis"].map(
                (cat) => (
                  <Link
                    key={cat}
                    to={`/categorias/${cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {cat}
                  </Link>
                )
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold">Institucional</h4>
            <div className="flex flex-col gap-1.5">
              <Link to="/institucional/contato" className="text-sm text-muted-foreground hover:text-primary">Contato</Link>
              <Link to="/institucional/termos" className="text-sm text-muted-foreground hover:text-primary">Termos de Uso</Link>
              <Link to="/institucional/privacidade" className="text-sm text-muted-foreground hover:text-primary">Privacidade</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Receitas do Bell. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
