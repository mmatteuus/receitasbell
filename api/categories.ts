import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, requireAdminAccess, sendJson, withApiHandler } from "../src/server/http.js";
import { createCategory, listCategories } from "../src/server/sheets/categoriesRepo.js";
import { categorySchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    if (request.method === "GET") {
      const categories = await listCategories();
      return sendJson(response, 200, { categories });
    }

    assertMethod(request, ["POST"]);
    requireAdminAccess(request);
    const body = categorySchema.parse(await readJsonBody(request));
    const category = await createCategory(body);
    return sendJson(response, 201, { category });
  });
}
