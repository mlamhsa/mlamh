import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { isValidLocale, type Locale } from "@/lib/i18n";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

type Guide = {
  title: string;
  description: string;
  intro: string;
  sections: { title: string; body: string }[];
  opportunityHref: string;
  opportunityLabel: string;
  talentHref: string;
  talentLabel: string;
};

const content: Record<string, Record<Locale, Guide>> = {
  "how-to-start-acting-saudi-arabia": {
    ar: {
      title: "كيف تبدأ التمثيل في السعودية؟ دليل عملي للمبتدئين",
      description: "خطوات عملية لمن يريد أن يصبح ممثلًا في السعودية: تجهيز الصور وملف الممثل وفيديو التعريف، متابعة فرص التمثيل والكاستينج والاستعداد لتجارب الأداء.",
      intro: "إذا كنت تبحث عن طريقة تبدأ بها التمثيل في السعودية، فالبداية ليست انتظار دور كبير. الأهم أن تجهز ملفًا واضحًا يمثل شكلك ومهاراتك الحالية، ثم تتابع فرص التمثيل والكاستينج المناسبة لك وتتعامل معها باحتراف.",
      sections: [
        { title: "1. جهز ملف ممثل واضح", body: "استخدم اسمًا مهنيًا واضحًا، اكتب مدينتك ونبذة قصيرة عنك، وأضف مهاراتك ولهجاتك وخبرتك إن وجدت. الملف المكتمل يساعد أصحاب الفرص على فهم ملاءمتك للدور بسرعة." },
        { title: "2. اختر صورًا حديثة وطبيعية", body: "ابدأ بصورة وجه واضحة وصورة كاملة بإضاءة جيدة ومن دون فلاتر تغير ملامحك. الهدف من صور الكاستينج هو إظهار شكلك الحقيقي، وليس صناعة صورة مختلفة عنك." },
        { title: "3. صور فيديو تعريف قصير", body: "عرّف بنفسك باختصار واذكر مدينتك ومهاراتك واللهجات أو اللغات التي تتقنها. اجعل الصوت واضحًا والكاميرا ثابتة والخلفية بسيطة." },
        { title: "4. تابع فرص التمثيل وتجارب الأداء", body: "ابحث عن الفرص التي تتوافق مع عمرك ومدينتك ومهاراتك، واقرأ المتطلبات قبل التقديم. التقديم على الفرصة المناسبة أقوى من التقديم العشوائي على كل إعلان." },
        { title: "5. تعامل مع الكاستينج كمهارة", body: "تجربة الأداء تحتاج فهم المطلوب، الاستماع للتوجيه والقدرة على تعديل الأداء. عدم اختيارك لدور واحد لا يعني أن ملفك غير جيد؛ أحيانًا القرار مرتبط بمواصفات الدور نفسه." },
      ],
      opportunityHref: "/opportunities/type/acting", opportunityLabel: "تصفح فرص التمثيل والكاستينج", talentHref: "/talent/category/actor", talentLabel: "استعرض الممثلين في السعودية",
    },
    en: {
      title: "How to Start Acting in Saudi Arabia: A Beginner Guide",
      description: "Practical steps to become an actor in Saudi Arabia: prepare your actor profile, photos and introduction video, find casting opportunities and get ready for auditions.",
      intro: "Starting an acting career in Saudi Arabia is less about waiting to be discovered and more about being ready when a suitable role appears. Build a clear profile, use current photos and apply selectively to relevant casting opportunities.",
      sections: [
        { title: "1. Build a clear actor profile", body: "Use a professional name, current city, concise bio, skills, languages or dialects, and relevant experience. A complete profile helps casting teams understand your fit quickly." },
        { title: "2. Use current natural photos", body: "Start with a clear headshot and full-length photo in good light without filters that change your appearance. Casting photos should represent how you look today." },
        { title: "3. Record a short introduction", body: "Introduce yourself, your city, skills and languages or dialects. Keep the audio clear, camera steady and background simple." },
        { title: "4. Follow acting and casting opportunities", body: "Focus on roles that fit your age, location and skills. Read the requirements before applying rather than submitting to every listing." },
        { title: "5. Treat auditions as a skill", body: "Understand the brief, listen to direction and be ready to adjust your performance. Not getting one role can simply mean the project required a different profile." },
      ],
      opportunityHref: "/opportunities/type/acting", opportunityLabel: "Browse acting opportunities", talentHref: "/talent/category/actor", talentLabel: "Browse actors in Saudi Arabia",
    },
  },
  "how-to-start-modeling-saudi-arabia": {
    ar: {
      title: "كيف تبدأ كمودل في السعودية؟ دليل للمبتدئين",
      description: "دليل عملي لمن يريد العمل كمودل في السعودية: الصور والقياسات وملف المودل وفرص تصوير الإعلانات وكيفية التقديم بشكل احترافي.",
      intro: "البداية كمودل في السعودية لا تتطلب أن يكون لديك بورتفوليو ضخم. تحتاج أولًا إلى ملف دقيق وصور حديثة ومعلومات واضحة، ثم اختيار فرص المودل والتصوير التي تناسب مواصفاتك وموقعك.",
      sections: [
        { title: "1. أنشئ ملف مودل دقيق", body: "أضف مدينتك وبياناتك الأساسية والقياسات المطلوبة بصورة صحيحة. لا تبالغ في الخبرة أو تغير المعلومات لأن دقة الملف مهمة عند الترشيح للتصوير." },
        { title: "2. جهز صورًا بسيطة وواضحة", body: "استخدم صورة وجه وصورة كاملة وصورًا إضافية طبيعية عند الحاجة. تجنب الفلاتر الثقيلة والمونتاج الذي يغير الشكل الحقيقي." },
        { title: "3. افهم نوع فرصة التصوير", body: "فرص المودل قد تكون لإعلان تجاري أو متجر إلكتروني أو محتوى علامة تجارية أو تصوير منتجات. اقرأ طبيعة المشروع والاستخدام المتوقع للصور قبل التقديم." },
        { title: "4. قدم على الفرص المناسبة", body: "راجع المدينة والتاريخ والمتطلبات والمقابل قبل التقديم. وجود ملف كامل يجعل قرار صاحب الفرصة أسرع من إرسال معلومات متفرقة عبر الرسائل." },
        { title: "5. حافظ على تحديث ملفك", body: "حدّث صورك وقياساتك ومدينتك وتوفرك عندما تتغير. الملف القديم قد يجعلك غير مناسب لفرصة رغم أن وضعك الحالي مناسب لها." },
      ],
      opportunityHref: "/opportunities/type/modeling", opportunityLabel: "تصفح فرص المودل والتصوير", talentHref: "/talent/category/model", talentLabel: "استعرض المودلز في السعودية",
    },
    en: {
      title: "How to Start Modeling in Saudi Arabia: A Beginner Guide",
      description: "A practical guide to modeling in Saudi Arabia covering photos, measurements, model profiles, advertising shoots and professional applications.",
      intro: "You do not need a huge portfolio to start modeling in Saudi Arabia. Begin with accurate information, current photos and a clear profile, then focus on modeling and advertising opportunities that match you.",
      sections: [
        { title: "1. Create an accurate model profile", body: "Add your city, essential information and requested measurements accurately. Reliable profile information matters when projects shortlist talent." },
        { title: "2. Prepare simple clear photos", body: "Use a clear face photo, full-length image and a few natural additional photos when useful. Avoid heavy filters or edits that change your appearance." },
        { title: "3. Understand the type of shoot", body: "Modeling work can include commercials, e-commerce, brand content and product campaigns. Understand the project and intended image usage before applying." },
        { title: "4. Apply selectively", body: "Check location, date, requirements and compensation. A complete profile is easier for opportunity owners to review than fragmented information sent through messages." },
        { title: "5. Keep your profile current", body: "Update photos, measurements, city and availability when they change. Current information improves matching with new opportunities." },
      ],
      opportunityHref: "/opportunities/type/modeling", opportunityLabel: "Browse modeling opportunities", talentHref: "/talent/category/model", talentLabel: "Browse models in Saudi Arabia",
    },
  },
  "casting-auditions-saudi-arabia": {
    ar: {
      title: "تجارب الأداء والكاستينج في السعودية: كيف تستعد؟",
      description: "دليل للاستعداد لتجارب الأداء والكاستينج في السعودية: فهم الدور، السيلف تيب، التوجيه، الملف المهني وطريقة التقديم على فرص التمثيل.",
      intro: "تجربة الأداء ليست مجرد حفظ نص. في الكاستينج يتم تقييم مدى ملاءمتك للدور، حضورك أمام الكاميرا، فهمك للتوجيه واستعدادك المهني. تجهيز الأساسيات قبل التجربة يساعدك على تقديم نفسك بصورة أوضح.",
      sections: [
        { title: "1. اقرأ متطلبات الدور كاملة", body: "راجع العمر والمدينة والمهارات واللهجة والتواريخ وأي تعليمات خاصة قبل إرسال طلبك. لا تعتمد على عنوان الفرصة فقط." },
        { title: "2. افهم المشهد قبل الأداء", body: "حدد ما الذي تريده الشخصية وما السياق العام للمشهد. الأداء الطبيعي المبني على الفهم عادة أوضح من المبالغة في الصوت والحركة." },
        { title: "3. جهز السيلف تيب ببساطة", body: "استخدم كاميرا ثابتة وصوتًا واضحًا وإضاءة أمامية وخلفية هادئة. اتبع تعليمات الكاستينج في مدة الفيديو وطريقة التصوير والتسمية إن وُجدت." },
        { title: "4. استمع للتوجيه", body: "قد يطلب منك فريق الكاستينج إعادة المشهد بطريقة مختلفة. القدرة على فهم الملاحظة وتعديل الأداء جزء مهم من تجربة الأداء." },
        { title: "5. حافظ على ملفك جاهزًا", body: "وجود صور حديثة وبيانات صحيحة وفيديو تعريف مناسب يختصر وقت التقديم عندما تظهر فرصة كاستينج جديدة." },
      ],
      opportunityHref: "/opportunities/type/acting", opportunityLabel: "شاهد فرص التمثيل الحالية", talentHref: "/talent/category/actor", talentLabel: "استعرض ملفات الممثلين",
    },
    en: {
      title: "Casting Auditions in Saudi Arabia: How to Prepare",
      description: "A practical guide to casting auditions in Saudi Arabia covering role requirements, self-tapes, direction, profiles and acting opportunity applications.",
      intro: "An audition is more than memorizing lines. Casting teams consider your fit for the role, camera presence, ability to take direction and professional readiness. Preparing the basics helps you present yourself clearly.",
      sections: [
        { title: "1. Read the full role requirements", body: "Check age, city, skills, dialect, dates and any special instructions before applying. Do not rely only on the opportunity title." },
        { title: "2. Understand the scene", body: "Identify what the character wants and the context of the scene. A grounded performance based on understanding is usually clearer than exaggerated delivery." },
        { title: "3. Keep self-tapes simple", body: "Use a steady camera, clear audio, front lighting and a quiet background. Follow any instructions about duration, framing or file naming." },
        { title: "4. Take direction", body: "Casting teams may ask you to repeat a scene differently. Listening and adjusting your performance is an important audition skill." },
        { title: "5. Keep your profile ready", body: "Current photos, accurate information and a useful introduction video make it faster to apply when a new casting opportunity appears." },
      ],
      opportunityHref: "/opportunities/type/acting", opportunityLabel: "View acting opportunities", talentHref: "/talent/category/actor", talentLabel: "Browse actor profiles",
    },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) return {};
  const locale = rawLocale as Locale;
  const guide = content[slug]?.[locale];
  if (!guide) return { robots: { index: false, follow: false } };
  const canonical = `${SITE_URL}/${locale}/guides/${slug}`;
  return {
    title: `${guide.title} | ملامح`,
    description: guide.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/guides/${slug}`,
        en: `${SITE_URL}/en/guides/${slug}`,
        "x-default": `${SITE_URL}/ar/guides/${slug}`,
      },
    },
    openGraph: { title: guide.title, description: guide.description, url: canonical, siteName: "MLAMH", type: "article" },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const guide = content[slug]?.[locale];
  if (!guide) notFound();
  const isArabic = locale === "ar";
  const canonical = `${SITE_URL}/${locale}/guides/${slug}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isArabic ? "الرئيسية" : "Home", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isArabic ? "الأدلة" : "Guides", item: `${SITE_URL}/${locale}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
    ],
  };

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background text-white">
      <article className="mx-auto max-w-4xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        <Link href={`/${locale}/guides`} className="text-sm text-gold">{isArabic ? "← جميع أدلة ملامح" : "← All MLAMH guides"}</Link>
        <header className="mt-8 border-b border-white/10 pb-10">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">{isArabic ? "دليل المواهب" : "TALENT GUIDE"}</p>
          <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl">{guide.title}</h1>
          <p className="mt-6 text-base leading-8 text-white/60">{guide.intro}</p>
        </header>

        <div className="space-y-10 py-10">
          {guide.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-medium">{section.title}</h2>
              <p className="mt-3 text-base leading-8 text-white/60">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-3xl border border-gold/20 bg-gold/[0.05] p-6 sm:p-8">
          <h2 className="text-2xl font-medium">{isArabic ? "حوّل البحث إلى خطوة عملية" : "Turn research into your next step"}</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">{isArabic ? "بعد تجهيز ملفك، انتقل إلى الفرص المنشورة أو استعرض الملفات العامة لتفهم كيف تظهر المواهب على ملامح." : "Once your profile is ready, explore published opportunities or public talent profiles on MLAMH."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}${guide.opportunityHref}`} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-medium text-black">{guide.opportunityLabel}</Link>
            <Link href={`/${locale}${guide.talentHref}`} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75">{guide.talentLabel}</Link>
          </div>
        </section>
      </article>
      <Footer locale={locale} />
    </main>
  );
}
