import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertMethod, readJsonBody, withApiHandler, json } from '../src/server/shared/http.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { logger, requestId }) => {
    assertMethod(request, ['POST']);

    const body = await readJsonBody<{
      name?: string;
      payload?: Record<string, unknown>;
      path?: string;
      at?: string;
    }>(request);

    if (body.name) {
      logger.info('client.event', {
        eventName: body.name,
        path: body.path ?? null,
        occurredAt: body.at ?? null,
        payload: body.payload ?? null,
      });
    }

    return json(response, 202, { accepted: true, requestId });
  }
);
