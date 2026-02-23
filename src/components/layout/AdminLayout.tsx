import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, List, PlusCircle, ExternalLink, ChefHat } from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/receitas", label: "Receitas", icon: List, exact: true },
  { to: "/admin/receitas/nova", label: "Criar Receita", icon: PlusCircle, exact: false },
];

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="admin-sidebar hidden w-60 flex-col md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg font-bold">Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.to
              : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          <div className="mt-auto border-t pt-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Site
            </Link>
          </div>
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:hidden">
          <Link to="/admin" className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold">Admin</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="p-2 text-muted-foreground">
                <link.icon className="h-4 w-4" />
              </Link>
            ))}
            <Link to="/" className="p-2 text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </nav>
        </header>
        <main className="flex-1 bg-background p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
