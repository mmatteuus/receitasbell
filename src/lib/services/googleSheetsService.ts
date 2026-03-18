import { google, type drive_v3, type sheets_v4 } from "googleapis";
import { getGoogleEnv } from "../../server/env.js";

const SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

let authPromise: Promise<InstanceType<typeof google.auth.JWT>> | null = null;
let sheetsPromise: Promise<sheets_v4.Sheets> | null = null;
let drivePromise: Promise<drive_v3.Drive> | null = null;

async function createAuth() {
  const { projectId, clientEmail, privateKey } = getGoogleEnv();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    projectId,
    scopes: SHEETS_SCOPES,
  });

  await auth.authorize();
  return auth;
}

export async function getGoogleAuth() {
  if (!authPromise) {
    authPromise = createAuth();
  }

  return authPromise;
}

export function getSpreadsheetId() {
  return getGoogleEnv().spreadsheetId;
}

export function getDriveFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
}

export async function getSheetsClient() {
  if (!sheetsPromise) {
    sheetsPromise = getGoogleAuth().then((auth) =>
      google.sheets({
        version: "v4",
        auth,
      }),
    );
  }

  return sheetsPromise;
}

export async function getDriveClient() {
  if (!drivePromise) {
    drivePromise = getGoogleAuth().then((auth) =>
      google.drive({
        version: "v3",
        auth,
      }),
    );
  }

  return drivePromise;
}

export async function readSheetValues(range: string) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return response.data.values ?? [];
}

export async function updateSheetValues(range: string, values: string[][]) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}
