import type { VercelRequest, VercelResponse } from "@vercel/node";

import { paymentsRouter } from "../../src/server/payments/router.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  await paymentsRouter(request, response);
}
