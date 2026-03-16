import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/receitas": "Receitas",
  "/admin/receitas/nova": "Nova Receita",
  "/admin/pagamentos": "Pagamentos",
  "/admin/pagamentos/configuracoes": "Config. Pagamentos",
  "/admin/pagamentos/transacoes": "Transações",
  "/admin/configuracoes": "Configurações",
  "/admin/configuracoes/pagina-inicial": "Página Inicial",
};

export function AdminBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  // Build breadcrumb trail
  const segments = path.split("/").filter(Boolean); // e.g. ["admin", "receitas", "nova"]
  const crumbs: { label: string; href: string }[] = [];

  let accumulated = "";
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = breadcrumbMap[accumulated];
    if (label) {
      crumbs.push({ label, href: accumulated });
    } else if (seg !== "admin") {
      // Dynamic segments like :id/editar
      if (seg === "editar") {
        crumbs.push({ label: "Editar", href: accumulated });
      } else {
        crumbs.push({ label: seg, href: accumulated });
      }
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/admin" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
