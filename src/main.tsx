import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { AppProvider } from '@/contexts/app-provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ServiceWorkerScopeGuard } from '@/components/ServiceWorkerScopeGuard';
import { PWAUpdateHandler } from '@/components/PWAUpdateHandler';
import { AppRouter } from './router';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/700.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppProvider>
          <ServiceWorkerScopeGuard />
          <PWAUpdateHandler />
          <AppRouter />
          <Toaster richColors position="top-right" />
        </AppProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
