import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../src/server/http.js";
import { subscribeToNewsletter } from "../src/server/sheets/newsletterRepo.js";
import { newsletterSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const body = newsletterSchema.parse(await readJsonBody(request));
    const subscriber = await subscribeToNewsletter(body);
    return sendJson(response, 201, { subscriber });
  });
}
