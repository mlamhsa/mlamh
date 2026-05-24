import Image from "next/image";
import {
  approveTalentAction,
  rejectTalentAction,
} from "@/lib/actions/review-talent";
import type { Talent } from "@/lib/types/talent";

export function PendingTalentCard({ talent }: { talent: Talent }) {
  return (
    <article className="flex flex-col gap-6 border border-white/[0.08] bg-gray-elevated/40 p-5 md:flex-row md:p-6">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] shrink-0 overflow-hidden bg-black md:mx-0">
      <Image
  src={talent.image_url}
  alt={talent.name_en}
  fill
  priority
  sizes="260px"
  className="object-cover"
/>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              #{talent.id} · pending
            </p>
            <h2 className="mt-1 text-xl font-light text-white">
              {talent.name_en}
            </h2>
            <p
              className="mt-0.5 text-lg text-white/60"
              style={{ fontFamily: "var(--font-noto-arabic)" }}
              dir="rtl"
            >
              {talent.name_ar}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
              Category (EN)
            </dt>
            <dd className="mt-1 text-white/80">{talent.category_en}</dd>
          </div>
          <div>
            <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
              Category (AR)
            </dt>
            <dd
              className="mt-1 text-white/80"
              style={{ fontFamily: "var(--font-noto-arabic)" }}
              dir="rtl"
            >
              {talent.category_ar}
            </dd>
          </div>
          <div>
            <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
              WhatsApp
            </dt>
            <dd className="mt-1 text-white/80">{talent.whatsapp ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
              Instagram
            </dt>
            <dd className="mt-1 truncate text-white/80">
              {talent.instagram ? (
                <a
                  href={
                    talent.instagram.startsWith("http")
                      ? talent.instagram
                      : `https://${talent.instagram}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold transition-colors hover:text-gold-soft"
                >
                  {talent.instagram}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={approveTalentAction}>
            <input type="hidden" name="id" value={talent.id} />
            <button
              type="submit"
              className="border border-emerald-500/40 bg-emerald-950/30 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-emerald-400 transition-colors hover:border-emerald-400/60 hover:bg-emerald-950/50"
            >
              Approve
            </button>
          </form>
          <form action={rejectTalentAction}>
            <input type="hidden" name="id" value={talent.id} />
            <button
              type="submit"
              className="border border-red-500/30 bg-red-950/20 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-red-400 transition-colors hover:border-red-400/50 hover:bg-red-950/40"
            >
              Reject
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
