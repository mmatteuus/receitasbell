import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/admin-manifest?startUrl=...&scope=...
 * Gera o manifesto PWA do painel admin dinamicamente,
 * com start_url e scope ajustados ao tenant do admin.
 */
export default function handler(request: VercelRequest, response: VercelResponse) {
  const url = new URL(request.url || '/', 'http://localhost');
  const startUrl = url.searchParams.get('startUrl') || '/pwa/admin/entry';
  const scope = url.searchParams.get('scope') || '/pwa/';

  // Sanitizar: só aceitar caminhos relativos internos
  const safeStartUrl = startUrl.startsWith('/') && !startUrl.startsWith('//') ? startUrl : '/pwa/admin/entry';
  const safeScope = scope.startsWith('/') && !scope.startsWith('//') ? scope : '/pwa/';

  const manifest = {
    name: 'Receitas Bell — Admin',
    short_name: 'Bell Admin',
    description: 'Painel administrativo do Receitas Bell',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: safeStartUrl,
    scope: safeScope,
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
  };

  response.setHeader('Content-Type', 'application/manifest+json');
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json(manifest);
}
