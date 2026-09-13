"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const isArabic = pathname?.startsWith("/ar") ?? true;
  const locale = isArabic ? "ar" : "en";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-black px-5 text-white"
    >
      <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 text-center shadow-2xl sm:p-12">
        <p className="text-xs tracking-[0.35em] text-gold">MLAMH / 404</p>
        <h1 className="mt-5 text-4xl font-light sm:text-5xl">
          {isArabic ? "الصفحة غير موجودة" : "Page not found"}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/55">
          {isArabic
            ? "قد يكون الرابط قد تغيّر أو أن الصفحة لم تعد متاحة. يمكنك العودة إلى ملامح ومتابعة التصفح."
            : "The link may have changed or the page may no longer be available. Return to MLAMH and continue browsing."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:brightness-110"
          >
            {isArabic ? "العودة للرئيسية" : "Back to home"}
          </Link>
          <Link
            href={`/${locale}/talent`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm text-white/70 transition hover:border-gold/30 hover:text-gold"
          >
            {isArabic ? "استعراض المواهب" : "Browse talent"}
          </Link>
        </div>
      </section>
    </main>
  );
}
