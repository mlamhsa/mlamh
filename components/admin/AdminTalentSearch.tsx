"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminTalentSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  function updateSearch(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `/admin?${params.toString()}` : "/admin";

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch(query);
  }

  function handleClear() {
    setQuery("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");

    const nextUrl = params.toString() ? `/admin?${params.toString()}` : "/admin";

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 sm:flex-row">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search talents..."
        disabled={isPending}
        className="w-full rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/40 disabled:cursor-wait disabled:opacity-60"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-gold/40 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold hover:bg-gold/10 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Searching..." : "Search"}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={isPending || !query}
          className="rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </form>
  );
}