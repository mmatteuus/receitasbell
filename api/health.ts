import type { VercelRequest, VercelResponse } from "@vercel/node";
import healthLive from "../api_handlers/health/live.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return healthLive(req, res);
}
