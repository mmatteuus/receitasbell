// src/server/integrations/baserow/client.ts
import { env } from "../../shared/env.js";
import { BASEROW_TABLES } from "./tables.js";

export class BaserowError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "BaserowError";
  }
}

export async function baserowFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = (env.BASEROW_API_URL || "https://api.baserow.io").replace(/\/$/, "");
  const url = `${base}${path}`;
  
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Token ${env.BASEROW_API_TOKEN}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new BaserowError(res.status, `Baserow HTTP ${res.status}`, data);
    }

    return data as T;
  } finally {
    clearTimeout(t);
  }
}

// Alias legado para compatibilidade durante a migração
export const fetchBaserow = baserowFetch;
export { BASEROW_TABLES };
