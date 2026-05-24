import Image from "next/image";
import { getTalents } from "@/lib/supabase/talents";
import type { Dictionary, Locale } from "@/lib/i18n";

type Talent = {
  id: number;
  name_en: string;
  name_ar: string;
  category_en: string;
  category_ar: string;
  image_url: string;
  featured: boolean;
};

export async function ModelsShowcase({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { talents: t } = dict;

  const isRtl = locale === "ar";

  const rows = (await getTalents()) as Talent[];

  return (
    <section id="talents" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16">
          <h2 className="text-5xl text-white">
            {t.title}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((talent, index) => (
            <article
              key={talent.id}
              className={`relative overflow-hidden ${
                index === 0 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={talent.image_url}
                  alt={
                    isRtl
                      ? talent.name_ar
                      : talent.name_en
                  }
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/50">
                <p className="text-gold text-sm">
                  {isRtl
                    ? talent.category_ar
                    : talent.category_en}
                </p>

                <h3 className="text-white text-2xl">
                  {isRtl
                    ? talent.name_ar
                    : talent.name_en}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}