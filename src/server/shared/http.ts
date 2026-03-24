import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { env } from "./env.js";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function assertMethod(req: VercelRequest, allowed: string[]) {
  const m = (req.method ?? "GET").toUpperCase();
  if (!allowed.includes(m)) throw new ApiError(405, `Method ${m} not allowed`);
}

export function requireCronAuth(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${env.CRON_SECRET}`) throw new ApiError(401, "Unauthorized");
}

export function noStore(res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
}

export function json(res: VercelResponse, status: number, body: unknown) {
  noStore(res);
  res.status(status).json(body);
}

export function requestId(req: VercelRequest) {
  const existing = req.headers["x-vercel-id"];
  if (typeof existing === "string" && existing) return existing;
  return crypto.randomUUID();
}

export async function withApiHandler(
  req: VercelRequest,
  res: VercelResponse,
  handler: (ctx: { requestId: string }) => Promise<void>
) {
  const rid = requestId(req);
  res.setHeader("x-request-id", rid);
  try {
    await handler({ requestId: rid });
  } catch (e: any) {
    if (e instanceof ApiError) return json(res, e.status, { success: false, error: { message: e.message, details: e.details ?? null }, requestId: rid });
    return json(res, 500, { success: false, error: { message: "Internal server error" }, requestId: rid });
  }
}
