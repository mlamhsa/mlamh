import type { Talent } from "@/lib/types/talent";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

export function calculateTalentCompletion(talent: Talent): number {
  const galleryImages = normalizeGalleryImages(talent.gallery_images);

  const checks = [
    Boolean(talent.image_url),
    galleryImages.length > 0,
    Boolean(talent.name_en || talent.name_ar),
    Boolean(talent.category_en || talent.category_ar),
    Boolean(talent.city_en || talent.city_ar),
    Boolean(talent.bio_en || talent.bio_ar),
    Boolean(talent.age),
    Boolean(talent.height),
    Boolean(talent.whatsapp),
    Boolean(talent.instagram),
    Boolean(talent.tiktok),
    Boolean(talent.snapchat),
    Boolean(talent.portfolio_url),
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
}