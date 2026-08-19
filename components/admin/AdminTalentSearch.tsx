"use client";

import { Search, X } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  getAdminDictionary,
  getAdminLanguage,
} from "@/lib/admin/i18n";

export function AdminTalentSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const language = getAdminLanguage(
    searchParams.get("lang"),
  );

  const dictionary =
    getAdminDictionary(language);

  const isArabic = language === "ar";

  const currentQuery =
    searchParams.get("q") ?? "";

  const [query, setQuery] =
    useState(currentQuery);

  const [isPending, startTransition] =
    useTransition();

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  function createNextUrl(
    nextQuery: string,
  ) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    const cleanQuery =
      nextQuery.trim();

    if (cleanQuery) {
      params.set("q", cleanQuery);
    } else {
      params.delete("q");
    }

    /*
     * عند تغيير البحث نعيد المستخدم إلى الصفحة الأولى،
     * مع المحافظة على اللغة والحالة وبقية الفلاتر.
     */
    params.delete("page");

    const queryString =
      params.toString();

    return queryString
      ? `${pathname}?${queryString}`
      : pathname;
  }

  function navigateToSearch(
    nextQuery: string,
  ) {
    const nextUrl =
      createNextUrl(nextQuery);

    startTransition(() => {
      router.replace(nextUrl, {
        scroll: false,
      });
    });
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    navigateToSearch(query);
  }

  function handleClear() {
    setQuery("");
    navigateToSearch("");
  }

  const hasActiveSearch =
    currentQuery.trim().length > 0;

  const canClear =
    query.length > 0 ||
    hasActiveSearch;

  return (
    <form
      onSubmit={handleSubmit}
      dir={isArabic ? "rtl" : "ltr"}
      role="search"
      aria-label={
        isArabic
          ? "البحث في ملفات المواهب"
          : "Search talent profiles"
      }
      className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30 ${
              isArabic
                ? "right-4"
                : "left-4"
            }`}
          />

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder={
              isArabic
                ? "ابحث بالاسم، رقم الجوال، الفئة أو المدينة..."
                : "Search by name, phone, category, or city..."
            }
            aria-label={
              isArabic
                ? "عبارة البحث"
                : "Search query"
            }
            autoComplete="off"
            disabled={isPending}
            className={`h-12 w-full rounded-xl border border-white/[0.08] bg-black/30 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-gold/35 focus:bg-black/40 disabled:cursor-wait disabled:opacity-60 ${
              isArabic
                ? "pr-12 pl-12"
                : "pl-12 pr-12"
            }`}
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              disabled={isPending}
              aria-label={
                isArabic
                  ? "مسح حقل البحث"
                  : "Clear search input"
              }
              className={`absolute top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-wait disabled:opacity-40 ${
                isArabic
                  ? "left-2"
                  : "right-2"
              }`}
            >
              <X
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gold/35 bg-gold/[0.08] px-6 text-sm font-medium text-gold transition hover:bg-gold hover:text-black disabled:cursor-wait disabled:opacity-55"
          >
            {isPending
              ? isArabic
                ? "جارٍ البحث..."
                : "Searching..."
              : dictionary.common.search}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={
              isPending || !canClear
            }
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/[0.08] px-6 text-sm text-white/55 transition hover:border-white/20 hover:bg-white/[0.035] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isArabic
              ? "مسح البحث"
              : "Clear search"}
          </button>
        </div>
      </div>

      {hasActiveSearch ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
          <span>
            {isArabic
              ? "نتائج البحث عن:"
              : "Search results for:"}
          </span>

          <span
            dir="auto"
            className="rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-gold"
          >
            {currentQuery}
          </span>
        </div>
      ) : null}
    </form>
  );
}