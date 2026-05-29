import Link from "next/link";
import {
  approveTalentAction,
  rejectTalentAction,
} from "@/lib/actions/review-talent";
import {
  toggleTalentFeaturedAction,
  toggleTalentPublishedAction,
} from "@/lib/actions/toggle-talent-flags";
import { TalentGallery } from "@/components/admin/TalentGallery";
import type { AdminTalent } from "@/lib/supabase/admin-talents";
import { calculateTalentCompletion } from "@/lib/utils/talent-completion";

type AdminTalentWithFeaturedUntil = AdminTalent & {
  featured_until?: string | null;
  availability_status?: string | null;
};

function normalizeInstagramUrl(value?: string | null) {
  if (!value) return null;

  const cleanValue = value.trim();

  if (!cleanValue) return null;

  if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
    return cleanValue;
  }

  if (cleanValue.startsWith("@")) {
    return `https://instagram.com/${cleanValue.slice(1)}`;
  }

  return `https://${cleanValue}`;
}

function getStatusStyles(status?: string | null) {
  switch (status) {
    case "approved":
      return {
        label: "approved",
        className: "text-emerald-400",
      };

    case "rejected":
      return {
        label: "rejected",
        className: "text-red-400",
      };

    default:
      return {
        label: "pending",
        className: "text-gold",
      };
  }
}

function getCompletionStyles(completion: number) {
  if (completion >= 80) {
    return "bg-emerald-500/10 text-emerald-400";
  }

  if (completion >= 50) {
    return "bg-gold/10 text-gold";
  }

  return "bg-red-500/10 text-red-400";
}

function formatFeaturedUntil(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAvailabilityLabel(status?: string | null) {
  switch (status) {
    case "available_now":
      return "Available Now";

    case "available_this_week":
      return "Available This Week";

    case "available_next_month":
      return "Available Next Month";

    case "unavailable":
      return "Unavailable";

    default:
      return "—";
  }
}

export function PendingTalentCard({
  talent,
}: {
  talent: AdminTalentWithFeaturedUntil;
}) {
  const instagramUrl = normalizeInstagramUrl(talent.instagram);
  const status = getStatusStyles(talent.status);
  const completion = calculateTalentCompletion(talent);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-elevated/40">
      <div className="flex flex-col gap-6 p-5 md:flex-row md:p-6">
        <div className="mx-auto w-full max-w-[220px] shrink-0 md:mx-0">
          <TalentGallery
            imageUrl={talent.image_url}
            galleryImages={talent.gallery_images}
            alt={talent.name_en || "Talent profile image"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`text-[10px] uppercase tracking-[0.3em] ${status.className}`}
              >
                #{talent.id} · {status.label}
              </p>

              <h2 className="mt-1 text-2xl font-light text-white">
                {talent.name_en || "Unnamed talent"}
              </h2>

              <p
                className="mt-0.5 text-lg text-white/60"
                style={{ fontFamily: "var(--font-noto-arabic)" }}
                dir="rtl"
              >
                {talent.name_ar || "—"}
              </p>
            </div>

            <Link
              href={`/admin/talents/${talent.id}/edit`}
              className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/60 transition-colors hover:border-gold/40 hover:text-gold"
            >
              Edit profile
            </Link>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Category EN
              </dt>

              <dd className="mt-1 text-white/80">
                {talent.category_en || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Category AR
              </dt>

              <dd
                className="mt-1 text-white/80"
                style={{ fontFamily: "var(--font-noto-arabic)" }}
                dir="rtl"
              >
                {talent.category_ar || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                WhatsApp
              </dt>

              <dd className="mt-1 text-white/80">
                {talent.whatsapp || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Instagram
              </dt>

              <dd className="mt-1 truncate text-white/80">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
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

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Featured
              </dt>

              <dd className="mt-1">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                    talent.featured
                      ? "bg-gold/10 text-gold"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {talent.featured ? "Featured" : "Standard"}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Featured Until
              </dt>

              <dd className="mt-1 text-white/80">
                {talent.featured
                  ? formatFeaturedUntil(talent.featured_until)
                  : "—"}
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Availability
              </dt>

              <dd className="mt-1 text-white/80">
                {getAvailabilityLabel(talent.availability_status)}
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Profile Completion
              </dt>

              <dd className="mt-1">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${getCompletionStyles(
                    completion
                  )}`}
                >
                  {completion}%
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Views
              </dt>

              <dd className="mt-1 text-white/80">
                👁 {talent.views.toLocaleString()}
              </dd>
            </div>

            <div>
              <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Published
              </dt>

              <dd className="mt-1">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                    talent.published
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {talent.published ? "Published" : "Hidden"}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={toggleTalentFeaturedAction}>
              <input type="hidden" name="id" value={talent.id} />

              <input
                type="hidden"
                name="featured"
                value={String(talent.featured)}
              />

              <button
                type="submit"
                className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                  talent.featured
                    ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
                    : "border-white/10 text-white/60 hover:border-gold/30 hover:text-gold"
                }`}
              >
                {talent.featured ? "Remove Featured" : "Make Featured"}
              </button>
            </form>

            <form action={toggleTalentPublishedAction}>
              <input type="hidden" name="id" value={talent.id} />

              <input
                type="hidden"
                name="published"
                value={String(talent.published)}
              />

              <button
                type="submit"
                className={`rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                  talent.published
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40"
                }`}
              >
                {talent.published ? "Unpublish" : "Publish"}
              </button>
            </form>

            {talent.status !== "approved" ? (
              <form action={approveTalentAction}>
                <input type="hidden" name="id" value={talent.id} />

                <button
                  type="submit"
                  className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-emerald-400 transition-colors hover:border-emerald-400/60 hover:bg-emerald-950/50"
                >
                  Approve
                </button>
              </form>
            ) : null}

            {talent.status !== "rejected" ? (
              <form action={rejectTalentAction}>
                <input type="hidden" name="id" value={talent.id} />

                <button
                  type="submit"
                  className="rounded-full border border-red-500/30 bg-red-950/20 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-red-400 transition-colors hover:border-red-400/50 hover:bg-red-950/40"
                >
                  Reject
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}