import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "الشروط والأحكام | ملامح" : "Terms and Conditions | MLAMH",
    description: isArabic
      ? "الشروط والأحكام المنظمة لاستخدام ملامح وخدمات المواهب والفرص والكاستينغ."
      : "Terms governing the use of MLAMH talent, opportunities, and casting services.",
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  const sections = [
    {
      ar: "الموافقة على الشروط",
      en: "Acceptance of Terms",
      arText: [
        "تنظم هذه الشروط استخدام موقع ملامح (MLAMH) وحساباته وملفات المواهب والفرص وخدمات الكاستينغ والدعم والخصائص المرتبطة بها.",
        "باستخدام المنصة أو إنشاء حساب أو إرسال طلب أو Brief، يوافق المستخدم على هذه الشروط وسياسة الخصوصية والسياسات المرتبطة بالخدمة التي يستخدمها.",
      ],
      enText: [
        "These terms govern the use of the MLAMH website, accounts, talent profiles, opportunities, managed casting, support, and related features.",
        "By using the platform, creating an account, or submitting a request or brief, the user agrees to these terms, the Privacy Policy, and any policy applicable to the service used.",
      ],
    },
    {
      ar: "الأهلية والحساب",
      en: "Eligibility and Accounts",
      arText: [
        "يجب أن يكون المستخدم مؤهلًا نظاميًا لاستخدام الخدمة وإبرام الالتزامات الناتجة عنها. وإذا كان استخدام الخدمة يتطلب موافقة ولي أو وصي نظامي، فيجب الحصول عليها قبل الاستخدام.",
        "يلتزم المستخدم بتقديم بيانات صحيحة وكاملة ومحدثة، وحماية وسيلة تسجيل الدخول، وعدم مشاركة كلمة المرور أو رموز الدخول مع الآخرين.",
        "قد تدعم ملامح تسجيل الدخول بالبريد وكلمة المرور أو بواسطة مزود خارجي مثل Google. على المستخدم استخدام طريقة الدخول المرتبطة بحسابه أو اتباع مسار استعادة الوصول المتاح.",
      ],
      enText: [
        "Users must be legally eligible to use the service and enter into resulting obligations. Where parental or guardian authorization is required, it must be obtained before use.",
        "Users must provide accurate, complete, and current information and protect their sign-in method, passwords, and access codes.",
        "MLAMH may support password sign-in and external providers such as Google. Users should use the sign-in method associated with their account or the available access-recovery flow.",
      ],
    },
    {
      ar: "دور ملامح",
      en: "MLAMH's Role",
      arText: [
        "ملامح منصة تقنية للمواهب والفرص وجهات النشر، وقد تقدم كذلك خدمات مدارة مثل إدارة الكاستينغ عندما يتم الاتفاق عليها صراحةً.",
        "في الفرص التي تنشرها جهات مستقلة، لا تكون ملامح طرفًا في الاتفاق النهائي بين الموهبة والجهة الناشرة ما لم يُذكر خلاف ذلك بوضوح.",
        "لا تضمن ملامح حصول أي مستخدم على فرصة أو عقد أو قبول، ولا تضمن نتيجة عملية اختيار أو كاستينغ.",
      ],
      enText: [
        "MLAMH is a technology platform for talent, opportunities, and publishers and may also provide managed services such as casting management when expressly agreed.",
        "For opportunities published by independent organizations, MLAMH is not a party to the final agreement between talent and publisher unless expressly stated otherwise.",
        "MLAMH does not guarantee any user an opportunity, contract, acceptance, or casting outcome.",
      ],
    },
    {
      ar: "ملفات المواهب",
      en: "Talent Profiles",
      arText: [
        "تتحمل الموهبة مسؤولية صحة بياناتها المهنية وصورها ومهاراتها وخبراتها وقياساتها ونماذج أعمالها وأي روابط تضيفها.",
        "يجب أن يمتلك المستخدم الحقوق اللازمة لأي صورة أو فيديو أو محتوى يرفعه إلى ملامح.",
        "قد تخضع الملفات للمراجعة قبل النشر أو التقديم، ويحق لملامح طلب تعديل أو تعليق أو إزالة محتوى مضلل أو مخالف أو غير مناسب لطبيعة المنصة.",
      ],
      enText: [
        "Talent users are responsible for the accuracy of professional details, photos, skills, experience, measurements, portfolio material, and submitted links.",
        "Users must hold the necessary rights to any image, video, or content uploaded to MLAMH.",
        "Profiles may be reviewed before publication or application access. MLAMH may request changes, suspend, or remove misleading, prohibited, or inappropriate content.",
      ],
    },
    {
      ar: "الجهات والفرص",
      en: "Publishers and Opportunities",
      arText: [
        "تتحمل الجهة الناشرة مسؤولية صحة معلوماتها وتفاصيل الفرصة ومتطلباتها ومواعيدها وموقعها والمقابل المالي أو الشروط المرتبطة بها.",
        "يجب أن تكون الفرص حقيقية ومشروعة وواضحة، وألا تستخدم لجمع البيانات دون غرض مهني مشروع أو للإساءة أو الاحتيال أو التضليل.",
        "يجوز لملامح مراجعة الفرص أو رفضها أو تعليقها أو حذفها عند وجود مخالفة أو مخاطر على المستخدمين أو المنصة.",
      ],
      enText: [
        "Publishers are responsible for the accuracy of their information and opportunity details, requirements, dates, location, compensation, and related terms.",
        "Opportunities must be genuine, lawful, and clear and must not be used merely to harvest data or for abuse, fraud, or deception.",
        "MLAMH may review, reject, suspend, or remove opportunities where there is a violation or risk to users or the platform.",
      ],
    },
    {
      ar: "التقديم والتواصل",
      en: "Applications and Communication",
      arText: [
        "تتيح ملامح للمواهب التقديم على الفرص وللجهات مراجعة الطلبات واتخاذ قراراتها وفق احتياجها.",
        "قد تُفتح بعض قنوات التواصل أو المحتوى المقيد فقط بعد تحقق شروط الوصول المعتمدة في المنصة.",
        "يتحمل الطرفان مسؤولية التحقق من الهوية والمتطلبات والتفاصيل المهنية والمالية قبل إبرام أي اتفاق خارج نطاق الخدمة التي تقدمها ملامح مباشرة.",
      ],
      enText: [
        "MLAMH allows talent to apply for opportunities and publishers to review applications and make decisions according to their needs.",
        "Certain communication channels or restricted content may only become available after the platform's access conditions are satisfied.",
        "Both parties are responsible for verifying identity, requirements, and professional and financial details before entering into any agreement outside services directly provided by MLAMH.",
      ],
    },
    {
      ar: "خدمة إدارة الكاستينغ والـ Brief",
      en: "Managed Casting and Briefs",
      arText: [
        "يمكن للشركات والوكالات وجهات الإنتاج والعلامات إرسال Brief إلى ملامح لطلب إدارة أو دعم عملية الكاستينغ.",
        "إرسال الـ Brief وحده لا ينشئ التزامًا ماليًا. يتم أولًا مراجعة النطاق ثم توضيح الخدمة والتكلفة والتنفيذ عند انطباقها وقبل بدء أي عمل مدفوع.",
        "قد تشمل الخدمة تجهيز نطاق الكاستينغ، استقبال الطلبات، البحث عن المواهب، الفرز أو إعداد قائمة مختصرة بحسب العرض المتفق عليه. القرار النهائي للعميل ما لم ينص الاتفاق على خلاف ذلك.",
      ],
      enText: [
        "Companies, agencies, production teams, and brands may submit a brief to MLAMH for managed casting or casting support.",
        "Submitting a brief alone does not create a payment obligation. MLAMH first reviews the scope and then communicates the service, price, and delivery terms where applicable before paid work starts.",
        "The service may include casting setup, application intake, sourcing, screening, or shortlist preparation according to the agreed scope. Final selection remains with the client unless otherwise agreed.",
      ],
    },
    {
      ar: "الأسعار والمدفوعات",
      en: "Prices and Payments",
      arText: [
        "إذا كانت خدمة مدفوعة متاحة، يجب أن يظهر للمستخدم أو يُقدم له وصف الخدمة وسعرها والرسوم أو الضرائب ذات الصلة وترتيبات الدفع والتنفيذ قبل تأكيد العملية بالقدر المنطبق على طبيعة الخدمة.",
        "قد تتم معالجة الدفع عبر مزود دفع خارجي. يخضع نجاح العملية كذلك لأنظمة وسياسات مزود الدفع والبنك المصدر.",
        "تخضع طلبات الإلغاء والاسترداد لسياسة الاسترجاع والاسترداد وللحقوق الإلزامية التي تقررها الأنظمة السعودية ذات الصلة.",
      ],
      enText: [
        "Where a paid service is available, the service description, price, applicable fees or taxes, and payment/performance arrangements should be presented or provided before confirmation to the extent applicable to the service.",
        "Payments may be processed through a third-party payment provider and are also subject to the payment provider and issuing bank's systems and rules.",
        "Cancellation and refund requests are governed by the Refund & Cancellation Policy and any mandatory rights under applicable Saudi law.",
      ],
    },
    {
      ar: "الاستخدام المحظور",
      en: "Prohibited Use",
      arText: [
        "يُحظر الاحتيال أو انتحال الهوية أو نشر محتوى غير مشروع أو مضلل أو مسيء، ومحاولة اختراق المنصة أو تعطيلها أو تجاوز قيود الوصول أو الوصول إلى بيانات لا يملك المستخدم صلاحية رؤيتها.",
        "يُحظر جمع أو نسخ بيانات المستخدمين آليًا أو استخدام المنصة للبريد المزعج أو التسويق غير المصرح به أو أي غرض يتعارض مع الأنظمة أو حقوق الآخرين.",
      ],
      enText: [
        "Fraud, impersonation, unlawful, misleading, or abusive content, attempts to compromise or disrupt the platform, bypass access controls, or access data without authorization are prohibited.",
        "Automated harvesting or copying of user data, spam, unauthorized marketing, or any use contrary to law or the rights of others is prohibited.",
      ],
    },
    {
      ar: "الملكية الفكرية",
      en: "Intellectual Property",
      arText: [
        "تبقى حقوق المحتوى الذي يملكه المستخدم لصاحبه، ويمنح المستخدم ملامح الترخيص اللازم تقنيًا لتخزين المحتوى ومعالجته وعرضه وتشغيله ضمن وظائف المنصة بالقدر اللازم لتقديم الخدمة.",
        "اسم ملامح وعلامتها وتصميماتها ومحتواها الأصلي والبرمجيات والمواد التي تملكها محمية، ولا يجوز نسخها أو استخدامها خارج المسموح دون إذن.",
      ],
      enText: [
        "Users retain ownership of content they own and grant MLAMH the technical permission needed to store, process, display, and operate that content within platform features as necessary to provide the service.",
        "MLAMH's name, brand, designs, original content, software, and owned materials are protected and may not be copied or used beyond permitted use without authorization.",
      ],
    },
    {
      ar: "الخصوصية وحماية البيانات",
      en: "Privacy and Data Protection",
      arText: [
        "تخضع معالجة البيانات الشخصية لسياسة الخصوصية في ملامح والمتطلبات النظامية المنطبقة في المملكة العربية السعودية.",
        "على المستخدم عدم نشر بيانات شخصية للآخرين دون مسوغ أو إذن مناسب، وعدم استخدام البيانات التي يصل إليها عبر ملامح خارج الغرض المهني المسموح به.",
      ],
      enText: [
        "Personal-data processing is governed by the MLAMH Privacy Policy and applicable requirements in Saudi Arabia.",
        "Users must not publish another person's personal data without an appropriate basis or permission or use data accessed through MLAMH beyond the permitted professional purpose.",
      ],
    },
    {
      ar: "التعليق والإنهاء",
      en: "Suspension and Termination",
      arText: [
        "يجوز لملامح تعليق أو تقييد أو إغلاق حساب أو محتوى عند مخالفة هذه الشروط أو وجود خطر أمني أو احتيال أو طلب نظامي صحيح أو لحماية المستخدمين والمنصة.",
        "قد يتاح للمستخدم طلب حذف الحساب وفق سياسة الخصوصية، مع مراعاة السجلات التي يلزم الاحتفاظ بها نظامًا أو لحماية الحقوق وتسوية النزاعات.",
      ],
      enText: [
        "MLAMH may suspend, restrict, or close an account or content for violations, security risk, fraud, a valid legal request, or to protect users and the platform.",
        "Users may request account deletion under the Privacy Policy, subject to records that must be retained for legal obligations, rights protection, or dispute resolution.",
      ],
    },
    {
      ar: "حدود المسؤولية",
      en: "Limitation of Liability",
      arText: [
        "تُقدم المنصة والخصائص بحسب توافرها، وقد تتأثر بخدمات أو مزودين خارجيين. لا تضمن ملامح استمرار الخدمة دون انقطاع أو خلوها من جميع الأخطاء.",
        "إلى الحد الذي يسمح به النظام، لا تتحمل ملامح مسؤولية اتفاقات مستقلة بين المستخدمين أو معلومات خاطئة يقدمها مستخدم آخر أو أضرار ناتجة عن استخدام مخالف لهذه الشروط.",
        "لا تستبعد هذه الشروط أي مسؤولية أو حق لا يجوز استبعاده أو تقييده بموجب النظام.",
      ],
      enText: [
        "The platform and features are provided subject to availability and may depend on third-party services. MLAMH does not guarantee uninterrupted or error-free operation.",
        "To the extent permitted by law, MLAMH is not responsible for independent agreements between users, incorrect information supplied by another user, or harm resulting from use in violation of these terms.",
        "Nothing in these terms excludes a liability or right that cannot lawfully be excluded or limited.",
      ],
    },
    {
      ar: "القانون المنطبق والنزاعات",
      en: "Governing Law and Disputes",
      arText: [
        "تخضع هذه الشروط للأنظمة المعمول بها في المملكة العربية السعودية. ويُسعى أولًا إلى حل أي شكوى أو نزاع متعلق بخدمة ملامح عبر قنوات الدعم، دون الإخلال بحق أي طرف في اللجوء إلى الجهة المختصة وفق النظام.",
      ],
      enText: [
        "These terms are governed by the laws and regulations of the Kingdom of Saudi Arabia. Service-related complaints or disputes should first be raised through MLAMH support without limiting any party's right to approach the competent authority under applicable law.",
      ],
    },
    {
      ar: "تحديث الشروط",
      en: "Changes to Terms",
      arText: [
        "قد نحدث هذه الشروط عند تطوير الخدمات أو تغير المتطلبات التشغيلية أو النظامية. ننشر النسخة المحدثة وتاريخها في هذه الصفحة، ونقدم إشعارًا إضافيًا إذا كان التغيير جوهريًا أو كان النظام يتطلب ذلك.",
      ],
      enText: [
        "We may update these terms as services or operational or legal requirements change. The updated version and date will be published here, with additional notice where a change is material or legally required.",
      ],
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-xs text-gold">{isRtl ? "قانوني" : "Legal"}</p>
          <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
            {isRtl ? "الشروط والأحكام" : "Terms and Conditions"}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
            {isRtl
              ? "توضح هذه الشروط قواعد استخدام ملامح، ومسؤوليات المواهب والجهات، وشروط الخدمات المدارة والمدفوعات عند توفرها."
              : "These terms explain the rules for using MLAMH, the responsibilities of talent and publishers, and the terms for managed and paid services where available."}
          </p>
          <p className="mt-5 text-xs text-white/35">{isRtl ? "آخر تحديث: سبتمبر 2026" : "Last updated: September 2026"}</p>
        </section>

        <div className="mt-8 space-y-5">
          {sections.map((section, index) => (
            <section key={section.en} className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="mt-1 text-sm text-gold">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-light">{isRtl ? section.ar : section.en}</h2>
                  <div className="mt-4 space-y-4">
                    {(isRtl ? section.arText : section.enText).map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-8 text-white/55">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
          <h2 className="text-xl font-light">{isRtl ? "سياسات مرتبطة" : "Related Policies"}</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/${locale}/privacy`} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gold">
              {isRtl ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link href={`/${locale}/refund-policy`} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gold">
              {isRtl ? "سياسة الاسترجاع" : "Refund Policy"}
            </Link>
            <Link href={`/${locale}/complaints`} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gold">
              {isRtl ? "الشكاوى والمقترحات" : "Complaints & Feedback"}
            </Link>
            <Link href={`/${locale}/contact`} className="rounded-xl bg-gold px-4 py-3 text-sm font-medium text-black">
              {isRtl ? "الدعم والتواصل" : "Support & Contact"}
            </Link>
          </div>
          <a href="mailto:hello@mlamh.net" className="mt-5 inline-flex text-sm text-white/50 transition hover:text-gold">hello@mlamh.net</a>
        </section>
      </div>
    </main>
  );
}
