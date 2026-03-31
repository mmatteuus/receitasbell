import { fetchBaserow, BASEROW_TABLES } from '../integrations/baserow/client.js';
import { logAuditEvent } from '../audit/repo.js';
import { Logger } from '../shared/logger.js';

const logger = new Logger({ job: 'maintenance' });

const RETENTION_WINDOWS_MS = {
  oauthStates: 60 * 60 * 1000,
  magicLinks: 24 * 60 * 60 * 1000,
  sessions: 30 * 24 * 60 * 60 * 1000,
} as const;

type OAuthStateRow = {
  id?: string | number;
  created_at?: string;
};

type CleanupRow = {
  id?: string | number;
};

async function deleteRows(tableId: string | undefined, rows: CleanupRow[]) {
  if (!tableId) return;

  await Promise.all(
    rows
      .filter((row) => row.id != null)
      .map((row) =>
        fetchBaserow(`/api/database/rows/table/${tableId}/${row.id}/?user_field_names=true`, {
          method: 'DELETE',
        })
      )
  );
}

async function cleanupByCreatedAt(tableId: string | undefined, cutoffIso: string) {
  if (!tableId) return 0;

  const rows = await fetchBaserow<{ results: CleanupRow[] }>(
    `/api/database/rows/table/${tableId}/?user_field_names=true&filter__created_at__lt=${encodeURIComponent(cutoffIso)}`,
    {},
    { endpoint: `cleanup:${tableId}`, idempotent: true }
  );

  await deleteRows(tableId, rows.results || []);
  return rows.results?.length ?? 0;
}

export async function runCleanupJob() {
  logger.info('Starting retention cleanup job.');

  const oauthCutoff = new Date(Date.now() - RETENTION_WINDOWS_MS.oauthStates).toISOString();
  const magicLinksCutoff = new Date(Date.now() - RETENTION_WINDOWS_MS.magicLinks).toISOString();
  const sessionsCutoff = new Date(Date.now() - RETENTION_WINDOWS_MS.sessions).toISOString();

  const oauthRows = BASEROW_TABLES.OAUTH_STATES
    ? await fetchBaserow<{ results: OAuthStateRow[] }>(
        `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true&filter__created_at__lt=${encodeURIComponent(oauthCutoff)}`,
        {},
        { endpoint: 'cleanup:oauth_states', idempotent: true }
      )
    : { results: [] };

  await deleteRows(BASEROW_TABLES.OAUTH_STATES, oauthRows.results || []);

  const stats = {
    oauthStates: oauthRows.results?.length ?? 0,
    magicLinks: await cleanupByCreatedAt(BASEROW_TABLES.MAGIC_LINKS, magicLinksCutoff),
    sessions: await cleanupByCreatedAt(BASEROW_TABLES.SESSIONS, sessionsCutoff),
  };

  const total = stats.oauthStates + stats.magicLinks + stats.sessions;

  if (total > 0) {
    logger.info('Retention cleanup removed legacy records.', stats);
  }

  await logAuditEvent({
    actorType: 'system',
    actorId: '0',
    action: 'job_cleanup',
    resourceType: 'system',
    payload: { status: 'completed', total, ...stats },
  });

  return { success: true, total, ...stats };
}

export async function runConsistencyJob() {
  logger.info('Starting catalog consistency check...');
  // Placeholder for future consistency logic (e.g. orphan recipes check)
  await logAuditEvent({
    actorType: 'system',
    actorId: '0',
    action: 'job_consistency',
    resourceType: 'system',
    payload: { status: 'completed' },
  });
  return { success: true };
}
