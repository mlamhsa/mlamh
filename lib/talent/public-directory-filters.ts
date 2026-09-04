import { findNationality } from "@/lib/data/nationalities";
import { getPublicTalents, getPublishedTalents } from "@/lib/supabase/public-talents";
import type { Talent } from "@/lib/types/talent";

export type PublicTalentDirectoryFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  city?: string;
  gender?: string;
  nationality?: string;
  ageMin?: string;
  ageMax?: string;
  heightMin?: string;
  heightMax?: string;
};

const PUBLIC_CATEGORIES = new Set(["actor", "model"]);

function normalized(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function includes(value: unknown, term: string) {
  return typeof value === "string" && normalized(value).includes(normalized(term));
}

function matchesSearch(talent: Talent, search?: string) {
  const term = search?.trim();
  if (!term) return true;
  return [
    talent.name_ar,
    talent.name_en,
    talent.display_name_ar,
    talent.display_name_en,
    talent.city_ar,
    talent.city_en,
    talent.category_ar,
    talent.category_en,
  ].some((value) => includes(value, term));
}

function matchesCategory(talent: Talent, category?: string) {
  const requested = normalized(category);
  if (!requested) return true;
  if (!PUBLIC_CATEGORIES.has(requested)) return false;

  const slug = normalized(talent.category_slug);
  const ar = normalized(talent.category_ar);
  const en = normalized(talent.category_en);

  if (requested === "actor") {
    return slug === "actor" || en.includes("actor") || ar.includes("ممثل") || ar.includes("تمثيل");
  }

  return slug === "model" || en.includes("model") || ar.includes("مودل") || ar.includes("عارض");
}

function matchesCity(talent: Talent, city?: string) {
  const requested = normalized(city);
  if (!requested) return true;
  return normalized(talent.city_slug) === requested || includes(talent.city_ar, requested) || includes(talent.city_en, requested);
}

function matchesGender(talent: Talent, gender?: string) {
  const requested = normalized(gender);
  if (!requested) return true;
  return normalized(talent.gender) === requested;
}

function matchesNationality(talent: Talent, nationality?: string) {
  const requested = nationality?.trim();
  if (!requested) return true;

  const target = findNationality(requested);
  const candidate = findNationality(talent.nationality_slug) ?? findNationality(talent.nationality);

  if (target && candidate) return target.code === candidate.code;

  const legacyValues = [talent.nationality_slug, talent.nationality]
    .map(normalized)
    .filter(Boolean);
  return legacyValues.includes(normalized(requested));
}

function ageFromDob(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

function numberFilter(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasAdvancedFilters(filters: PublicTalentDirectoryFilters) {
  return Boolean(
    filters.gender?.trim() ||
      filters.nationality?.trim() ||
      filters.ageMin?.trim() ||
      filters.ageMax?.trim() ||
      filters.heightMin?.trim() ||
      filters.heightMax?.trim(),
  );
}

export async function getFilteredPublicTalents(filters: PublicTalentDirectoryFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 12, 1), 48);
  const category = normalized(filters.category);

  if (category && !PUBLIC_CATEGORIES.has(category)) {
    return { talents: [], total: 0, totalPages: 1, currentPage: page, pageSize };
  }

  if (!hasAdvancedFilters(filters)) {
    return getPublicTalents({
      page,
      pageSize,
      search: filters.search,
      category: filters.category,
      city: filters.city,
    });
  }

  const ageMin = numberFilter(filters.ageMin);
  const ageMax = numberFilter(filters.ageMax);
  const heightMin = numberFilter(filters.heightMin);
  const heightMax = numberFilter(filters.heightMax);

  const allTalents = await getPublishedTalents();
  const matching = allTalents.filter((talent) => {
    if (!matchesSearch(talent, filters.search)) return false;
    if (!matchesCategory(talent, filters.category)) return false;
    if (!matchesCity(talent, filters.city)) return false;
    if (!matchesGender(talent, filters.gender)) return false;
    if (!matchesNationality(talent, filters.nationality)) return false;

    const age = ageFromDob(talent.date_of_birth);
    if (ageMin !== null && (age === null || age < ageMin)) return false;
    if (ageMax !== null && (age === null || age > ageMax)) return false;

    const height = typeof talent.height_cm === "number" ? talent.height_cm : null;
    if (heightMin !== null && (height === null || height < heightMin)) return false;
    if (heightMax !== null && (height === null || height > heightMax)) return false;

    return true;
  });

  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;

  return {
    talents: matching.slice(from, from + pageSize),
    total,
    totalPages,
    currentPage: safePage,
    pageSize,
  };
}
