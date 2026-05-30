import type { Talent } from "@/lib/types/talent";

function hasValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

export function calculateProfileCompletion(
  talent: Partial<Talent>
) {
  let score = 0;

  if (hasValue(talent.image_url)) score += 20;

  if (hasValue(talent.city_en) || hasValue(talent.city_ar))
    score += 10;

  if (hasValue(talent.bio_en) || hasValue(talent.bio_ar))
    score += 20;

  if (hasValue(talent.instagram))
    score += 10;

  if (hasValue(talent.tiktok))
    score += 10;

  if (hasValue(talent.portfolio_url))
    score += 10;

  if (hasValue(talent.availability_status))
    score += 10;

  if (
    Array.isArray(talent.gallery_images) &&
    talent.gallery_images.length > 0
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}