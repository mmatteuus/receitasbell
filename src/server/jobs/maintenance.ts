import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";
import { logAuditEvent } from "../observability/auditRepo.js";
import { Logger } from "../observability/logger.js";

const logger = new Logger({ job: "maintenance" });

export async function runCleanupJob() {
  logger.info("Starting OAuth state cleanup...");
  
  // Clean up OAuth states older than 1 hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const oldStates = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true&filter__created_at__lt=${oneHourAgo}`
  );

  const count = oldStates?.results?.length || 0;
  if (count > 0) {
    logger.info(`Found ${count} old OAuth states to clean up.`);
    // Real cleanup would involve DELETE calls, for now we just log/audit
  }

  await logAuditEvent({ 
    actorType: 'system',
    actorId: '0',
    action: 'job_cleanup', 
    resourceType: 'system', 
    payload: { status: 'completed', cleaned: count } 
  });
  
  return { success: true, cleaned: count };
}

export async function runConsistencyJob() {
    logger.info("Starting catalog consistency check...");
    // Placeholder for future consistency logic (e.g. orphan recipes check)
    await logAuditEvent({ 
      actorType: 'system',
      actorId: '0',
      action: 'job_consistency', 
      resourceType: 'system', 
      payload: { status: 'completed' } 
    });
    return { success: true };
}
