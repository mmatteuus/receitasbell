import type { ImageFileMeta } from "@/types/recipe";

export function createImagePreview(file: File) {
  return URL.createObjectURL(file);
}

export function revokeImagePreview(previewUrl: string | null | undefined) {
  if (!previewUrl) {
    return;
  }

  URL.revokeObjectURL(previewUrl);
}

export function buildFallbackImageMeta(file: File, publicUrl: string): ImageFileMeta {
  return {
    storage: "fallback",
    fileId: `fallback-${crypto.randomUUID()}`,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    publicUrl,
    thumbnailUrl: publicUrl,
  };
}
