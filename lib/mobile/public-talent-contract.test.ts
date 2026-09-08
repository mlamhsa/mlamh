import assert from "node:assert/strict";
import test from "node:test";

import { toMobilePublicTalent } from "./public-talent-contract.ts";

const talent = {
  id: 77,
  user_id: "private-user-id",
  slug: "sarah-model",
  name_en: "Sarah",
  name_ar: "سارة",
  display_name_en: "Sarah A.",
  display_name_ar: "سارة أ.",
  category_en: "Model",
  category_ar: "مودل",
  category_slug: "model",
  image_url: "https://example.com/public-avatar.jpg",
  gallery_images: ["https://example.com/private-gallery.jpg"],
  photos: ["https://example.com/private-photo.jpg"],
  full_body_photos: ["https://example.com/private-body.jpg"],
  featured: true,
  sort_order: 1,
  published: true,
  verified: true,
  base_country_code: "SA" as const,
  city_en: "Riyadh",
  city_ar: "الرياض",
  gender: "female",
  date_of_birth: "2000-01-01",
  nationality: "Saudi",
  languages: ["Arabic", "English"],
  dialects: ["Najdi"],
  skills: ["Commercial modeling"],
  bio_en: "Professional model",
  bio_ar: "مودل محترفة",
  whatsapp: "+966500000000",
  instagram: "private-instagram",
  tiktok: "private-tiktok",
  snapchat: "private-snapchat",
  portfolio_url: "https://private.example.com",
  portfolio_links: ["https://private.example.com/work"],
  height_cm: 170,
  experience_years: 4,
  availability_status: "available",
  ready_to_travel: true,
  private_access_granted: true,
};

test("maps the localized public talent fields needed by native discovery", () => {
  const english = toMobilePublicTalent(talent, "en");
  const arabic = toMobilePublicTalent(talent, "ar");

  assert.equal(english.name, "Sarah A.");
  assert.equal(english.city, "Riyadh");
  assert.equal(english.bio, "Professional model");
  assert.equal(arabic.name, "سارة أ.");
  assert.equal(arabic.city, "الرياض");
  assert.equal(arabic.bio, "مودل محترفة");
  assert.equal(english.role, "model");
  assert.equal(english.featured, true);
  assert.equal(english.verified, true);
});

test("does not expose private talent media, contacts, social handles, or server access markers", () => {
  const publicTalent = toMobilePublicTalent(talent, "en") as Record<string, unknown>;
  const forbiddenKeys = [
    "user_id",
    "userId",
    "gallery_images",
    "galleryImages",
    "photos",
    "full_body_photos",
    "fullBodyPhotos",
    "whatsapp",
    "instagram",
    "tiktok",
    "snapchat",
    "portfolio_url",
    "portfolioUrl",
    "portfolio_links",
    "portfolioLinks",
    "private_access_granted",
    "privateAccessGranted",
  ];

  for (const key of forbiddenKeys) assert.equal(Object.hasOwn(publicTalent, key), false, `${key} must remain private`);
});
