import { getTalents } from "@/lib/supabase/talents";

export default async function TalentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;

  const talents = await getTalents();

  const talent = talents.find(
    (item) => String(item.id) === id
  );

  if (!talent) {
    return <div>Talent not found</div>;
  }

  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl">
        <img
          src={talent.image_url}
          alt={locale === "ar" ? talent.name_ar : talent.name_en}
          className="mb-8 h-[600px] w-full object-cover"
        />

        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gold">
          {locale === "ar"
            ? talent.category_ar
            : talent.category_en}
        </p>

        <h1 className="mb-6 text-6xl font-light">
          {locale === "ar"
            ? talent.name_ar
            : talent.name_en}
        </h1>

        <a
          href={`/${locale}#talents`}
          className="text-sm text-gold underline"
        >
          Back
        </a>
      </div>
    </main>
  );
}