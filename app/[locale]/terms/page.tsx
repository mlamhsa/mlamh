import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic
      ? "الشروط والأحكام | ملامح"
      : "Terms and Conditions | MLAMH",
    description: isArabic
      ? "اطّلع على الشروط والأحكام المنظمة لاستخدام منصة ملامح وخدماتها."
      : "Review the terms and conditions governing the use of MLAMH and its services.",
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
      titleAr: "مقدمة",
      titleEn: "Introduction",
      contentAr: [
        "تنظم هذه الشروط والأحكام استخدام منصة ملامح والخدمات والخصائص المتاحة من خلالها.",
        "يعد دخول المستخدم إلى المنصة أو إنشاء حساب أو استخدام أي من خدماتها موافقة على الالتزام بهذه الشروط.",
        "إذا لم يوافق المستخدم على هذه الشروط، فيجب عليه التوقف عن استخدام المنصة.",
      ],
      contentEn: [
        "These terms and conditions govern the use of the MLAMH platform and the services and features available through it.",
        "By accessing the platform, creating an account, or using any of its services, the user agrees to be bound by these terms.",
        "If the user does not agree to these terms, they must stop using the platform.",
      ],
    },
    {
      titleAr: "التعريفات",
      titleEn: "Definitions",
      contentAr: [
        "تشير كلمة «ملامح» أو «المنصة» إلى الموقع والخدمات الرقمية التابعة لملامح.",
        "يشير «المستخدم» إلى كل شخص أو جهة تستخدم المنصة، بما في ذلك المواهب والشركات والوكالات وجهات الإنتاج.",
        "تشير «الموهبة» إلى المستخدم الذي ينشئ ملفًا مهنيًا أو يتقدم إلى الفرص.",
        "تشير «الجهة الناشرة» إلى الشركة أو الوكالة أو جهة الإنتاج أو أي جهة تنشر فرصة عبر المنصة.",
        "تشير «الفرصة» إلى أي إعلان مهني أو مشروع أو عمل أو طلب مواهب يتم نشره عبر المنصة.",
      ],
      contentEn: [
        "“MLAMH” or “the platform” refers to the website and digital services operated under the MLAMH name.",
        "“User” means any individual or organization using the platform, including talent, companies, agencies, and production entities.",
        "“Talent” means a user who creates a professional profile or applies for opportunities.",
        "“Publisher” means a company, agency, production entity, or other organization that publishes an opportunity through the platform.",
        "“Opportunity” means any professional listing, project, work request, or talent requirement published through the platform.",
      ],
    },
    {
      titleAr: "الأهلية لاستخدام المنصة",
      titleEn: "Eligibility",
      contentAr: [
        "يجب أن يكون المستخدم مؤهلًا نظاميًا لاستخدام المنصة وإبرام الالتزامات الناتجة عن استخدامها.",
        "إذا كان المستخدم دون السن النظامية المسموح بها، فيجب أن يتم استخدام المنصة بموافقة ولي الأمر أو الوصي النظامي عند الحاجة.",
        "يحق لملامح رفض إنشاء حساب أو تعليق استخدامه إذا تبين عدم استيفاء متطلبات الأهلية.",
      ],
      contentEn: [
        "Users must be legally eligible to use the platform and enter into obligations arising from its use.",
        "If a user is below the legally permitted age, use of the platform must be authorized by a parent or legal guardian where required.",
        "MLAMH may refuse account creation or suspend access where eligibility requirements are not met.",
      ],
    },
    {
      titleAr: "إنشاء الحساب",
      titleEn: "Account Registration",
      contentAr: [
        "يلتزم المستخدم بتقديم معلومات صحيحة وكاملة ومحدثة عند إنشاء الحساب أو تحديثه.",
        "يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات تسجيل الدخول وجميع الأنشطة التي تتم من خلال حسابه.",
        "يجب إبلاغ ملامح فورًا عند الاشتباه في استخدام غير مصرح به للحساب.",
        "لا يجوز إنشاء حساب باستخدام بيانات شخص أو جهة أخرى دون تفويض صحيح.",
      ],
      contentEn: [
        "Users must provide accurate, complete, and current information when creating or updating an account.",
        "Users are responsible for maintaining the confidentiality of their login credentials and for all activity carried out through their account.",
        "MLAMH must be notified promptly if unauthorized account use is suspected.",
        "Users may not create an account using another person’s or organization’s information without proper authorization.",
      ],
    },
    {
      titleAr: "استخدام المنصة",
      titleEn: "Use of the Platform",
      contentAr: [
        "يجب استخدام المنصة لأغراض مشروعة ومهنية ومتوافقة مع هذه الشروط.",
        "لا يجوز استخدام المنصة للإساءة إلى الآخرين أو انتحال الهوية أو نشر محتوى مضلل أو احتيالي أو غير قانوني.",
        "لا يجوز محاولة اختراق المنصة أو تعطيلها أو الوصول غير المصرح به إلى حسابات أو بيانات أو أنظمة أخرى.",
        "لا يجوز استخدام أدوات آلية لجمع البيانات أو نسخ المحتوى أو إساءة استخدام وظائف المنصة دون إذن مكتوب.",
      ],
      contentEn: [
        "The platform must be used for lawful and professional purposes consistent with these terms.",
        "Users may not harass others, impersonate another person, or publish misleading, fraudulent, or unlawful content.",
        "Users may not attempt to compromise, disrupt, or gain unauthorized access to the platform, accounts, data, or other systems.",
        "Automated tools may not be used to collect data, copy content, or misuse platform features without written permission.",
      ],
    },
    {
      titleAr: "ملفات المواهب",
      titleEn: "Talent Profiles",
      contentAr: [
        "تتحمل الموهبة مسؤولية صحة المعلومات والمهارات والخبرات والصور ونماذج الأعمال التي تضيفها إلى ملفها.",
        "يجب أن تمتلك الموهبة الحقوق اللازمة لاستخدام ونشر أي محتوى تضيفه إلى المنصة.",
        "لا تضمن ملامح صحة جميع المعلومات الواردة في الملفات الشخصية، وعلى الجهات الناشرة التحقق من المعلومات قبل اتخاذ أي قرار.",
        "يحق لملامح إزالة أي محتوى مخالف أو مضلل أو غير مناسب أو ينتهك حقوق الآخرين.",
      ],
      contentEn: [
        "Talent users are responsible for the accuracy of the information, skills, experience, images, and portfolio materials added to their profiles.",
        "Talent users must hold the necessary rights to use and publish any content uploaded to the platform.",
        "MLAMH does not guarantee the accuracy of all profile information, and publishers should verify information before making decisions.",
        "MLAMH may remove content that is misleading, inappropriate, unlawful, or infringes the rights of others.",
      ],
    },
    {
      titleAr: "نشر الفرص",
      titleEn: "Publishing Opportunities",
      contentAr: [
        "تتحمل الجهة الناشرة مسؤولية صحة تفاصيل الفرصة ومتطلباتها ومواعيدها وموقعها وأي معلومات مالية أو تعاقدية مرتبطة بها.",
        "يجب أن تكون الفرص المنشورة مشروعة وحقيقية وواضحة، وألا تتضمن تضليلًا أو تمييزًا غير مشروع أو إساءة استخدام للمواهب.",
        "لا يجوز نشر فرص وهمية أو استخدام المنصة لجمع البيانات دون وجود غرض مهني مشروع.",
        "يحق لملامح مراجعة الفرص أو تعليقها أو حذفها إذا خالفت هذه الشروط أو الأنظمة المعمول بها.",
      ],
      contentEn: [
        "Publishers are responsible for the accuracy of opportunity details, requirements, deadlines, location, and any financial or contractual information.",
        "Published opportunities must be lawful, genuine, and clear, and must not contain deception, unlawful discrimination, or misuse of talent.",
        "Fake opportunities or listings intended only to collect data without a legitimate professional purpose are prohibited.",
        "MLAMH may review, suspend, or remove opportunities that violate these terms or applicable laws.",
      ],
    },
    {
      titleAr: "طلبات التقديم",
      titleEn: "Applications",
      contentAr: [
        "تتيح المنصة للمواهب التقديم على الفرص، وتتيح للجهات الناشرة مراجعة الطلبات وإدارتها.",
        "لا تضمن ملامح قبول أي طلب أو حصول أي مستخدم على فرصة أو عقد أو مقابل مالي.",
        "تتحمل الموهبة والجهة الناشرة مسؤولية أي تواصل أو تفاوض أو اتفاق يتم بينهما.",
        "يجوز للجهة الناشرة قبول الطلب أو رفضه أو إغلاق الفرصة وفق احتياجها، مع الالتزام بالأنظمة والمتطلبات المنطبقة.",
      ],
      contentEn: [
        "The platform enables talent to apply for opportunities and allows publishers to review and manage applications.",
        "MLAMH does not guarantee that any application will be accepted or that any user will receive an opportunity, contract, or payment.",
        "Talent and publishers are responsible for any communication, negotiation, or agreement entered into between them.",
        "Publishers may accept or reject applications or close opportunities according to their needs, subject to applicable laws and requirements.",
      ],
    },
    {
      titleAr: "العلاقات والاتفاقات بين المستخدمين",
      titleEn: "Agreements Between Users",
      contentAr: [
        "تعمل ملامح كمنصة تقنية لتسهيل الوصول والتواصل بين المواهب والجهات الناشرة.",
        "لا تعد ملامح طرفًا في أي عقد أو اتفاق يتم بين المستخدمين، ما لم يتم النص على خلاف ذلك بشكل صريح.",
        "يتحمل المستخدمون مسؤولية التحقق من الهوية والخبرة والأهلية والشروط المالية والتنفيذية قبل إبرام أي اتفاق.",
        "أي نزاع ينشأ بين المستخدمين يتم التعامل معه بينهم مباشرة، مع احتفاظ ملامح بحق التعاون عند وجود طلب نظامي صحيح.",
      ],
      contentEn: [
        "MLAMH operates as a technical platform that facilitates discovery and communication between talent and publishers.",
        "MLAMH is not a party to contracts or agreements between users unless expressly stated otherwise.",
        "Users are responsible for verifying identity, experience, eligibility, financial terms, and performance requirements before entering into an agreement.",
        "Disputes between users must be handled directly between them, while MLAMH may cooperate where a valid legal request exists.",
      ],
    },
    {
      titleAr: "الرسوم والمدفوعات",
      titleEn: "Fees and Payments",
      contentAr: [
        "قد تكون بعض خدمات المنصة مجانية، وقد تخضع خدمات أخرى لرسوم أو اشتراكات يتم توضيحها قبل استخدامها.",
        "عند تطبيق رسوم، يلتزم المستخدم بسداد المبالغ وفق الأسعار والشروط المعروضة وقت الشراء أو الاشتراك.",
        "ما لم يُذكر خلاف ذلك، فإن المبالغ المدفوعة لا تكون قابلة للاسترداد بعد تقديم الخدمة أو بدء فترة الاشتراك، مع مراعاة الحقوق النظامية للمستخدم.",
        "لا تتحمل ملامح مسؤولية المدفوعات التي تتم مباشرة بين المواهب والجهات الناشرة خارج خدمات الدفع الرسمية للمنصة.",
      ],
      contentEn: [
        "Some platform services may be free, while others may be subject to fees or subscriptions disclosed before use.",
        "Where fees apply, users must pay the amounts according to the prices and terms displayed at the time of purchase or subscription.",
        "Unless otherwise stated, payments are non-refundable after a service has been provided or a subscription period has started, subject to users’ statutory rights.",
        "MLAMH is not responsible for payments made directly between talent and publishers outside the platform’s official payment services.",
      ],
    },
    {
      titleAr: "المحتوى وحقوق الملكية الفكرية",
      titleEn: "Content and Intellectual Property",
      contentAr: [
        "تظل ملكية المحتوى الذي يرفعه المستخدم عائدة إليه أو إلى مالكه النظامي.",
        "يمنح المستخدم ملامح ترخيصًا غير حصري لعرض المحتوى وتخزينه ومعالجته بالقدر اللازم لتشغيل المنصة وتقديم خدماتها.",
        "تعود حقوق تصميم المنصة وشعارها وواجهاتها وبرمجياتها ومحتواها الأصلي إلى ملامح أو إلى أصحاب التراخيص المعنيين.",
        "لا يجوز نسخ أو إعادة نشر أو استغلال أي جزء من المنصة تجاريًا دون إذن مكتوب.",
      ],
      contentEn: [
        "Ownership of content uploaded by a user remains with that user or its lawful owner.",
        "The user grants MLAMH a non-exclusive license to display, store, and process the content to the extent necessary to operate the platform and provide its services.",
        "Rights in the platform design, logo, interfaces, software, and original content belong to MLAMH or the relevant licensors.",
        "No part of the platform may be copied, republished, or commercially exploited without written permission.",
      ],
    },
    {
      titleAr: "الخصوصية والبيانات",
      titleEn: "Privacy and Data",
      contentAr: [
        "تخضع معالجة المعلومات الشخصية لسياسة الخصوصية المنشورة على المنصة.",
        "يقر المستخدم بأن بعض معلوماته قد تظهر للمستخدمين الآخرين بحسب نوع الحساب وطبيعة الخدمة.",
        "ينبغي للمستخدم مراجعة سياسة الخصوصية لفهم كيفية جمع البيانات واستخدامها والاحتفاظ بها.",
      ],
      contentEn: [
        "The handling of personal information is governed by the privacy policy published on the platform.",
        "Users acknowledge that certain information may be visible to other users depending on account type and the nature of the service.",
        "Users should review the privacy policy to understand how information is collected, used, and retained.",
      ],
    },
    {
      titleAr: "التعليق وإنهاء الحساب",
      titleEn: "Suspension and Termination",
      contentAr: [
        "يجوز للمستخدم التوقف عن استخدام المنصة أو طلب حذف حسابه وفق الوسائل المتاحة.",
        "يحق لملامح تعليق الحساب أو تقييد الوصول أو إنهائه عند مخالفة هذه الشروط أو إساءة استخدام المنصة أو وجود مخاطر أمنية أو نظامية.",
        "قد يتم حذف المحتوى المرتبط بالحساب أو الاحتفاظ ببعض السجلات عند الحاجة للوفاء بالتزامات نظامية أو حماية حقوق المنصة والمستخدمين.",
      ],
      contentEn: [
        "Users may stop using the platform or request account deletion through the available methods.",
        "MLAMH may suspend, restrict, or terminate an account where these terms are violated, the platform is misused, or security or legal risks exist.",
        "Account-related content may be deleted, while certain records may be retained where necessary to meet legal obligations or protect the rights of the platform and its users.",
      ],
    },
    {
      titleAr: "إخلاء المسؤولية",
      titleEn: "Disclaimer",
      contentAr: [
        "تُقدم المنصة وخدماتها بالحالة المتاحة، وقد تتعرض للتوقف المؤقت أو الأخطاء أو أعمال الصيانة.",
        "لا تضمن ملامح استمرار توفر جميع الخدمات دون انقطاع أو خلوها الكامل من الأخطاء.",
        "لا تضمن ملامح صحة أو جودة أو ملاءمة المحتوى أو الفرص أو الملفات التي ينشرها المستخدمون.",
        "يتحمل المستخدم مسؤولية قراراته المهنية والتعاقدية والمالية الناتجة عن استخدام المنصة.",
      ],
      contentEn: [
        "The platform and its services are provided on an available basis and may experience temporary interruptions, errors, or maintenance.",
        "MLAMH does not guarantee uninterrupted availability or that all services will be entirely error-free.",
        "MLAMH does not guarantee the accuracy, quality, or suitability of content, opportunities, or profiles published by users.",
        "Users are responsible for professional, contractual, and financial decisions arising from use of the platform.",
      ],
    },
    {
      titleAr: "حدود المسؤولية",
      titleEn: "Limitation of Liability",
      contentAr: [
        "بالقدر الذي يسمح به النظام، لا تتحمل ملامح المسؤولية عن الأضرار غير المباشرة أو فقد الأرباح أو الفرص أو البيانات الناتجة عن استخدام المنصة أو تعذر استخدامها.",
        "لا تتحمل ملامح مسؤولية تصرفات المستخدمين أو إخلالهم بالاتفاقات أو عدم تنفيذهم للالتزامات المتفق عليها بينهم.",
        "لا يؤثر هذا البند في أي مسؤولية لا يجوز استبعادها أو تقييدها بموجب الأنظمة المنطبقة.",
      ],
      contentEn: [
        "To the extent permitted by law, MLAMH is not liable for indirect damages or loss of profits, opportunities, or data arising from use of or inability to use the platform.",
        "MLAMH is not responsible for user conduct, breaches of agreements, or failure to perform obligations agreed between users.",
        "Nothing in this section excludes or limits liability that cannot lawfully be excluded or limited.",
      ],
    },
    {
      titleAr: "التعويض",
      titleEn: "Indemnity",
      contentAr: [
        "يتحمل المستخدم المسؤولية عن الأضرار والمطالبات الناتجة عن مخالفته لهذه الشروط أو الأنظمة أو حقوق الآخرين.",
        "يجوز لملامح مطالبة المستخدم بالتعويض عن الخسائر أو المصروفات المعقولة الناتجة مباشرة عن مخالفته، بالقدر الذي يسمح به النظام.",
      ],
      contentEn: [
        "Users are responsible for damages and claims arising from their violation of these terms, applicable laws, or the rights of others.",
        "MLAMH may seek compensation for reasonable losses or expenses directly resulting from a user’s violation, to the extent permitted by law.",
      ],
    },
    {
      titleAr: "التعديلات على المنصة",
      titleEn: "Platform Changes",
      contentAr: [
        "يحق لملامح تطوير المنصة أو تعديل خصائصها أو إضافة خدمات أو إيقاف بعضها بصورة مؤقتة أو دائمة.",
        "قد تتغير بعض الوظائف أو المتطلبات أو حدود الاستخدام مع تطور المنصة.",
        "سنسعى إلى إشعار المستخدمين بالتغييرات الجوهرية متى كان ذلك مناسبًا وممكنًا.",
      ],
      contentEn: [
        "MLAMH may develop the platform, modify its features, add services, or temporarily or permanently discontinue certain services.",
        "Functions, requirements, or usage limits may change as the platform develops.",
        "We will seek to notify users of material changes where appropriate and reasonably possible.",
      ],
    },
    {
      titleAr: "تعديل الشروط",
      titleEn: "Changes to These Terms",
      contentAr: [
        "يجوز تحديث هذه الشروط لتتوافق مع تطوير الخدمات أو تغير المتطلبات التشغيلية أو النظامية.",
        "سيتم نشر النسخة المحدثة على هذه الصفحة مع توضيح تاريخ آخر تحديث.",
        "يعد استمرار استخدام المنصة بعد نشر التعديلات قبولًا بالشروط المحدثة بالقدر الذي يسمح به النظام.",
      ],
      contentEn: [
        "These terms may be updated to reflect service development or changes in operational or legal requirements.",
        "The updated version will be published on this page together with the latest revision date.",
        "Continued use of the platform after publication constitutes acceptance of the updated terms to the extent permitted by law.",
      ],
    },
    {
      titleAr: "الأنظمة والاختصاص",
      titleEn: "Governing Law and Jurisdiction",
      contentAr: [
        "تخضع هذه الشروط للأنظمة المعمول بها في المملكة العربية السعودية.",
        "تتم محاولة تسوية أي نزاع بصورة ودية أولًا، وإذا تعذر ذلك فيحال النزاع إلى الجهة القضائية المختصة في المملكة العربية السعودية.",
      ],
      contentEn: [
        "These terms are governed by the applicable laws of the Kingdom of Saudi Arabia.",
        "Any dispute should first be addressed through an amicable resolution. If this is not possible, the dispute will be referred to the competent judicial authority in the Kingdom of Saudi Arabia.",
      ],
    },
    {
      titleAr: "التواصل معنا",
      titleEn: "Contact Us",
      contentAr: [
        "للاستفسارات المتعلقة بهذه الشروط والأحكام، يمكن التواصل معنا عبر البريد الإلكتروني: support@mlamh.com.",
      ],
      contentEn: [
        "For questions relating to these terms and conditions, contact us at support@mlamh.com.",
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
              {isRtl ? "الشروط والأحكام" : "Terms and Conditions"}
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "توضح هذه الشروط القواعد والالتزامات المنظمة لاستخدام منصة ملامح وخدماتها."
                : "These terms explain the rules and obligations governing the use of MLAMH and its services."}
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
              ? "باستخدام منصة ملامح أو إنشاء حساب فيها، فإنك توافق على الالتزام بهذه الشروط والأحكام وسياسة الخصوصية."
              : "By using MLAMH or creating an account, you agree to comply with these terms and conditions and the privacy policy."}
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
              ? "للاستفسارات المتعلقة بالشروط والأحكام:"
              : "For terms-related inquiries:"}
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