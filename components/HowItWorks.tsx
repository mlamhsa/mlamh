import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ImagePlus,
  UserRound,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";

type JourneyStep = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export function HowItWorks({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const talentSteps: JourneyStep[] = [
    {
      icon: UserRound,
      title: isAr ? "أنشئ ملفك" : "Create your profile",
      desc: isAr
        ? "أضف معلوماتك، مهاراتك، ومجالك الإبداعي."
        : "Add your details, skills, and creative field.",
    },
    {
      icon: ImagePlus,
      title: isAr ? "اعرض أعمالك" : "Show your portfolio",
      desc: isAr
        ? "ارفع صورك وروابط أعمالك لتظهر بشكل احترافي."
        : "Upload visuals and work links to present yourself professionally.",
    },
    {
      icon: CheckCircle2,
      title: isAr ? "ابدأ التقديم" : "Start applying",
      desc: isAr
        ? "استعرض الفرص وتابع طلباتك من مكان واحد."
        : "Discover opportunities and track applications in one place.",
    },
  ];

  const organizationSteps: JourneyStep[] = [
    {
      icon: BriefcaseBusiness,
      title: isAr ? "أنشئ فرصة" : "Create opportunity",
      desc: isAr
        ? "انشر احتياجك وحدد نوع الموهبة المطلوبة."
        : "Post your needs and define the talent you’re looking for.",
    },
    {
      icon: UserRound,
      title: isAr ? "راجع المتقدمين" : "Review applicants",
      desc: isAr
        ? "راجع الملفات والصور والمعلومات بسرعة ووضوح."
        : "Review profiles, portfolios, and details with clarity.",
    },
    {
      icon: CheckCircle2,
      title: isAr ? "اختر الموهبة" : "Choose talent",
      desc: isAr
        ? "اتخذ قرارك بثقة وابدأ مشروعك القادم."
        : "Make confident decisions and move your project forward.",
    },
  ];

  return (
    <section
      id="how-it-works"
      dir={isAr ? "rtl" : "ltr"}
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.07] bg-black py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(200,169,106,0.08),transparent_42%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10 xl:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className={[
              "text-xs text-gold",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.3em]",
            ].join(" ")}
          >
            {isAr ? "كيف تعمل ملامح" : "How MLAMH works"}
          </p>

          <h2
            className={[
              "mt-4 text-4xl font-light leading-tight text-white md:text-5xl",
              isAr ? "tracking-normal" : "tracking-tight",
            ].join(" ")}
          >
            {isAr
              ? "رحلة واضحة للطرفين."
              : "A clear path for both sides."}
          </h2>

          <p className="mt-5 text-sm leading-7 text-white/45 md:text-base">
            {isAr
              ? "سواء كنت موهبة تبحث عن فرصة، أو جهة تبحث عن الشخص المناسب، التجربة مصممة لتكون بسيطة واحترافية."
              : "Whether you are a talent looking for opportunities or an organization searching for the right person, the experience is simple and professional."}
          </p>
        </div>

        <div className="mt-12 grid gap-5">
          <JourneyRow
            title={isAr ? "للمواهب" : "For Talents"}
            steps={talentSteps}
            isAr={isAr}
          />

          <JourneyRow
            title={isAr ? "للجهات" : "For Organizations"}
            steps={organizationSteps}
            isAr={isAr}
          />
        </div>
      </div>
    </section>
  );
}

function JourneyRow({
  title,
  steps,
  isAr,
}: {
  title: string;
  steps: JourneyStep[];
  isAr: boolean;
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-5 md:p-6 lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[180px_1fr] lg:items-center">
        <div>
          <p className="text-xs text-gold">
            {title}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="group relative rounded-[1.4rem] border border-white/[0.07] bg-black/25 p-5 transition duration-300 hover:border-gold/25 hover:bg-white/[0.025]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                    <Icon size={17} />
                  </div>

                  <span className="text-[10px] text-white/20">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-light text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/42">
                  {step.desc}
                </p>

                {index < steps.length - 1 ? (
                  <span
                    className={[
                      "pointer-events-none absolute top-1/2 hidden h-px w-3 bg-gold/20 md:block",
                      isAr
                        ? "-left-3"
                        : "-right-3",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}