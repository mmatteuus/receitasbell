export function maskSecret(secret: string | null | undefined, visible = 4) {
  if (!secret) return null;
  const s = String(secret);
  if (s.length <= visible * 2) return `${s.slice(0, 1)}***${s.slice(-1)}`;
  return `${s.slice(0, visible)}***${s.slice(-visible)}`;
}

export function redactErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

const SENSITIVE_KEYS = [
  'password', 'secret', 'token', 'key', 'cookie', 
  'cvv', 'card_number', 'access_token', 'refresh_token',
  'mp_access_token', 'mp_public_key', 'mp_webhook_secret',
  'api_key', 'authorization', 'client_secret',
  'stripe', 'supabase'
];

export function sanitize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk));
    
    if (isSensitive) {
      if (typeof value === 'string') {
        sanitized[key] = maskSecret(value);
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}
