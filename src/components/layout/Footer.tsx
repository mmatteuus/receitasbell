import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";
// import { NewsletterForm } from "@/features/newsletter/ui/NewsletterForm";

export default function Footer() {
  return (
    <footer className="border-t bg-card font-sans">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-serif text-xl font-bold">Receitas do Bell</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Receitas caseiras testadas e aprovadas para você fazer em casa com carinho.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Categorias</h4>
            <div className="flex flex-col gap-2">
              {["Salgadas", "Massas", "Doces", "Bolos", "Bebidas", "Saudáveis"].map(
                (cat) => (
                  <Link
                    key={cat}
                    to={`/categorias/${cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {cat}
                  </Link>
                )
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Institucional</h4>
            <div className="flex flex-col gap-2">
              <Link to="/institucional/contato" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contato</Link>
              <Link to="/institucional/termos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link>
              <Link to="/institucional/privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-serif text-lg font-semibold">Newsletter</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Receba as melhores receitas e dicas exclusivas diretamente no seu e-mail.
            </p>
            {/* <NewsletterForm /> */}
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Receitas do Bell. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
