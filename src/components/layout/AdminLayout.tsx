import { AdminSidebar, AdminSidebarProvider, AdminMobileSidebar, AdminMobileMenuButton } from "@/AdminSidebar";
import { Outlet } from "react-router-dom";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { AdminNotifications } from "./AdminNotifications";
export default function AdminLayout() {
  return (
    <AdminSidebarProvider>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <AdminSidebar />
        {/* Mobile sidebar drawer */}
        <AdminMobileSidebar />

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header bar */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-4 md:px-8">
            <AdminMobileMenuButton />
            <AdminBreadcrumbs />
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
