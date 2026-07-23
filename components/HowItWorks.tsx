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
      title: isAr ? "ابدأ التقديم" : "Get discovered",
      desc: isAr
        ? "استعرض الفرص وتابع طلباتك من مكان واحد."
        : "Discover opportunities and track applications in one place.",
    },
  ];

  const companySteps: JourneyStep[] = [
    {
      icon: BriefcaseBusiness,
      title: isAr ? "أنشئ فرصة" : "Create opportunity",
      desc: isAr
        ? "انشر احتياجك وحدد نوع الموهبة المطلوبة."
        : "Post your needs and define the talent you’re looking for.",
    },
    {
      icon: UserRound,
      title: isAr ? "استقبل المتقدمين" : "Receive applicants",
      desc: isAr
        ? "راجع الملفات، الصور، والمعلومات بسرعة ووضوح."
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
      dir={isAr ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/10 bg-black py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(200,169,106,0.08),transparent_45%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className={[
              "text-xs text-gold",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.35em]",
            ].join(" ")}
          >
            {isAr ? "كيف تعمل ملامح" : "How MLAMH works"}
          </p>

          <h2
            className={[
              "mt-5 text-4xl font-light text-white md:text-6xl",
              isAr ? "tracking-normal" : "tracking-tight",
            ].join(" ")}
          >
            {isAr
              ? "رحلة واضحة للطرفين."
              : "A clear path for both sides."}
          </h2>

          <p className="mt-6 text-base leading-8 tracking-normal text-white/50">
            {isAr
              ? "سواء كنت موهبة تبحث عن فرصة، أو شركة تبحث عن الشخص المناسب، التجربة مصممة لتكون بسيطة واحترافية."
              : "Whether you are a talent looking for opportunities or a company searching for the right person, the experience is simple and professional."}
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title={isAr ? "للمواهب" : "For Talents"}
            steps={talentSteps}
          />

          <JourneyCard
            title={isAr ? "للشركات" : "For Companies"}
            steps={companySteps}
          />
        </div>
      </div>
    </section>
  );
}

function JourneyCard({
  title,
  steps,
}: {
  title: string;
  steps: JourneyStep[];
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
      <h3 className="text-2xl font-light tracking-normal text-white">
        {title}
      </h3>

      <div className="mt-8 grid gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-5 md:grid-cols-[auto_1fr]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                <Icon size={19} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
                  0{index + 1}
                </p>

                <h4 className="mt-2 text-xl font-light tracking-normal text-white">
                  {step.title}
                </h4>

                <p className="mt-2 text-sm leading-7 tracking-normal text-white/45">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}