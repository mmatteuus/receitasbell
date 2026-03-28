import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, withApiHandler } from "../src/server/shared/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    response.status(204).end();
  });
}
