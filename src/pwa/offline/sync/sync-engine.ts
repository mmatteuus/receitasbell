import { requestOutboxReplay } from "../outbox/replay";
import { runOfflineSanityCheck } from "../db/open-db";

export async function syncNow() {
  await runOfflineSanityCheck();
  await requestOutboxReplay();
}
