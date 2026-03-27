import { ApiError } from '../shared/http.js';

export function assertTenantOwnership(expectedTenantId: string | number, actualTenantId: string | number) {
  if (String(expectedTenantId) !== String(actualTenantId)) {
    throw new ApiError(404, 'Resource not found');
  }
}
