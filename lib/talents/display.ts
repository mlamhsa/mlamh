import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

export type TalentDisplay = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
};

export type TalentSocialLink = {
  id: "instagram" | "tiktok" | "snapchat" | "portfolio";
  href: string;
  label: string;
};

export type TalentProfileDisplay = TalentDisplay & {
  city: string | null;
  age: number | null;
  height: string | null;
  bio: string | null;
  whatsapp: string | null;
  galleryImages: string[];
  socialLinks: TalentSocialLink[];
};

function trimString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseGalleryImages(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        return parseGalleryImages(JSON.parse(trimmed) as unknown);
      } catch {
        return [];
      }
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function toTalentDisplay(talent: Talent, locale: Locale): TalentDisplay {
  const isAr = locale === "ar";
  return {
    id: talent.id,
    name: isAr ? talent.name_ar : talent.name_en,
    category: isAr ? talent.category_ar : talent.category_en,
    imageUrl: talent.image_url,
  };
}

export function buildSocialLinks(
  talent: Talent,
  labels: {
    instagram: string;
    tiktok: string;
    snapchat: string;
    portfolio: string;
  },
): TalentSocialLink[] {
  const links: TalentSocialLink[] = [];

  const instagram = trimString(talent.instagram);
  if (instagram) {
    links.push({
      id: "instagram",
      href: normalizeExternalUrl(instagram),
      label: labels.instagram,
    });
  }

  const tiktok = trimString(talent.tiktok);
  if (tiktok) {
    links.push({
      id: "tiktok",
      href: normalizeExternalUrl(tiktok),
      label: labels.tiktok,
    });
  }

  const snapchat = trimString(talent.snapchat);
  if (snapchat) {
    links.push({
      id: "snapchat",
      href: normalizeExternalUrl(snapchat),
      label: labels.snapchat,
    });
  }

  const portfolio = trimString(talent.portfolio_url);
  if (portfolio) {
    links.push({
      id: "portfolio",
      href: normalizeExternalUrl(portfolio),
      label: labels.portfolio,
    });
  }

  return links;
}

export function toTalentProfileDisplay(
  talent: Talent,
  locale: Locale,
  socialLabels: {
    instagram: string;
    tiktok: string;
    snapchat: string;
    portfolio: string;
  },
): TalentProfileDisplay {
  const isAr = locale === "ar";
  const city = (isAr ? talent.city_ar : talent.city_en) ?? null;
  const bio = (isAr ? talent.bio_ar : talent.bio_en) ?? null;

  return {
    ...toTalentDisplay(talent, locale),
    city: typeof city === "string" && city.trim() ? city.trim() : null,
    age: talent.age ?? null,
    height:
      typeof talent.height === "string" && talent.height.trim()
        ? talent.height.trim()
        : null,
    bio: typeof bio === "string" && bio.trim() ? bio.trim() : null,
    whatsapp:
      typeof talent.whatsapp === "string" && talent.whatsapp.trim()
        ? talent.whatsapp.trim()
        : null,
    galleryImages: parseGalleryImages(talent.gallery_images),
    socialLinks: buildSocialLinks(talent, socialLabels),
  };
}

export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
