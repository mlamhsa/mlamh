import Image from "next/image";
import { getTalents } from "@/lib/supabase/talents";
import type { Dictionary, Locale } from "@/lib/i18n";

export async function ModelsShowcase({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const talents = await getTalents();

  return (
    <section className="bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {talents.map((talent) => {
            const name =
              locale === "ar"
                ? talent.name_ar
                : talent.name_en;

            const category =
              locale === "ar"
                ? talent.category_ar
                : talent.category_en;

            return (
              <a
                key={talent.id}
                href={`/${locale}/talents/${talent.id}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                  <Image
                    src={talent.image_url}
                    alt={name}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.3em] text-yellow-500">
                    {category}
                  </p>

                  <h3 className="text-3xl font-light">
                    {name}
                  </h3>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}