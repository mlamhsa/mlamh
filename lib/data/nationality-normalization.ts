import {
  NATIONALITIES,
  findNationality,
  getNationalityByCode,
  type NationalityDefinition,
} from "@/lib/data/nationalities";

/**
 * Legacy nationality slugs that existed before the project moved to ISO-backed
 * two-letter nationality slugs. Keep this map read-compatible until all stored
 * rows have been normalized.
 */
const LEGACY_SLUGS_BY_CODE: Record<string, string[]> = {
  SA: ["saudi"],
  AE: ["emirati"],
  BH: ["bahraini"],
  KW: ["kuwaiti"],
  QA: ["qatari"],
  OM: ["omani"],
  YE: ["yemeni"],
  IQ: ["iraqi"],
  JO: ["jordanian"],
  PS: ["palestinian"],
  SY: ["syrian"],
  LB: ["lebanese"],
  EG: ["egyptian"],
  SD: ["sudanese"],
  SO: ["somali"],
  LY: ["libyan"],
  TN: ["tunisian"],
  DZ: ["algerian"],
  MA: ["moroccan"],
  MR: ["mauritanian"],
  DJ: ["djiboutian"],
  KM: ["comorian"],
  PK: ["pakistani"],
  IN: ["indian"],
  BD: ["bangladeshi"],
  PH: ["filipino"],
  ID: ["indonesian"],
  MY: ["malaysian"],
  TR: ["turkish"],
  US: ["american"],
  GB: ["british"],
  FR: ["french"],
  DE: ["german"],
  ES: ["spanish"],
  IT: ["italian"],
};

const LEGACY_CODE_BY_VALUE = new Map<string, string>();
for (const [code, aliases] of Object.entries(LEGACY_SLUGS_BY_CODE)) {
  for (const alias of aliases) LEGACY_CODE_BY_VALUE.set(alias, code);
}

export function normalizeNationalitySearchText(value?: string | null) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function feminineArabicAlias(value: string) {
  return value.endsWith("ي") ? `${value}ة` : "";
}

export function resolveNationality(value?: string | null): NationalityDefinition | null {
  const raw = value?.trim();
  if (!raw) return null;

  const direct = findNationality(raw);
  if (direct) return direct;

  const upper = raw.toUpperCase();
  const byCode = getNationalityByCode(upper);
  if (byCode) return byCode;

  const normalized = normalizeNationalitySearchText(raw);
  const legacyCode = LEGACY_CODE_BY_VALUE.get(normalized);
  if (legacyCode) return getNationalityByCode(legacyCode);

  return (
    NATIONALITIES.find((item) => {
      const values = [
        item.ar,
        feminineArabicAlias(item.ar),
        item.en,
        item.countryAr,
        item.countryEn,
        item.code,
        item.slug,
        ...(LEGACY_SLUGS_BY_CODE[item.code] ?? []),
      ];
      return values.some((candidate) => normalizeNationalitySearchText(candidate) === normalized);
    }) ?? null
  );
}

export function normalizeNationalitySlug(value?: string | null) {
  return resolveNationality(value)?.slug ?? "";
}

export function matchesNationalitySearch(
  nationality: NationalityDefinition,
  query?: string | null,
) {
  const normalizedQuery = normalizeNationalitySearchText(query);
  if (!normalizedQuery) return true;

  const values = [
    nationality.ar,
    feminineArabicAlias(nationality.ar),
    nationality.en,
    nationality.countryAr,
    nationality.countryEn,
    nationality.code,
    nationality.slug,
    ...(LEGACY_SLUGS_BY_CODE[nationality.code] ?? []),
  ];

  return values.some((candidate) =>
    normalizeNationalitySearchText(candidate).includes(normalizedQuery),
  );
}

/**
 * Values that may still exist in nationality_slug / nationality for a canonical
 * nationality. They are intentionally simple slug-safe tokens so they can be
 * used by PostgREST filters without introducing free-text query syntax issues.
 */
export function getNationalityStorageAliases(value?: string | null) {
  const nationality = resolveNationality(value);
  if (!nationality) return [];

  return Array.from(
    new Set([
      nationality.slug,
      nationality.code.toLowerCase(),
      ...(LEGACY_SLUGS_BY_CODE[nationality.code] ?? []),
    ]),
  );
}
