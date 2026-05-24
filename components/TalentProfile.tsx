import Image from "next/image";
import Link from "next/link";
import {
  toTalentProfileDisplay,
  whatsappUrl,
  type TalentSocialLink,
} from "@/lib/talents/display";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

function DetailCard({
  label,
  value,
  isRtl,
  bodyFont,
}: {
  label: string;
  value: string;
  isRtl: boolean;
  bodyFont: string;
}) {
  return (
    <div
      className={`group border border-white/[0.06] bg-gray-elevated/60 p-5 backdrop-blur-sm transition-all duration-500 hover:border-gold/35 hover:bg-gray-elevated sm:p-6 ${
        isRtl ? "text-right" : "text-left"
      }`}
    >
      <dt className="mb-2 text-[9px] uppercase tracking-[0.35em] text-gray-muted transition-colors group-hover:text-gold/80">
        {label}
      </dt>
      <dd
        className="text-lg font-light text-white/90 md:text-xl"
        style={{ fontFamily: bodyFont }}
      >
        {value}
      </dd>
    </div>
  );
}

function ProfileGallery({
  images,
  title,
  altPrefix,
  isRtl,
}: {
  images: string[];
  title: string;
  altPrefix: string;
  isRtl: boolean;
}) {
  if (images.length === 0) return null;

  return (
    <section
      className={`opacity-0-start animate-fade-up delay-300 mt-14 md:mt-20 ${
        isRtl ? "text-right" : "text-left"
      }`}
    >
      <div className={`gold-line mb-8 max-w-xs ${isRtl ? "mr-0 ml-auto" : ""}`} />
      <h2 className="mb-6 text-[10px] uppercase tracking-[0.35em] text-gold">
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {images.map((src, index) => (
          <li
            key={`${src}-${index}`}
            className="group relative aspect-[3/4] overflow-hidden bg-gray-elevated"
          >
            <Image
              src={src}
              alt={`${altPrefix} ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
            <div className="pointer-events-none absolute inset-0 border border-white/0 transition-colors duration-500 group-hover:border-gold/25" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileSocialLinks({
  links,
  title,
  isRtl,
}: {
  links: TalentSocialLink[];
  title: string;
  isRtl: boolean;
}) {
  if (links.length === 0) return null;

  const externalArrow = isRtl ? "↖" : "↗";

  return (
    <section
      className={`opacity-0-start animate-fade-up delay-350 mt-12 md:mt-14 ${
        isRtl ? "text-right" : "text-left"
      }`}
    >
      <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
        {title}
      </h2>
      <ul
        className={`flex flex-wrap gap-3 ${isRtl ? "justify-end" : "justify-start"}`}
      >
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-luxury group inline-flex items-center gap-2 border border-white/[0.08] bg-black/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.28em] text-white/60 transition-all duration-300 hover:border-gold/40 hover:text-gold ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              {link.label}
              <span
                className={`text-[11px] text-gold/50 transition-all duration-300 group-hover:text-gold ${
                  isRtl
                    ? "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
                    : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                }`}
                aria-hidden
              >
                {externalArrow}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
  const profile = toTalentProfileDisplay(talent, locale, {
    instagram: t.instagram,
    tiktok: t.tiktok,
    snapchat: t.snapchat,
    portfolio: t.portfolio,
  });
  const isRtl = locale === "ar";
  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";
  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";
  const talentsHref = `/${locale}#talents`;
  const ctaArrow = isRtl ? "←" : "→";
  const backArrow = isRtl ? "→" : "←";

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
    <article className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[120px]" />
        <div className="absolute right-0 bottom-1/3 h-[320px] w-[320px] bg-white/[0.02] blur-[90px]" />
      </div>

      <section className="relative min-h-[72vh] w-full overflow-hidden md:min-h-[88vh]">
        <Image
          src={profile.imageUrl}
          alt={profile.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_20%] transition-transform duration-[1.2s] ease-out hover:scale-[1.02]"
        />

        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-black/40"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"
          aria-hidden
        />
        <div
          className={`absolute inset-0 ${
            isRtl
              ? "bg-gradient-to-l from-black/50 via-transparent to-transparent"
              : "bg-gradient-to-r from-black/50 via-transparent to-transparent"
          }`}
          aria-hidden
        />

        <div className="absolute top-0 right-0 left-0 z-20 pt-24 md:pt-28">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
            <Link
              href={talentsHref}
              className={`btn-luxury group inline-flex items-center gap-2 rounded-sm border border-white/10 bg-black/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.3em] text-white/70 backdrop-blur-md transition-all duration-300 hover:border-gold/40 hover:text-gold ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`transition-transform duration-300 ${
                  isRtl
                    ? "group-hover:translate-x-0.5"
                    : "group-hover:-translate-x-0.5"
                }`}
                aria-hidden
              >
                {backArrow}
              </span>
              {t.back}
            </Link>
            <div
              className={`hidden h-16 w-px bg-gradient-to-b from-gold/50 to-transparent md:block ${
                isRtl ? "order-first" : ""
              }`}
              aria-hidden
            />
          </div>
        </div>

        <div
          className={`absolute right-0 bottom-0 left-0 z-10 px-6 pb-10 md:pb-14 lg:px-10 lg:pb-16 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          <div className="mx-auto max-w-7xl">
            <div
              className={`mb-6 flex items-center gap-4 opacity-0-start animate-fade-up ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <span className="gold-line max-w-[80px] flex-1" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
                {profile.category}
              </p>
            </div>
            <h1
              className="opacity-0-start animate-fade-up delay-100 max-w-4xl text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.95] font-light tracking-tight text-white"
              style={{ fontFamily: displayFont }}
            >
              {profile.name}
            </h1>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
          aria-hidden
        />
      </section>

      <section className="relative z-10 px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {details.length > 0 && (
            <dl
              className={`grid gap-4 opacity-0-start animate-fade-up delay-200 sm:grid-cols-2 lg:grid-cols-3 ${
                details.length === 1
                  ? "sm:grid-cols-1 lg:max-w-sm"
                  : details.length === 2
                    ? "lg:grid-cols-2 lg:max-w-2xl"
                    : ""
              } ${isRtl ? "mr-0 ml-auto" : ""}`}
            >
              {details.map((item) => (
                <DetailCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  isRtl={isRtl}
                  bodyFont={bodyFont}
                />
              ))}
            </dl>
          )}

          {profile.bio ? (
            <div
              className={`opacity-0-start animate-fade-up delay-300 mt-12 max-w-3xl md:mt-16 ${
                isRtl ? "mr-0 ml-auto text-right" : ""
              }`}
            >
              <div className={`gold-line mb-8 max-w-xs ${isRtl ? "mr-0 ml-auto" : ""}`} />
              <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
                {t.bio}
              </h2>
              <p
                className="text-base leading-relaxed text-white/65 md:text-lg md:leading-relaxed"
                style={{ fontFamily: bodyFont }}
              >
                {profile.bio}
              </p>
            </div>
          ) : null}

          <ProfileSocialLinks
            links={profile.socialLinks}
            title={t.connect}
            isRtl={isRtl}
          />

          <ProfileGallery
            images={profile.galleryImages}
            title={t.gallery}
            altPrefix={t.galleryImageAlt}
            isRtl={isRtl}
          />

          {profile.whatsapp ? (
            <div
              className={`opacity-0-start animate-fade-up delay-400 mt-12 md:mt-16 ${
                isRtl ? "text-right" : "text-left"
              }`}
            >
              <a
                href={whatsappUrl(profile.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-luxury group inline-flex w-full items-center justify-center gap-3 border border-gold/40 bg-gold/[0.06] px-8 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/15 sm:w-auto sm:px-12 ${
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
            </div>
          ) : null}
        </div>
      </section>
    </article>
  );
}
