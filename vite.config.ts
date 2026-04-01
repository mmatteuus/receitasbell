import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

type DevApiRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[]>;
};

type DevApiResponse = ServerResponse & {
  status: (code: number) => DevApiResponse;
  json: (body: unknown) => DevApiResponse;
  send: (body: unknown) => DevApiResponse;
  redirect: (statusOrUrl: number | string, maybeUrl?: string) => DevApiResponse;
};

function buildQueryObject(urlValue: string) {
  const url = new URL(urlValue, 'http://localhost');
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const current = query[key];
    if (current === undefined) {
      query[key] = value;
      continue;
    }

    query[key] = Array.isArray(current) ? [...current, value] : [current, value];
  }

  return query;
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks);
  if (!rawBody.length) return undefined;

  const contentType = String(request.headers['content-type'] || '').toLowerCase();
  const text = rawBody.toString('utf8');

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function patchDevResponse(response: ServerResponse): DevApiResponse {
  const devResponse = response as DevApiResponse;

  if (!devResponse.status) {
    devResponse.status = (code: number) => {
      devResponse.statusCode = code;
      return devResponse;
    };
  }

  if (!devResponse.json) {
    devResponse.json = (body: unknown) => {
      if (!devResponse.getHeader('Content-Type')) {
        devResponse.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      devResponse.end(JSON.stringify(body));
      return devResponse;
    };
  }

  if (!devResponse.send) {
    devResponse.send = (body: unknown) => {
      if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
        return devResponse.json(body);
      }
      devResponse.end(body == null ? '' : String(body));
      return devResponse;
    };
  }

  if (!devResponse.redirect) {
    devResponse.redirect = (statusOrUrl: number | string, maybeUrl?: string) => {
      const statusCode = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
      const location = typeof statusOrUrl === 'number' ? maybeUrl || '/' : statusOrUrl;
      devResponse.statusCode = statusCode;
      devResponse.setHeader('Location', location);
      devResponse.end();
      return devResponse;
    };
  }

  return devResponse;
}

function resolveApiModule(pathname: string) {
  if (pathname === '/api/events') return '/api/events.ts';
  if (pathname === '/api/settings') return '/api/settings.ts';
  if (pathname === '/api/admin/auth/bootstrap') return '/api/admin/auth/bootstrap.ts';
  if (pathname === '/api/admin/auth/session') return '/api/admin/auth/session.ts';

  const catchallRoutes = [
    '/api/admin/::/api/admin/[...path].ts',
    '/api/auth/::/api/auth/[...path].ts',
    '/api/public/::/api/public/[...path].ts',
    '/api/payments/::/api/payments/[...path].ts',
    '/api/jobs/::/api/jobs/[...path].ts',
    '/api/health/::/api/health/[...path].ts',
    '/api/me/::/api/me/[...path].ts',
    '/api/security/::/api/security/[...path].ts',
  ];

  for (const entry of catchallRoutes) {
    const [prefix, modulePath] = entry.split('::');
    if (pathname.startsWith(prefix)) {
      return modulePath;
    }
  }

  return null;
}

function devApiPlugin() {
  return {
    name: 'dev-api-plugin',
    apply: 'serve' as const,
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname;
        const modulePath = resolveApiModule(pathname);

        if (!modulePath) {
          next();
          return;
        }

        try {
          const devRequest = request as DevApiRequest;
          devRequest.query = buildQueryObject(request.url || '/');

          const method = String(request.method || 'GET').toUpperCase();
          if (method !== 'GET' && method !== 'HEAD' && devRequest.body === undefined) {
            devRequest.body = await readRequestBody(request);
          }

          const devResponse = patchDevResponse(response);
          const loadedModule = await server.ssrLoadModule(modulePath);
          const handler = loadedModule.default;

          if (typeof handler !== 'function') {
            throw new Error(`API handler invalido para ${modulePath}`);
          }

          await handler(devRequest, devResponse);

          if (!response.writableEnded) {
            response.end();
          }
        } catch (error) {
          if (!response.headersSent) {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(
              JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : 'Erro interno ao executar rota /api em dev.',
              })
            );
            return;
          }

          next(error as Error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(loadedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    server: {
      host: '::',
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      devApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          cleanupOutdatedCaches: true,
          sourcemap: false,
          maximumFileSizeToCacheInBytes: 512 * 1024, // Increased to 512KB to avoid Workbox build failures.
          runtimeCaching: [],
          globIgnores: ['**/*.map', '**/assets/vendor-*.js'],
        },
        manifest: {
          name: 'Receitas do Bell',
          short_name: 'Receitas Bell',
          description: 'Receitas caseiras testadas e aprovadas',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/pwa/entry',
          scope: '/pwa/',
          icons: [
            {
              src: '/pwa/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa/icons/icon-maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild:
      mode === 'production'
        ? {
            drop: ['console', 'debugger'],
          }
        : undefined,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            if (id.includes('recharts') || id.includes('/d3-')) return 'charts-vendor';
            if (id.includes('html2canvas')) return 'export-vendor';
            if (id.includes('react-day-picker') || id.includes('date-fns')) return 'date-vendor';
            if (id.includes('@radix-ui')) return 'radix-vendor';
            if (id.includes('@tanstack/react-table')) return 'table-vendor';
            if (id.includes('react-router') || id.includes('@remix-run')) return 'router-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';

            return 'vendor';
          },
        },
      },
    },
  };
});
