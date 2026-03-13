import type { VercelRequest } from "@vercel/node";
import { getIdentityEmail, requireIdentityEmail } from "./http.js";
import { findOrCreateUserByEmail } from "./sheets/usersRepo.js";

export async function resolveOptionalIdentityUser(request: VercelRequest) {
  const email = getIdentityEmail(request);
  if (!email) {
    return {
      email: null,
      user: null,
    };
  }

  return {
    email,
    user: await findOrCreateUserByEmail(email),
  };
}

export async function requireIdentityUser(request: VercelRequest, displayName?: string) {
  const email = requireIdentityEmail(request);
  return {
    email,
    user: await findOrCreateUserByEmail(email, displayName),
  };
}
