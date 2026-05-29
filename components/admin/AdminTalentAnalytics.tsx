import Image from "next/image";
import Link from "next/link";
import type { TopViewedTalent } from "@/lib/supabase/admin-talent-analytics";

export function AdminTalentAnalytics({
  topViewedTalents,
}: {
  topViewedTalents: TopViewedTalent[];
}) {
  if (topViewedTalents.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
            Analytics
          </p>

          <h2 className="mt-2 text-2xl font-light text-white">
            Top Viewed Talents
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {topViewedTalents.map((talent, index) => (
          <Link
            key={talent.id}
            href={`/admin/talents/${talent.id}/edit`}
            className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 transition hover:border-gold/30"
          >
            <div className="relative aspect-[3/4] bg-black">
              {talent.image_url ? (
                <Image
                  src={talent.image_url}
                  alt={talent.name_en || "Talent image"}
                  fill
                  sizes="180px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.25em] text-white/25">
                  No image
                </div>
              )}

              <div className="absolute left-3 top-3 rounded-full border border-gold/30 bg-black/50 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-gold backdrop-blur">
                #{index + 1}
              </div>
            </div>

            <div className="p-4">
              <h3 className="truncate text-sm font-medium text-white">
                {talent.name_en || "Unnamed talent"}
              </h3>

              <p
                className="mt-1 truncate text-sm text-white/45"
                dir="rtl"
                style={{ fontFamily: "var(--font-noto-arabic)" }}
              >
                {talent.name_ar || "—"}
              </p>

              <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-gray-muted">
                Views
              </p>

              <p className="mt-1 text-xl font-light text-gold">
                {talent.views.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}