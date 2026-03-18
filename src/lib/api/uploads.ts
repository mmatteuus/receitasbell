import { jsonFetch } from "./client";
import type { ImageFileMeta } from "@/types/recipe";

export async function uploadRecipeImage(input: {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}) {
  return jsonFetch<{
    imageUrl: string;
    imageFileMeta: ImageFileMeta;
  }>("/api/uploads/recipe-image", {
    method: "POST",
    admin: true,
    body: input,
  });
}

export async function deleteRecipeImage(fileId: string) {
  await jsonFetch<void>(`/api/uploads/recipe-image?fileId=${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    admin: true,
  });
}
