import { randomUUID } from "node:crypto";

export const USER_AVATAR_BUCKET = "user-avatars";
export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
};

export function isValidAvatarMimeType(type: string): boolean {
  return type in ALLOWED_AVATAR_MIME_TYPES;
}

export function getAvatarFileExtension(type: string): string {
  return ALLOWED_AVATAR_MIME_TYPES[type] ?? "png";
}

export function buildAvatarStoragePath(userId: string, type: string): string {
  return `${userId}/${randomUUID()}.${getAvatarFileExtension(type)}`;
}

export function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    return "Kích thước ảnh đại diện phải nhỏ hơn 2MB.";
  }

  if (!isValidAvatarMimeType(file.type)) {
    return "Ảnh đại diện chỉ hỗ trợ PNG, JPG/JPEG hoặc GIF.";
  }

  return null;
}

export function buildVersionedPublicUrl(publicUrl: string, version: string): string {
  const url = new URL(publicUrl);
  url.searchParams.set("v", version);
  return url.toString();
}

export function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const bucketIndex = pathSegments.indexOf(USER_AVATAR_BUCKET);

    if (bucketIndex < 0) {
      return null;
    }

    return pathSegments.slice(bucketIndex + 1).join("/");
  } catch {
    return null;
  }
}