const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

export async function fetchMe() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  return res.json();
}
