import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { AppProvider } from "@/contexts/app-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "./router";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const routerFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
    Carregando...
  </div>
);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppProvider>
          <RouterProvider router={router} fallbackElement={routerFallback} />
          <Toaster richColors position="top-right" />
        </AppProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
