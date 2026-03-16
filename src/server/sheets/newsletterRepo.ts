import { ApiError } from "../http.js";
import { mutateTable, readTable } from "./table.js";
import { nowIso, sanitizeForSpreadsheet } from "./utils.js";

export async function subscribeToNewsletter(input: { email: string; name?: string; source?: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new ApiError(400, "Newsletter email is required");
  }

  const now = nowIso();

  const rows = await mutateTable("newsletter_subscribers", async (current) => {
    const index = current.findIndex((row) => row.email.trim().toLowerCase() === email);
    if (index >= 0) {
      const next = [...current];
      next[index] = {
        ...next[index],
        name: sanitizeForSpreadsheet(input.name?.trim() || next[index].name),
        status: "active",
        source: sanitizeForSpreadsheet(input.source?.trim() || next[index].source || "site"),
        updated_at: now,
        unsubscribed_at: "",
      };
      return next;
    }

    return [
      ...current,
      {
        id: crypto.randomUUID(),
        email: sanitizeForSpreadsheet(email),
        name: sanitizeForSpreadsheet(input.name?.trim() || ""),
        status: "active",
        source: sanitizeForSpreadsheet(input.source?.trim() || "site"),
        created_at: now,
        updated_at: now,
        unsubscribed_at: "",
      },
    ];
  });

  const created = rows.find((row) => row.email.trim().toLowerCase() === email)!;
  return {
    id: created.id,
    email: created.email,
    status: created.status,
  };
}

export async function listNewsletterSubscribers() {
  const rows = await readTable("newsletter_subscribers");
  return rows;
}
