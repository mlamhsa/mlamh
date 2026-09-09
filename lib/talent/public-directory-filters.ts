import { getPublicTalents } from "@/lib/supabase/public-talents";
import { applyActiveFeaturedTalentEntitlements } from "@/lib/talent/public-featured-entitlements";

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
  language?: string;
  dialect?: string;
  skill?: string;
  availability?: string;
  readyToTravel?: string;
};

const PUBLIC_CATEGORIES = new Set(["actor", "model"]);
const PUBLIC_GENDERS = new Set(["male", "female"]);

function normalized(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function numberFilter(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getFilteredPublicTalents(filters: PublicTalentDirectoryFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 12, 1), 48);
  const category = normalized(filters.category);
  const gender = normalized(filters.gender);

  if (category && !PUBLIC_CATEGORIES.has(category)) {
    return { talents: [], total: 0, totalPages: 1, currentPage: page, pageSize };
  }
  if (gender && !PUBLIC_GENDERS.has(gender)) {
    return { talents: [], total: 0, totalPages: 1, currentPage: page, pageSize };
  }

  const ageMin = numberFilter(filters.ageMin);
  const ageMax = numberFilter(filters.ageMax);
  const heightMin = numberFilter(filters.heightMin);
  const heightMax = numberFilter(filters.heightMax);

  if (
    (filters.ageMin?.trim() && ageMin === null) ||
    (filters.ageMax?.trim() && ageMax === null) ||
    (filters.heightMin?.trim() && heightMin === null) ||
    (filters.heightMax?.trim() && heightMax === null) ||
    (ageMin !== null && ageMax !== null && ageMin > ageMax) ||
    (heightMin !== null && heightMax !== null && heightMin > heightMax)
  ) {
    return { talents: [], total: 0, totalPages: 1, currentPage: page, pageSize };
  }

  const result = await getPublicTalents({
    page,
    pageSize,
    search: filters.search,
    category: filters.category,
    city: filters.city,
    gender: gender || undefined,
    nationality: filters.nationality,
    ageMin,
    ageMax,
    heightMin,
    heightMax,
    language: filters.language,
    dialect: filters.dialect,
    skill: filters.skill,
    availability: filters.availability,
    readyToTravel: filters.readyToTravel === "true" ? true : undefined,
  });

  return {
    ...result,
    talents: await applyActiveFeaturedTalentEntitlements(result.talents),
  };
}
