import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withApiHandler,
  assertMethod,
  getClientAddress,
  ApiError,
  noStore,
} from '../../src/server/shared/http.js';

function normalizeCspPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const input = payload as Record<string, unknown>;
  const report = ((input['csp-report'] && typeof input['csp-report'] === 'object'
    ? input['csp-report']
    : input['body']) ?? input) as Record<string, unknown>;

  return {
    documentUri: String(report['document-uri'] || report.documentURI || ''),
    blockedUri: String(report['blocked-uri'] || report.blockedURL || ''),
    violatedDirective: String(report['violated-directive'] || report.effectiveDirective || ''),
    originalPolicy: String(report['original-policy'] || report.originalPolicy || ''),
    sourceFile: String(report['source-file'] || report.sourceFile || ''),
    lineNumber: Number(report['line-number'] || report.lineNumber || 0) || null,
    columnNumber: Number(report['column-number'] || report.columnNumber || 0) || null,
    referrer: String(report.referrer || ''),
  };
}

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId, logger }) => {
    assertMethod(request, ['POST']);
    noStore(response);

    const clientAddress = getClientAddress(request);
    let body: unknown = request.body ?? {};
    if (typeof request.body === 'string') {
      try {
        body = JSON.parse(request.body || '{}');
      } catch {
        throw new ApiError(400, 'Invalid JSON payload.');
      }
    }
    const normalized = normalizeCspPayload(body);
    if (!normalized) {
      throw new ApiError(400, 'Invalid CSP report payload.');
    }

    logger.warn('security.csp_report_received', {
      action: 'security.csp_report_received',
      route: '/api/security/csp-report',
      ip: clientAddress,
      report: normalized,
      requestId,
    });

    response.status(204).end();
  }
);
