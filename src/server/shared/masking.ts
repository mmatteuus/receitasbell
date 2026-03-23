export function maskSecret(secret: string | null | undefined, visible = 4) {
  if (!secret) return null;
  if (secret.length <= visible * 2) return `${secret.slice(0, 1)}***${secret.slice(-1)}`;
  return `${secret.slice(0, visible)}***${secret.slice(-visible)}`;
}

export function redactErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
