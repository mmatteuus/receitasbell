import { isProd } from './env.js';

type CookieOpts = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAgeSeconds?: number;
};

export function setCookie(name: string, value: string, opts: CookieOpts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  parts.push(`Path=${opts.path ?? '/'}`);

  const secure = opts.secure ?? isProd;
  if (secure) parts.push('Secure');

  if (opts.httpOnly ?? false) parts.push('HttpOnly');

  const sameSite = opts.sameSite ?? 'Lax';
  parts.push(`SameSite=${sameSite}`);

  if (typeof opts.maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${Math.floor(opts.maxAgeSeconds)}`);
  }

  return parts.join('; ');
}

export function clearCookie(name: string) {
  return `${name}=; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}
