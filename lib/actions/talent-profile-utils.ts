import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";

export const ALLOWED_AVAILABILITY = new Set([
  "available_now",
  "available_this_week",
  "available_next_month",
  "unavailable",
]);

export function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function requiredStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : null;
}

export function nullableNumberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function booleanValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "1" || value === "on";
}

export function dateValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value || null;
}

export function stringArrayValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    );
  } catch {
    return [];
  }
}

export function availabilityValue(formData: FormData) {
  const value = stringValue(formData, "availability_status");
  return ALLOWED_AVAILABILITY.has(value) ? value : "available_now";
}

export function getSelectedCity(formData: FormData) {
  const citySlug = requiredStringValue(formData, "city_slug");
  const city = SAUDI_CITIES.find((item) => item.slug === citySlug);

  if (!city) {
    throw new Error("Invalid city selected.");
  }

  return {
    city_slug: city.slug,
    city_ar: city.ar,
    city_en: city.en,
  };
}

export function getSelectedCategory(formData: FormData) {
  const categorySlug = requiredStringValue(formData, "category_slug");
  const category = TALENT_CATEGORIES.find(
    (item) => item.slug === categorySlug
  );

  if (!category) {
    throw new Error("Invalid category selected.");
  }

  return {
    category_slug: category.slug,
    category_ar: category.ar,
    category_en: category.en,
  };
}

export function createDisplayName(value: string) {
  return value.trim().split(/\s+/).filter(Boolean)[0] ?? value.trim();
}

export function createSlug(value: string, id: number) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[\`'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base ? `${base}-${id}` : `talent-${id}`;
}