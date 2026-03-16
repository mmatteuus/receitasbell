const IDENTITY_COOKIE = "rb_user_email";
const IDENTITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasWindow() {
  return typeof window !== "undefined";
}

function parseCookie(name: string) {
  if (!hasWindow()) return null;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!entry) return null;
  return decodeURIComponent(entry.slice(name.length + 1));
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function getIdentityEmail() {
  const value = parseCookie(IDENTITY_COOKIE);
  return value ? normalizeEmail(value) : null;
}

export function setIdentityEmail(email: string) {
  if (!hasWindow()) return;
  const normalized = normalizeEmail(email);
  document.cookie = `${IDENTITY_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${IDENTITY_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearIdentityEmail() {
  if (!hasWindow()) return;
  document.cookie = `${IDENTITY_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function ensureIdentityEmail(message = "Digite seu e-mail para salvar seus dados no ReceitasBell.") {
  const current = getIdentityEmail();
  if (current) return current;
  if (!hasWindow()) return null;
  // Legacy fallback: identity capture now happens through the app dialog.
  console.warn(message);
  return null;
}
