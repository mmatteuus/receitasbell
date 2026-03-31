import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json } from '../../src/server/shared/http.js';

export default withApiHandler(
  async (_request: VercelRequest, response: VercelResponse, { requestId }) => {
    return json(response, 200, {
      status: 'live',
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
);
