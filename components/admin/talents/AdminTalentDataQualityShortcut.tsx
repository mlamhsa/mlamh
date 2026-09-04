"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export function AdminTalentDataQualityShortcut() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = searchParams.get("lang") === "en" ? "en" : "ar";
  const ar = language === "ar";

  if (pathname !== "/admin/talents") return null;

  return (
    <div dir={ar ? "rtl" : "ltr"} className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl justify-end">
        <Link
          href={`/admin/talents/data-quality?lang=${language}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 text-xs text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-400/[0.09]"
        >
          <AlertTriangle className="h-4 w-4" />
          {ar ? "مراجعة جودة بيانات المواهب" : "Review talent data quality"}
        </Link>
      </div>
    </div>
  );
}
