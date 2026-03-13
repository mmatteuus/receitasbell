import { google, sheets_v4 } from "googleapis";
import { getGoogleEnv } from "./env.js";

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let sheetsPromise: Promise<sheets_v4.Sheets> | null = null;

async function createSheetsClient() {
  const { projectId, clientEmail, privateKey } = getGoogleEnv();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    projectId,
    scopes: SHEETS_SCOPES,
  });

  await auth.authorize();

  return google.sheets({
    version: "v4",
    auth,
  });
}

export function getSpreadsheetId() {
  return getGoogleEnv().spreadsheetId;
}

export async function getSheetsClient() {
  if (!sheetsPromise) {
    sheetsPromise = createSheetsClient();
  }

  return sheetsPromise;
}
