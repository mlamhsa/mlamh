import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "سياسة الخصوصية | ملامح" : "Privacy Policy | MLAMH",
    description: isArabic
      ? "اطّلع على سياسة الخصوصية الخاصة بمنصة ملامح وكيفية جمع المعلومات واستخدامها وحمايتها."
      : "Learn how MLAMH collects, uses, protects, and manages personal information.",
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  const sections = [
    {
      titleAr: "مقدمة",
      titleEn: "Introduction",
      contentAr: [
        "تحترم منصة ملامح خصوصية المستخدمين، وتلتزم بالتعامل مع المعلومات الشخصية بمسؤولية وشفافية.",
        "توضح هذه السياسة أنواع المعلومات التي قد نجمعها، وكيفية استخدامها وحمايتها، والخيارات المتاحة للمستخدم بشأن بياناته.",
      ],
      contentEn: [
        "MLAMH respects the privacy of its users and is committed to handling personal information responsibly and transparently.",
        "This policy explains the information we may collect, how it is used and protected, and the choices available to users regarding their data.",
      ],
    },
    {
      titleAr: "المعلومات التي نجمعها",
      titleEn: "Information We Collect",
      contentAr: [
        "قد نجمع المعلومات التي يقدمها المستخدم مباشرة عند إنشاء الحساب أو تحديث الملف الشخصي أو نشر فرصة أو التقديم عليها.",
        "قد تشمل هذه المعلومات الاسم، البريد الإلكتروني، رقم التواصل، المدينة، المعلومات المهنية، الصور، السيرة الذاتية، نماذج الأعمال، وبيانات الشركة أو الجهة.",
        "قد نجمع أيضًا معلومات تقنية أساسية مثل نوع الجهاز والمتصفح وعنوان بروتوكول الإنترنت وسجلات استخدام المنصة، عند توفرها.",
      ],
      contentEn: [
        "We may collect information provided directly when a user creates an account, updates a profile, publishes an opportunity, or submits an application.",
        "This may include a name, email address, contact number, city, professional information, photographs, résumé, portfolio items, and company or organization details.",
        "We may also collect basic technical information, such as device type, browser, IP address, and platform usage records, when available.",
      ],
    },
    {
      titleAr: "كيفية استخدام المعلومات",
      titleEn: "How We Use Information",
      contentAr: [
        "نستخدم المعلومات لتشغيل المنصة وتقديم خدماتها، وإنشاء الحسابات وإدارتها، وعرض الملفات الشخصية والفرص، ومعالجة طلبات التقديم.",
        "قد نستخدمها أيضًا لتحسين تجربة المستخدم، وإرسال الإشعارات المتعلقة بالحساب أو الطلبات، والرد على الاستفسارات وطلبات الدعم.",
        "قد نستخدم البيانات لمنع إساءة الاستخدام، وتعزيز الأمان، والالتزام بالمتطلبات النظامية عند انطباقها.",
      ],
      contentEn: [
        "We use information to operate the platform, provide its services, create and manage accounts, display profiles and opportunities, and process applications.",
        "We may also use it to improve the user experience, send account or application notifications, and respond to inquiries and support requests.",
        "Information may be used to prevent misuse, improve security, and comply with applicable legal requirements.",
      ],
    },
    {
      titleAr: "ظهور المعلومات للمستخدمين الآخرين",
      titleEn: "Information Visible to Other Users",
      contentAr: [
        "قد تكون بعض معلومات الملف الشخصي للمواهب ظاهرة للشركات أو للمستخدمين الآخرين بحسب إعدادات المنصة وطبيعة الخدمة.",
        "قد تتضمن المعلومات الظاهرة الاسم المهني، الصورة، المدينة، المهارات، الخبرات، ونماذج الأعمال التي يختار المستخدم إضافتها.",
        "تظهر معلومات الفرص المنشورة للمستخدمين المؤهلين للاطلاع عليها والتقديم عليها.",
      ],
      contentEn: [
        "Some talent profile information may be visible to companies or other users, depending on platform settings and the nature of the service.",
        "Visible information may include a professional name, photograph, city, skills, experience, and portfolio items selected by the user.",
        "Published opportunity information may be visible to users who are eligible to view and apply for it.",
      ],
    },
    {
      titleAr: "مشاركة المعلومات",
      titleEn: "Sharing Information",
      contentAr: [
        "لا نبيع المعلومات الشخصية للمستخدمين.",
        "قد تتم مشاركة المعلومات بالقدر اللازم لتقديم وظائف المنصة، مثل مشاركة بيانات المتقدم مع الجهة التي نشرَت الفرصة.",
        "قد نستعين بمزودي خدمات تقنيين للمساعدة في الاستضافة، التخزين، المصادقة، الإشعارات، التحليلات، أو حماية المنصة.",
        "قد نفصح عن المعلومات عند وجود التزام نظامي أو طلب رسمي صالح من جهة مختصة.",
      ],
      contentEn: [
        "We do not sell users’ personal information.",
        "Information may be shared when necessary to provide platform features, such as sharing applicant information with the organization that published an opportunity.",
        "We may use technical service providers for hosting, storage, authentication, notifications, analytics, or platform security.",
        "Information may be disclosed where required by applicable law or a valid request from a competent authority.",
      ],
    },
    {
      titleAr: "حماية البيانات",
      titleEn: "Data Protection",
      contentAr: [
        "نتخذ إجراءات تقنية وتنظيمية معقولة للمساعدة في حماية المعلومات من الوصول غير المصرح به أو الفقد أو التعديل أو إساءة الاستخدام.",
        "ومع ذلك، لا توجد وسيلة إلكترونية تضمن الأمان الكامل، لذلك يتحمل المستخدم مسؤولية حماية بيانات تسجيل الدخول وعدم مشاركتها مع الآخرين.",
      ],
      contentEn: [
        "We take reasonable technical and organizational measures to help protect information against unauthorized access, loss, alteration, or misuse.",
        "However, no electronic method can guarantee complete security. Users are responsible for protecting their login credentials and not sharing them with others.",
      ],
    },
    {
      titleAr: "الاحتفاظ بالمعلومات",
      titleEn: "Data Retention",
      contentAr: [
        "نحتفظ بالمعلومات للمدة اللازمة لتقديم خدمات المنصة، وإدارة الحساب، وتنفيذ الأغراض الموضحة في هذه السياسة.",
        "قد نحتفظ ببعض البيانات لمدة إضافية عندما يكون ذلك ضروريًا للالتزام بالمتطلبات النظامية، أو تسوية النزاعات، أو حماية حقوق المنصة والمستخدمين.",
      ],
      contentEn: [
        "We retain information for as long as necessary to provide platform services, manage accounts, and fulfill the purposes described in this policy.",
        "Certain information may be retained for an additional period where necessary to comply with legal requirements, resolve disputes, or protect the rights of the platform and its users.",
      ],
    },
    {
      titleAr: "حقوق المستخدم",
      titleEn: "User Rights",
      contentAr: [
        "يمكن للمستخدم مراجعة بعض بياناته أو تحديثها من خلال إعدادات الحساب عند توفر هذه الخاصية.",
        "يمكن للمستخدم التواصل معنا لطلب تصحيح معلوماته أو حذف حسابه وبياناته، مع مراعاة أي التزامات نظامية أو حالات تتطلب الاحتفاظ ببعض السجلات.",
        "قد نطلب التحقق من هوية مقدم الطلب قبل تنفيذ الطلب لحماية خصوصية المستخدم.",
      ],
      contentEn: [
        "Users may review or update certain information through their account settings where this feature is available.",
        "Users may contact us to request correction of their information or deletion of their account and data, subject to legal obligations or circumstances requiring certain records to be retained.",
        "We may request identity verification before completing a request to protect user privacy.",
      ],
    },
    {
      titleAr: "ملفات تعريف الارتباط",
      titleEn: "Cookies",
      contentAr: [
        "قد تستخدم المنصة ملفات تعريف الارتباط أو تقنيات مشابهة لتشغيل الجلسات، وتذكر التفضيلات، وتحسين الأداء والأمان.",
        "يمكن للمستخدم التحكم في بعض هذه التقنيات من خلال إعدادات المتصفح، وقد يؤدي تعطيلها إلى التأثير في بعض وظائف المنصة.",
      ],
      contentEn: [
        "The platform may use cookies or similar technologies to operate sessions, remember preferences, and improve performance and security.",
        "Users may control some of these technologies through browser settings, although disabling them may affect certain platform features.",
      ],
    },
    {
      titleAr: "خصوصية القاصرين",
      titleEn: "Children’s Privacy",
      contentAr: [
        "لا تستهدف المنصة الأطفال الذين تقل أعمارهم عن السن المسموح به نظاميًا لاستخدام هذه الخدمات دون موافقة ولي الأمر.",
        "إذا تبين لنا جمع معلومات من قاصر بطريقة غير مسموحة، فسنتخذ الإجراءات المناسبة لحذفها أو معالجتها وفق المتطلبات المنطبقة.",
      ],
      contentEn: [
        "The platform is not intended for children below the legally permitted age to use these services without parental or guardian consent.",
        "If we learn that information has been collected from a minor in an unauthorized manner, we will take appropriate steps to delete or otherwise handle it in accordance with applicable requirements.",
      ],
    },
    {
      titleAr: "الخدمات والروابط الخارجية",
      titleEn: "External Services and Links",
      contentAr: [
        "قد تحتوي المنصة على روابط لخدمات أو مواقع خارجية لا تديرها ملامح.",
        "لا تتحمل ملامح مسؤولية ممارسات الخصوصية أو المحتوى الخاص بتلك الخدمات، ويُنصح المستخدم بمراجعة سياساتها بشكل مستقل.",
      ],
      contentEn: [
        "The platform may contain links to external websites or services that are not operated by MLAMH.",
        "MLAMH is not responsible for the privacy practices or content of those services, and users should review their policies separately.",
      ],
    },
    {
      titleAr: "تحديث سياسة الخصوصية",
      titleEn: "Updates to This Policy",
      contentAr: [
        "قد نقوم بتحديث سياسة الخصوصية عند تطوير خدمات المنصة أو تغير المتطلبات التشغيلية أو النظامية.",
        "سيتم نشر النسخة المحدثة في هذه الصفحة، ويُعد استمرار استخدام المنصة بعد نشر التحديث قبولًا بالسياسة المحدثة بالقدر الذي يسمح به النظام.",
      ],
      contentEn: [
        "We may update this privacy policy as platform services develop or operational and legal requirements change.",
        "The updated version will be published on this page. Continued use of the platform after publication constitutes acceptance of the updated policy to the extent permitted by law.",
      ],
    },
    {
      titleAr: "التواصل معنا",
      titleEn: "Contact Us",
      contentAr: [
        "للاستفسارات أو الطلبات المتعلقة بالخصوصية والبيانات الشخصية، يمكن التواصل معنا عبر البريد الإلكتروني: support@mlamh.com.",
      ],
      contentEn: [
        "For questions or requests relating to privacy and personal information, contact us at support@mlamh.com.",
      ],
    },
  ];

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="relative max-w-3xl">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.28em]"
              }`}
            >
              {isRtl ? "قانوني" : "Legal"}
            </p>

            <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
              {isRtl ? "سياسة الخصوصية" : "Privacy Policy"}
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "توضح هذه السياسة كيفية تعامل منصة ملامح مع المعلومات الشخصية والبيانات المرتبطة باستخدام خدماتها."
                : "This policy explains how MLAMH handles personal information and data associated with the use of its services."}
            </p>

            <p className="mt-5 text-xs text-white/35">
              {isRtl
                ? "آخر تحديث: يوليو 2026"
                : "Last updated: July 2026"}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
          <p className="text-sm leading-8 text-white/65">
            {isRtl
              ? "باستخدام منصة ملامح، فإنك تقر بأنك اطّلعت على سياسة الخصوصية وفهمت كيفية جمع معلوماتك واستخدامها والتعامل معها."
              : "By using MLAMH, you acknowledge that you have reviewed this privacy policy and understand how your information may be collected, used, and handled."}
          </p>
        </section>

        <div className="mt-8 space-y-5">
          {sections.map((section, index) => (
            <section
              key={section.titleEn}
              className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="mt-1 text-sm text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-light text-white">
                    {isRtl ? section.titleAr : section.titleEn}
                  </h2>

                  <div className="mt-4 space-y-4">
                    {(isRtl
                      ? section.contentAr
                      : section.contentEn
                    ).map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-8 text-white/55"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 text-center sm:p-8">
          <p className="text-sm leading-8 text-white/50">
            {isRtl
              ? "للاستفسارات المتعلقة بالخصوصية:"
              : "For privacy-related inquiries:"}
          </p>

          <a
            href="mailto:support@mlamh.com"
            dir="ltr"
            className="mt-3 inline-flex text-gold transition hover:text-gold-soft"
          >
            support@mlamh.com
          </a>
        </section>
      </div>
    </main>
  );
}