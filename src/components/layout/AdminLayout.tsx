import { AdminSidebar, AdminSidebarProvider } from "@/AdminSidebar";
import { Link, Outlet } from "react-router-dom";
import { ChefHat, ExternalLink } from "lucide-react";

export default function AdminLayout() {
  return (
    <AdminSidebarProvider>
      <div className="flex min-h-screen">
        {/* Sticky sidebar (hidden on mobile) */}
        <AdminSidebar />

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="flex h-14 items-center gap-2 border-b bg-card px-4 overflow-x-auto md:hidden">
            <Link to="/admin" className="flex items-center gap-2 shrink-0">
              <ChefHat className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold">Admin</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm shrink-0">
              <Link to="/admin" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted">Dashboard</Link>
              <Link to="/admin/receitas" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted">Receitas</Link>
              <Link to="/admin/pagamentos" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted">Pagamentos</Link>
              <Link to="/" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </nav>
          </header>

          <main className="flex-1 bg-background p-4 md:p-8">
            <Outlet />
          </main>

          {/* Minimal copyright footer */}
          <footer className="border-t py-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Receitas do Bell. Desenvolvido por{" "}
            <a href="https://mtsferreira.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              MtsFerreira
            </a>
          </footer>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
