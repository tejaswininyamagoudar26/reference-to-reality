/** Shared upload rules for medicine photos (client + server). */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export type ImageCheck = { ok: true } | { ok: false; error: string };

export function checkImageFile(file: { type: string; size: number; name?: string }): ImageCheck {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return { ok: false, error: "Unsupported file format. Please upload a JPG, JPEG, PNG or WEBP image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "This image is larger than 10 MB. Please choose a smaller photo." };
  }
  if (file.size === 0) {
    return { ok: false, error: "This file is empty. Please choose another photo." };
  }
  return { ok: true };
}

function decodedLength(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function sniffImageType(base64: string): AllowedImageType | null {
  const head = atob(base64.slice(0, 24).replace(/[^A-Za-z0-9+/]/g, ""));
  const bytes = Array.from(head, (c) => c.charCodeAt(0));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Verifies a data URL really is an allowed image of acceptable size (checks file signature, not just the label). */
export function checkImageDataUrl(url: string): ImageCheck {
  const match = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(url);
  if (!match) return { ok: false, error: "The photo could not be read. Please upload it again." };
  const declared = match[1] ?? "";
  const base64 = match[2] ?? "";
  if (!ALLOWED_IMAGE_TYPES.includes(declared.toLowerCase() as AllowedImageType)) {
    return { ok: false, error: "Unsupported file format. Please upload a JPG, JPEG, PNG or WEBP image." };
  }
  if (decodedLength(base64) > MAX_IMAGE_BYTES) {
    return { ok: false, error: "This image is larger than 10 MB. Please choose a smaller photo." };
  }
  const actual = sniffImageType(base64);
  if (!actual) {
    return { ok: false, error: "This file doesn't look like a valid JPG, PNG or WEBP image." };
  }
  return { ok: true };
}
