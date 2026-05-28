import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { PublicTalentGallery } from "@/components/public/PublicTalentGallery";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { buildTalentMetadata } from "@/lib/seo/talent-metadata";
import {
  getPublishedTalentBySlug,
  getPublishedTalents,
} from "@/lib/supabase/public-talents";
import {
  getTalentBio,
  getTalentCategory,
  getTalentCity,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { talentPath } from "@/lib/utils/routes";
import {
  buildWhatsappUrl,
  normalizeInstagramUrl,
} from "@/lib/utils/social-links";
import { getRelatedTalents } from "@/lib/utils/talent-selectors";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam)) {
    return {};
  }

  const locale = localeParam as Locale;

  const talent = await getPublishedTalentBySlug(slug);

  if (!talent) {
    return {};
  }

  return buildTalentMetadata({
    talent,
    locale,
  });
}

export default async function TalentProfilePage({
  params,
}: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam) || !slug?.trim()) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const talent = await getPublishedTalentBySlug(slug);

  if (!talent) {
    notFound();
  }

  const allTalents = await getPublishedTalents();

  const relatedTalents = getRelatedTalents(
    allTalents,
    talent
  );

  const dict = getDictionary(locale);

  const instagramUrl = normalizeInstagramUrl(
    talent.instagram
  );

  const whatsappUrl = buildWhatsappUrl(
    talent.whatsapp
  );

  const gallery = normalizeGalleryImages(
    talent.gallery_images
  );

  const name = getTalentName(talent, locale);

  const secondaryName =
    locale === "ar"
      ? talent.name_en
      : talent.name_ar;

  const category = getTalentCategory(
    talent,
    locale
  );

  const city = getTalentCity(
    talent,
    locale
  );

  const bio = getTalentBio(
    talent,
    locale
  );

  return (
    <main
      className="min-h-screen bg-background text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Navbar dict={dict} locale={locale} />

      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,98,0.08),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <Link
              href={talentPath(locale)}
              className="text-[10px] uppercase tracking-[0.35em] text-gold transition hover:text-gold-soft"
            >
              {isRtl
                ? "← العودة للمواهب"
                : "← Back to talents"}
            </Link>
          </div>

          <div className="grid gap-14 lg:grid-cols-[460px_minmax(0,1fr)]">
            <div>
              <PublicTalentGallery
                imageUrl={talent.image_url}
                galleryImages={gallery}
                alt={name || "Talent image"}
              />
            </div>

            <div>
              {talent.featured ? (
                <div className="mb-6 inline-flex items-center rounded-full border border-gold/30 bg-gold/[0.06] px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-gold">
                  {isRtl
                    ? "موهبة مميزة"
                    : "Featured Talent"}
                </div>
              ) : null}

              <h1
                className="text-[clamp(3rem,8vw,6.5rem)] leading-[0.92] font-light tracking-tight text-white"
                style={{
                  fontFamily: isRtl
                    ? "var(--font-noto-arabic)"
                    : "var(--font-cormorant)",
                }}
              >
                {name ||
                  (isRtl
                    ? "موهبة غير مسماة"
                    : "Unnamed Talent")}
              </h1>

              {secondaryName ? (
                <p
                  className="mt-5 text-2xl text-white/50"
                  dir={isRtl ? "ltr" : "rtl"}
                  style={{
                    fontFamily: isRtl
                      ? "var(--font-cormorant)"
                      : "var(--font-noto-arabic)",
                  }}
                >
                  {secondaryName}
                </p>
              ) : null}

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <InfoBox
                  label={isRtl ? "التصنيف" : "Category"}
                  value={category}
                />

                <InfoBox
                  label={isRtl ? "المدينة" : "City"}
                  value={city}
                />

                <InfoBox
                  label={isRtl ? "العمر" : "Age"}
                  value={
                    talent.age
                      ? String(talent.age)
                      : null
                  }
                />

                <InfoBox
                  label={isRtl ? "الطول" : "Height"}
                  value={talent.height}
                />
              </div>

              {bio ? (
                <div className="mt-14 max-w-3xl">
                  <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "نبذة" : "Biography"}
                  </h2>

                  <p
                    className="whitespace-pre-line text-lg leading-relaxed text-white/75"
                    style={{
                      fontFamily: isRtl
                        ? "var(--font-noto-arabic)"
                        : undefined,
                    }}
                  >
                    {bio}
                  </p>
                </div>
              ) : null}

              <div className="mt-14 flex flex-wrap gap-4">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gold/30 bg-gold/[0.05] px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/10"
                  >
                    Instagram
                  </a>
                ) : null}

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-white transition hover:border-white/30"
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {relatedTalents.length > 0 ? (
            <section className="mt-32">
              <div className="mb-10">
                <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
                  {isRtl
                    ? "قد يعجبك أيضًا"
                    : "You May Also Like"}
                </p>

                <h2
                  className="text-4xl font-light text-white md:text-5xl"
                  style={{
                    fontFamily: isRtl
                      ? "var(--font-noto-arabic)"
                      : "var(--font-cormorant)",
                  }}
                >
                  {isRtl
                    ? "مواهب مشابهة"
                    : "Related Talents"}
                </h2>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {relatedTalents.map((item) => (
                  <PublicTalentCard
                    key={item.id}
                    talent={item}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <Footer dict={dict} locale={locale} />
    </main>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-6 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-xl font-light text-white">
        {value || "—"}
      </p>
    </div>
  );
}