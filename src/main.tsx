import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/contexts/app-context";
import { router } from "./router";
import "./index.css";

const routerFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
    Carregando...
  </div>
);

createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <RouterProvider router={router} fallbackElement={routerFallback} />
    <Toaster richColors position="top-right" />
  </AppProvider>,
);
