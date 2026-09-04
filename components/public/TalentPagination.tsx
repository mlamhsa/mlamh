import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type TalentQuery = {
  locale: Locale;
  q?: string;
  category?: string;
  city?: string;
  gender?: string;
  nationality?: string;
  ageMin?: string;
  ageMax?: string;
  heightMin?: string;
  heightMax?: string;
  page?: number;
};

function buildTalentQueryString({
  locale,
  q,
  category,
  city,
  gender,
  nationality,
  ageMin,
  ageMax,
  heightMin,
  heightMax,
  page,
}: TalentQuery) {
  const params = new URLSearchParams();

  const values: Array<[string, string | undefined]> = [
    ["q", q],
    ["category", category],
    ["city", city],
    ["gender", gender],
    ["nationality", nationality],
    ["ageMin", ageMin],
    ["ageMax", ageMax],
    ["heightMin", heightMin],
    ["heightMax", heightMax],
  ];

  for (const [key, value] of values) {
    if (value?.trim()) params.set(key, value.trim());
  }

  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/${locale}/talent?${query}` : `/${locale}/talent`;
}

type TalentPaginationProps = Omit<TalentQuery, "page"> & {
  currentPage: number;
  totalPages: number;
};

export function TalentPagination({
  locale,
  currentPage,
  totalPages,
  q,
  category,
  city,
  gender,
  nationality,
  ageMin,
  ageMax,
  heightMin,
  heightMax,
}: TalentPaginationProps) {
  if (totalPages <= 1) return null;

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const query = {
    locale,
    q,
    category,
    city,
    gender,
    nationality,
    ageMin,
    ageMax,
    heightMin,
    heightMax,
  };

  return (
    <div className="mt-12 flex items-center justify-center gap-3">
      <Link
        href={buildTalentQueryString({ ...query, page: previousPage })}
        className={`rounded-full border px-5 py-2 text-sm transition ${
          currentPage === 1
            ? "pointer-events-none border-white/5 text-white/20"
            : "border-white/10 text-white/70 hover:border-gold/30 hover:text-gold"
        }`}
      >
        Previous
      </Link>

      <div className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70">
        Page {currentPage} of {totalPages}
      </div>

      <Link
        href={buildTalentQueryString({ ...query, page: nextPage })}
        className={`rounded-full border px-5 py-2 text-sm transition ${
          currentPage >= totalPages
            ? "pointer-events-none border-white/5 text-white/20"
            : "border-white/10 text-white/70 hover:border-gold/30 hover:text-gold"
        }`}
      >
        Next
      </Link>
    </div>
  );
}
