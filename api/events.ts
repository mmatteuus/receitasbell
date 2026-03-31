import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, withApiHandler } from "../src/server/shared/http.js";

export default withApiHandler(async (request: VercelRequest, response: VercelResponse) => {
  assertMethod(request, ["POST"]);
  response.status(204).end();
});
