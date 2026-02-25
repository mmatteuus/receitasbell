import { AdminSidebar } from "@/AdminSidebar";
import { Link, Outlet } from "react-router-dom";
import { ChefHat, ExternalLink } from "lucide-react";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:hidden">
          <Link to="/admin" className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold">Admin</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            {/* This part will be different from the main sidebar, so we can keep it */}
            <Link to="/admin" className="p-2 text-muted-foreground">Dashboard</Link>
            <Link to="/admin/receitas" className="p-2 text-muted-foreground">Receitas</Link>
            <Link to="/admin/pagamentos" className="p-2 text-muted-foreground">Pagamentos</Link>
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
