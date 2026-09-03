import { createAdminClient } from "@/lib/supabase/admin";

export const TALENT_GALLERY_BUCKET = "talent-gallery";
const DEFAULT_SIGNED_URL_TTL_SECONDS = 15 * 60;
type AdminClient = ReturnType<typeof createAdminClient>;

export function getTalentGalleryPath(reference: unknown): string | null {
  if (typeof reference !== "string" || reference.length === 0 || reference.length > 2048) return null;

  let pathname = reference;
  try {
    if (/^https?:\/\//i.test(reference)) pathname = new URL(reference).pathname;
  } catch {
    return null;
  }

  const marker = new RegExp(`/storage/v1/object/(?:public|sign|authenticated)/${TALENT_GALLERY_BUCKET}/(.+)$`);
  const match = pathname.match(marker);
  if (!match?.[1]) return null;

  let path: string;
  try { path = decodeURIComponent(match[1]); } catch { return null; }
  if (!/^\d+\/[^/]+$/.test(path) || path.includes("..")) return null;
  return path;
}

export function findCanonicalTalentGalleryReference(references: string[], candidate: unknown): { reference: string; path: string } | null {
  const candidatePath = getTalentGalleryPath(candidate);
  if (!candidatePath) return null;
  for (const reference of references) {
    const path = getTalentGalleryPath(reference);
    if (path === candidatePath) return { reference, path };
  }
  return null;
}

export async function signTalentMediaReference(reference: unknown, admin: AdminClient = createAdminClient(), expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS): Promise<string | null> {
  const path = getTalentGalleryPath(reference);
  if (!path) return null;
  const { data, error } = await admin.storage.from(TALENT_GALLERY_BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function signTalentMediaReferences(references: string[], admin: AdminClient = createAdminClient(), expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS): Promise<string[]> {
  const unique = [...new Set(references)];
  const signed = await Promise.all(unique.map((reference) => signTalentMediaReference(reference, admin, expiresIn)));
  return signed.filter((value): value is string => Boolean(value));
}
