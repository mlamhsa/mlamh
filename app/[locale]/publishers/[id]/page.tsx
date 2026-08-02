import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

function formatLabel(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function publisherTypeLabel(type?: string | null, isRtl = false) {
  const labels: Record<string, { ar: string; en: string }> = {
    individual: { ar: "فرد", en: "Individual" },
    salon: { ar: "صالون", en: "Salon" },
    store: { ar: "متجر", en: "Store" },
    agency: { ar: "وكالة", en: "Agency" },
    production_company: { ar: "شركة إنتاج", en: "Production Company" },
    brand: { ar: "براند", en: "Brand" },
    photographer: { ar: "مصور", en: "Photographer" },
    marketer: { ar: "مسوق", en: "Marketer" },
    other: { ar: "أخرى", en: "Other" },
  };

  if (!type) return "-";
  return labels[type]?.[isRtl ? "ar" : "en"] ?? formatLabel(type);
}

function opportunityTypeLabel(type?: string | null, isRtl = false) {
  const labels: Record<string, { ar: string; en: string }> = {
    model: { ar: "مودل", en: "Model" },
    actor: { ar: "ممثل / ممثلة", en: "Actor" },
    photographer: { ar: "مصور / مصورة", en: "Photographer" },
    makeup_artist: { ar: "خبير / خبيرة تجميل", en: "Makeup Artist" },
    content_creator: { ar: "صانع / صانعة محتوى", en: "Content Creator" },
    voice_over: { ar: "تعليق صوتي", en: "Voice Over" },
  };

  if (!type) return "-";
  return labels[type]?.[isRtl ? "ar" : "en"] ?? formatLabel(type);
}

function getCity(
  opportunity: {
    city_ar?: string | null;
    city_en?: string | null;
  },
  locale: string
) {
  return locale === "ar"
    ? opportunity.city_ar ?? opportunity.city_en
    : opportunity.city_en ?? opportunity.city_ar;
}

export default async function PublisherPublicProfilePage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";
  const adminClient = createAdminClient();

  const { data: publisher } = await adminClient
    .from("publishers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!publisher) {
    notFound();
  }

  const { data: opportunities } = await adminClient
    .from("opportunities")
    .select(
      "id, title, slug, city_ar, city_en, opportunity_type, status, created_at"
    )
    .eq("publisher_id", publisher.id)
    .eq("published", true)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  const publisherName = publisher.company_name ?? publisher.contact_name ?? "-";
  const initial = publisherName.slice(0, 1).toUpperCase();

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          <div className="relative h-72 border-b border-white/10 bg-black md:h-96">
          {publisher.cover_image_url ? (
  <Image
    src={publisher.cover_image_url}
    alt={publisherName}
    fill
    priority
    sizes="(max-width: 1280px) 100vw, 1280px"
    className="object-cover"
  />
) : (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-gold/10 to-black" />
            )}

            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />
          </div>

          <div className="relative p-8 md:p-10">
            <div className="-mt-24 mb-8 flex justify-start">
              {publisher.profile_image_url ? (
                <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-black bg-black shadow-2xl md:h-44 md:w-44">
                <Image
                  src={publisher.profile_image_url}
                  alt={publisherName}
                  fill
                  sizes="(max-width: 768px) 144px, 176px"
                  className="object-cover"
                />
              </div>
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-black bg-black text-5xl font-light text-gold shadow-2xl md:h-44 md:w-44">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className={isRtl ? "text-right" : "text-left"}>
                <p className="text-xs uppercase tracking-[0.4em] text-gold">
                  {isRtl ? "بروفايل الناشر" : "Publisher Profile"}
                </p>

                <h1 className="mt-4 text-5xl font-light md:text-7xl">
                  {publisherName}
                </h1>

                <p className="mt-4 text-sm text-white/50">
                  {publisherTypeLabel(publisher.publisher_type, isRtl)}
                  {publisher.city ? ` · ${publisher.city}` : ""}
                  {publisher.verified
                    ? isRtl
                      ? " · موثق"
                      : " · Verified"
                    : ""}
                </p>
              </div>

              <Link
                href={`/${locale}/opportunities`}
                className="inline-flex border border-gold/40 px-7 py-4 text-xs uppercase tracking-[0.25em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
              </Link>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "عن الجهة" : "About"}
                </p>

                <p className="mt-5 text-sm leading-8 text-white/60">
                  {publisher.description ||
                    (isRtl
                      ? "لم يتم إضافة نبذة عن هذه الجهة بعد."
                      : "No description has been added for this publisher yet.")}
                </p>
              </section>

              <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "معلومات التواصل" : "Contact"}
                </p>

                <div className="mt-5 space-y-3 text-sm text-white/55">
                  {publisher.phone && <p>{publisher.phone}</p>}
                  {publisher.email && <p>{publisher.email}</p>}
                  {publisher.address && <p>{publisher.address}</p>}

                  {publisher.website && (
                    <a
                      href={publisher.website}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-gold transition hover:text-white"
                    >
                      Website
                    </a>
                  )}

                  {publisher.instagram && (
                    <a
                      href={publisher.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-gold transition hover:text-white"
                    >
                      Instagram
                    </a>
                  )}

                  {publisher.tiktok_url && (
                    <a
                      href={publisher.tiktok_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-gold transition hover:text-white"
                    >
                      TikTok
                    </a>
                  )}

                  {publisher.snapchat_url && (
                    <a
                      href={publisher.snapchat_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-gold transition hover:text-white"
                    >
                      Snapchat
                    </a>
                  )}

                  {publisher.linkedin_url && (
                    <a
                      href={publisher.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-gold transition hover:text-white"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold">
                {isRtl ? "فرص الناشر" : "Publisher Opportunities"}
              </p>

              <h2 className="mt-3 text-4xl font-light">
                {isRtl ? "الفرص المنشورة" : "Published Opportunities"}
              </h2>
            </div>

            <p className="text-sm text-white/45">
              {(opportunities ?? []).length}{" "}
              {isRtl ? "فرصة" : "opportunities"}
            </p>
          </div>

          {opportunities && opportunities.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 transition hover:border-gold/40"
                >
                  <div className="mb-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-white/35">
                    <span>
                      {opportunityTypeLabel(
                        opportunity.opportunity_type,
                        isRtl
                      )}
                    </span>
                    <span>{getCity(opportunity, locale) ?? "-"}</span>
                  </div>

                  <h3 className="text-3xl font-light">{opportunity.title}</h3>

                  <Link
                    href={`/${locale}/opportunities/${
                      opportunity.slug ?? opportunity.id
                    }`}
                    className="mt-6 inline-flex text-sm text-gold transition hover:text-white"
                  >
                    {isRtl ? "عرض الفرصة ←" : "View Opportunity →"}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-10 text-white/50">
              {isRtl
                ? "لا توجد فرص منشورة حاليًا."
                : "No published opportunities yet."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}