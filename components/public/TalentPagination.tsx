import Link from "next/link";
import type { Locale } from "@/lib/i18n";

function buildTalentQueryString({
  locale,
  q,
  category,
  city,
  page,
}: {
  locale: Locale;
  q?: string;
  category?: string;
  city?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (q?.trim()) {
    params.set("q", q.trim());
  }

  if (category?.trim()) {
    params.set("category", category.trim());
  }

  if (city?.trim()) {
    params.set("city", city.trim());
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/${locale}/talent?${query}` : `/${locale}/talent`;
}

type TalentPaginationProps = {
  locale: Locale;
  currentPage: number;
  totalPages: number;
  q?: string;
  category?: string;
  city?: string;
};

export function TalentPagination({
  locale,
  currentPage,
  totalPages,
  q,
  category,
  city,
}: TalentPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="mt-12 flex items-center justify-center gap-3">
      <Link
        href={buildTalentQueryString({
          locale,
          q,
          category,
          city,
          page: previousPage,
        })}
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
        href={buildTalentQueryString({
          locale,
          q,
          category,
          city,
          page: nextPage,
        })}
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