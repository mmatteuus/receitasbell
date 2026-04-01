import { logAuditEvent } from '../audit/repo.js';
import { Logger } from '../shared/logger.js';
import { supabaseAdmin } from '../integrations/supabase/client.js';

const logger = new Logger({ job: 'maintenance' });

const RETENTION_WINDOWS_MS = {
  oauthStates: 60 * 60 * 1000,
  magicLinks: 24 * 60 * 60 * 1000,
  sessions: 30 * 24 * 60 * 60 * 1000,
} as const;

export async function runCleanupJob() {
  logger.info('Starting retention cleanup job.');

  const oauthCutoff = new Date(Date.now() - RETENTION_WINDOWS_MS.oauthStates).toISOString();
  const magicLinksCutoff = new Date(Date.now() - RETENTION_WINDOWS_MS.magicLinks).toISOString();
  const sessionsCutoff = new Date(Date.now() - RETENTION_WINDOWS_MS.sessions).toISOString();

  const { count: oauthDeleted } = await supabaseAdmin
    .from('oauth_states')
    .delete()
    .lt('created_at', oauthCutoff);

  const { count: magicLinksDeleted } = await supabaseAdmin
    .from('magic_links')
    .delete()
    .lt('created_at', magicLinksCutoff);

  const { count: sessionsDeleted } = await supabaseAdmin
    .from('sessions')
    .delete()
    .lt('created_at', sessionsCutoff);

  const stats = {
    oauthStates: oauthDeleted ?? 0,
    magicLinks: magicLinksDeleted ?? 0,
    sessions: sessionsDeleted ?? 0,
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
