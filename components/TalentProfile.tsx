import Image from "next/image";
import Link from "next/link";
import {
  toTalentProfileDisplay,
  whatsappUrl,
} from "@/lib/talents/display";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

export function TalentProfile({
  talent,
  dict,
  locale,
}: {
  talent: Talent;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.talentProfile;
  const profile = toTalentProfileDisplay(talent, locale);
  const isRtl = locale === "ar";
  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";
  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";
  const homeHref = `/${locale}`;
  const talentsHref = `${homeHref}#talents`;
  const ctaArrow = isRtl ? "←" : "→";

  const details: { label: string; value: string }[] = [];
  if (profile.city) {
    details.push({ label: t.city, value: profile.city });
  }
  if (profile.age != null) {
    details.push({
      label: t.age,
      value: `${profile.age} ${t.years}`,
    });
  }
  if (profile.height) {
    details.push({ label: t.height, value: profile.height });
  }

  return (
    <article className="relative min-h-screen pt-28 pb-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <Link
          href={talentsHref}
          className={`btn-luxury mb-12 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gray-muted transition-colors hover:text-gold ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <span aria-hidden>{isRtl ? "→" : "←"}</span>
          {t.back}
        </Link>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-elevated">
              <Image
                src={profile.imageUrl}
                alt={profile.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </div>

          <div
            className={`flex flex-col justify-center lg:col-span-7 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
              {profile.category}
            </p>
            <h1
              className="text-5xl font-light leading-tight text-white md:text-6xl lg:text-7xl"
              style={{ fontFamily: displayFont }}
            >
              {profile.name}
            </h1>

            <div className="gold-line my-10 max-w-xs" />

            {details.length > 0 && (
              <dl
                className={`grid gap-6 sm:grid-cols-3 ${
                  isRtl ? "text-right" : "text-left"
                }`}
              >
                {details.map((item) => (
                  <div key={item.label}>
                    <dt className="mb-1 text-[9px] uppercase tracking-[0.35em] text-gray-muted">
                      {item.label}
                    </dt>
                    <dd
                      className="text-lg text-white/90"
                      style={{ fontFamily: bodyFont }}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {profile.bio && (
              <div className="mt-10">
                <h2 className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold">
                  {t.bio}
                </h2>
                <p
                  className="max-w-2xl text-sm leading-relaxed text-white/70 md:text-base md:leading-relaxed"
                  style={{ fontFamily: bodyFont }}
                >
                  {profile.bio}
                </p>
              </div>
            )}

            {profile.whatsapp && (
              <a
                href={whatsappUrl(profile.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-luxury group mt-12 inline-flex items-center justify-center gap-3 border border-gold/40 bg-gold/[0.06] px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition-colors hover:border-gold hover:bg-gold/10 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                {t.whatsapp}
                <span
                  className={`transition-transform duration-300 ${
                    isRtl
                      ? "group-hover:-translate-x-1"
                      : "group-hover:translate-x-1"
                  }`}
                >
                  {ctaArrow}
                </span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        aria-hidden
      />
    </article>
  );
}
