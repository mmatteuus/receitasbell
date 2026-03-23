const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

export async function fetchMe() {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// Legacy helpers refactor: now proxies for server state managed in AppContext
export function getIdentityEmail() {
  // Should now be managed via AppContext state
  return null;
}

export function setIdentityEmail() {
  // Operation removed: Identity is server-side session only
}

export function clearIdentityEmail() {
  // Operation removed: Use logout endpoint
}
