import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "عن ملامح | ملامح" : "About MLAMH | MLAMH",
    description: isArabic
      ? "تعرّف على منصة ملامح ورؤيتها في ربط المواهب الإبداعية بالشركات والفرص."
      : "Learn about MLAMH and its mission to connect creative talent with companies and opportunities.",
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <p
            className={`text-sm text-gold ${
              isRtl
                ? "tracking-normal"
                : "uppercase tracking-[0.25em]"
            }`}
          >
            {isRtl ? "عن ملامح" : "About MLAMH"}
          </p>

          <h1 className="mt-4 text-4xl font-light md:text-5xl">
            {isRtl
              ? "منصة تجمع المواهب بالفرص"
              : "Connecting Talent with Opportunity"}
          </h1>

          <div className="mt-10 space-y-8 text-base leading-8 text-white/70">
            <section>
              <h2 className="mb-3 text-2xl text-white">
                {isRtl ? "من نحن" : "Who We Are"}
              </h2>

              <p>
                {isRtl
                  ? "ملامح منصة رقمية سعودية تهدف إلى ربط المواهب الإبداعية بجهات الإنتاج والشركات والوكالات بطريقة احترافية وسهلة وآمنة."
                  : "MLAMH is a Saudi digital platform connecting creative talent with production companies, agencies, and brands through a professional and secure experience."}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl text-white">
                {isRtl ? "رؤيتنا" : "Our Vision"}
              </h2>

              <p>
                {isRtl
                  ? "بناء أكبر مجتمع احترافي للمواهب الإبداعية في المنطقة، وتمكين الشركات من الوصول إلى المواهب المناسبة بسرعة وكفاءة."
                  : "To build the leading professional community for creative talent and help companies discover the right people faster."}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl text-white">
                {isRtl ? "ماذا نقدم؟" : "What We Offer"}
              </h2>

              <ul className="list-disc space-y-2 ps-6">
                <li>
                  {isRtl
                    ? "ملفات شخصية احترافية للمواهب."
                    : "Professional talent profiles."}
                </li>

                <li>
                  {isRtl
                    ? "نشر وإدارة الفرص."
                    : "Opportunity publishing and management."}
                </li>

                <li>
                  {isRtl
                    ? "تقديم مباشر على الفرص."
                    : "Direct opportunity applications."}
                </li>

                <li>
                  {isRtl
                    ? "إدارة الطلبات والإشعارات."
                    : "Application and notification management."}
                </li>

                <li>
                  {isRtl
                    ? "تواصل احترافي بين الشركات والمواهب."
                    : "Professional collaboration between companies and talent."}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl text-white">
                {isRtl ? "رسالتنا" : "Our Mission"}
              </h2>

              <p>
                {isRtl
                  ? "تبسيط عملية اكتشاف المواهب، وتسريع الوصول إلى الفرص المناسبة، والمساهمة في دعم الاقتصاد الإبداعي."
                  : "Simplifying talent discovery while creating more opportunities across the creative economy."}
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}