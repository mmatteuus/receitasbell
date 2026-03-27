import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../../../api_handlers/admin/auth/session.js";

export default async (req: VercelRequest, res: VercelResponse) => {
  return handler(req, res);
}
