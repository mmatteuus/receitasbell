export function hasUpdatedAtConflict(localBaseUpdatedAt?: string | null, serverUpdatedAt?: string | null) {
  if (!localBaseUpdatedAt || !serverUpdatedAt) {
    return false;
  }

  return localBaseUpdatedAt !== serverUpdatedAt;
}
