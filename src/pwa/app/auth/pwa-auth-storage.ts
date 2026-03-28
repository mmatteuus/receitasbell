const USER_LOGIN_EMAIL_KEY = "rb_pwa_login_email_user";
const ADMIN_LOGIN_EMAIL_KEY = "rb_pwa_login_email_admin";

function readValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) || "";
}

function writeValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = value.trim();
  if (!normalized) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, normalized);
}

function clearValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

export function readPwaUserLoginEmail() {
  return readValue(USER_LOGIN_EMAIL_KEY);
}

export function persistPwaUserLoginEmail(email: string) {
  writeValue(USER_LOGIN_EMAIL_KEY, email);
}

export function clearPwaUserLoginEmail() {
  clearValue(USER_LOGIN_EMAIL_KEY);
}

export function readPwaAdminLoginEmail() {
  return readValue(ADMIN_LOGIN_EMAIL_KEY);
}

export function persistPwaAdminLoginEmail(email: string) {
  writeValue(ADMIN_LOGIN_EMAIL_KEY, email);
}

export function clearPwaAdminLoginEmail() {
  clearValue(ADMIN_LOGIN_EMAIL_KEY);
}
