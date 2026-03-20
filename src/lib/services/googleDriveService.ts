import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { ApiError } from "../../server/http.js";
import type { ImageFileMeta } from "../../types/recipe.js";
import { getDriveClient, getDriveFolderId } from "./googleSheetsService.js";

type UploadRecipeImageInput = {
  fileName: string;
  mimeType: string;
  dataBase64: string;
};

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim() || "receita";
  return trimmed.replace(/[^\w.-]+/g, "-");
}

export async function uploadRecipeImage(input: UploadRecipeImageInput): Promise<ImageFileMeta> {
  const folderId = getDriveFolderId();
  if (!folderId) {
    throw new ApiError(500, "GOOGLE_DRIVE_FOLDER_ID is required for image uploads");
  }

  const data = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(data, "base64");
  if (!buffer.length) {
    throw new ApiError(400, "Image payload is empty");
  }

  const drive = await getDriveClient();
  const response = await drive.files.create({
    requestBody: {
      name: sanitizeFileName(input.fileName),
      parents: [folderId],
      mimeType: input.mimeType,
    },
    media: {
      mimeType: input.mimeType,
      body: Readable.from(buffer),
    },
    fields: "id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink",
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new ApiError(502, "Google Drive did not return a file id");
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const file = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink",
  });

  const publicUrl =
    file.data.webContentLink ||
    file.data.webViewLink ||
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;

  return {
    storage: "google_drive",
    fileId,
    fileName: file.data.name || sanitizeFileName(input.fileName),
    mimeType: file.data.mimeType || input.mimeType,
    sizeBytes: Number(file.data.size || buffer.byteLength),
    uploadedAt: new Date().toISOString(),
    publicUrl,
    thumbnailUrl: file.data.thumbnailLink || null,
    driveFolderId: folderId,
  };
}

export async function deleteRecipeImage(fileId: string) {
  if (!fileId.trim()) {
    return;
  }

  const drive = await getDriveClient();
  await drive.files.delete({ fileId });
}
