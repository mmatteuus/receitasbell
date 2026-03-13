import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, requireAdminAccess, sendJson, withApiHandler } from "../src/server/http.js";
import { getSettingsMap, mapTypedSettings, saveSettings } from "../src/server/sheets/settingsRepo.js";
import { settingsSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    if (request.method === "GET") {
      const settings = mapTypedSettings(await getSettingsMap());
      return sendJson(response, 200, { settings });
    }

    assertMethod(request, ["PUT"]);
    requireAdminAccess(request);
    const body = settingsSchema.parse(await readJsonBody(request));
    const normalized = Object.fromEntries(
      Object.entries(body.settings).map(([key, value]) => [key, value === null ? "" : String(value)]),
    );
    const settings = mapTypedSettings(await saveSettings(normalized));
    return sendJson(response, 200, { settings });
  });
}
