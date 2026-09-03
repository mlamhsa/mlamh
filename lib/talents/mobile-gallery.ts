import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "talent-gallery";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 12;
const MIME_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function getTalent(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("talents").select("id,gallery_images,image_url").eq("user_id", userId).maybeSingle();
  if (error) return { ok: false as const, code: "LOOKUP_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };
  const gallery = Array.isArray(data.gallery_images) ? data.gallery_images.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  return { ok: true as const, supabase, talentId: Number(data.id), gallery, imageUrl: typeof data.image_url === "string" ? data.image_url : null };
}

function getOwnedPath(talentId: number, gallery: string[], url: unknown) {
  if (typeof url !== "string" || !gallery.includes(url)) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return null;
  const path = decodeURIComponent(url.slice(markerIndex + marker.length));
  if (!path.startsWith(`${talentId}/`) || path.includes("..")) return null;
  return path;
}

export async function createMobileGalleryUpload({ userId, mimeType, size }: { userId: string; mimeType: unknown; size: unknown }) {
  if (typeof mimeType !== "string" || !MIME_EXTENSIONS[mimeType]) return { ok: false as const, code: "UNSUPPORTED_FILE_TYPE" as const };
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) return { ok: false as const, code: "FILE_TOO_LARGE" as const };
  const talent = await getTalent(userId); if (!talent.ok) return talent;
  if (talent.gallery.length >= MAX_GALLERY_IMAGES) return { ok: false as const, code: "GALLERY_LIMIT" as const };
  const path = `${talent.talentId}/${Date.now()}-${randomUUID()}.${MIME_EXTENSIONS[mimeType]}`;
  const { data, error } = await talent.supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) return { ok: false as const, code: "SIGNED_URL_FAILED" as const };
  return { ok: true as const, bucket: BUCKET, path, token: data.token, maxBytes: MAX_IMAGE_BYTES };
}

export async function finalizeMobileGalleryUpload({ userId, path }: { userId: string; path: unknown }) {
  if (typeof path !== "string" || path.length > 240) return { ok: false as const, code: "INVALID_PATH" as const };
  const talent = await getTalent(userId); if (!talent.ok) return talent;
  const prefix = `${talent.talentId}/`;
  if (!path.startsWith(prefix) || !/\.(jpg|jpeg|png|webp)$/i.test(path)) return { ok: false as const, code: "INVALID_PATH" as const };
  const fileName = path.slice(prefix.length); if (!fileName || fileName.includes("/")) return { ok: false as const, code: "INVALID_PATH" as const };
  const { data: objects, error: listError } = await talent.supabase.storage.from(BUCKET).list(String(talent.talentId), { limit: 20, search: fileName });
  if (listError || !objects?.some((item) => item.name === fileName)) return { ok: false as const, code: "UPLOAD_NOT_FOUND" as const };
  const { data: publicData } = talent.supabase.storage.from(BUCKET).getPublicUrl(path); const publicUrl = publicData.publicUrl;
  if (talent.gallery.includes(publicUrl)) return { ok: true as const, url: publicUrl, gallery: talent.gallery };
  if (talent.gallery.length >= MAX_GALLERY_IMAGES) { await talent.supabase.storage.from(BUCKET).remove([path]); return { ok: false as const, code: "GALLERY_LIMIT" as const }; }
  const gallery = [...talent.gallery, publicUrl];
  const { error: updateError } = await talent.supabase.from("talents").update({ gallery_images: gallery }).eq("id", talent.talentId);
  if (updateError) { await talent.supabase.storage.from(BUCKET).remove([path]); return { ok: false as const, code: "UPDATE_FAILED" as const }; }
  return { ok: true as const, url: publicUrl, gallery };
}

export async function setMobileGalleryPrimary({ userId, url }: { userId: string; url: unknown }) {
  const talent = await getTalent(userId); if (!talent.ok) return talent;
  const path = getOwnedPath(talent.talentId, talent.gallery, url); if (!path || typeof url !== "string") return { ok: false as const, code: "IMAGE_NOT_FOUND" as const };
  const { error } = await talent.supabase.from("talents").update({ image_url: url }).eq("id", talent.talentId);
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  return { ok: true as const, url };
}

export async function deleteMobileGalleryImage({ userId, url }: { userId: string; url: unknown }) {
  const talent = await getTalent(userId); if (!talent.ok) return talent;
  const path = getOwnedPath(talent.talentId, talent.gallery, url); if (!path || typeof url !== "string") return { ok: false as const, code: "IMAGE_NOT_FOUND" as const };
  const gallery = talent.gallery.filter((item) => item !== url);
  const primaryUrl = talent.imageUrl === url ? (gallery[0] ?? null) : talent.imageUrl;
  const { error: updateError } = await talent.supabase.from("talents").update({ gallery_images: gallery, image_url: primaryUrl }).eq("id", talent.talentId);
  if (updateError) return { ok: false as const, code: "UPDATE_FAILED" as const };
  await talent.supabase.storage.from(BUCKET).remove([path]);
  return { ok: true as const, gallery, primaryUrl };
}
