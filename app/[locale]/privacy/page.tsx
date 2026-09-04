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
    title: isArabic ? "سياسة الخصوصية | ملامح" : "Privacy Policy | MLAMH",
    description: isArabic
      ? "سياسة الخصوصية في ملامح وكيفية جمع البيانات الشخصية واستخدامها وحمايتها وحقوق المستخدمين."
      : "How MLAMH collects, uses, protects, and manages personal data and user privacy rights.",
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
      ar: "من نحن ونطاق السياسة",
      en: "Who We Are and Scope",
      arText: [
        "توضح هذه السياسة كيفية تعامل ملامح (MLAMH) مع البيانات الشخصية عند استخدام الموقع والحسابات وملفات المواهب والفرص وخدمات الكاستينغ والدعم والخدمات المرتبطة بها.",
        "تعمل ملامح من المملكة العربية السعودية، ويمكن التواصل بخصوص الخصوصية والبيانات الشخصية عبر hello@mlamh.net أو من خلال مركز الدعم.",
      ],
      enText: [
        "This policy explains how MLAMH handles personal data when users access the website, accounts, talent profiles, opportunities, managed casting, support, and related services.",
        "MLAMH operates from Saudi Arabia. Privacy and personal-data inquiries may be sent to hello@mlamh.net or through the support center.",
      ],
    },
    {
      ar: "البيانات التي نجمعها",
      en: "Personal Data We Collect",
      arText: [
        "قد نجمع بيانات الحساب مثل الاسم والبريد الإلكتروني ورقم الجوال وطريقة تسجيل الدخول وحالة الحساب.",
        "بالنسبة للمواهب قد تشمل البيانات الاسم المهني، الصورة، المدينة، الجنسية، تاريخ الميلاد، الجنس، المعلومات المهنية، المهارات، الخبرات، القياسات، معرض الأعمال، وروابط مهنية يضيفها المستخدم.",
        "بالنسبة للجهات والناشرين قد تشمل البيانات اسم الجهة وبيانات التواصل والمعلومات المهنية والفرص وطلبات الكاستينغ التي يرسلونها.",
        "قد نجمع بيانات تقنية وتشغيلية مثل عنوان IP، نوع الجهاز والمتصفح، سجلات الدخول والاستخدام، بيانات الأمان، وأحداث المنصة اللازمة للتشغيل والحماية.",
        "عند توفر خدمات مدفوعة قد نعالج بيانات مرتبطة بالعملية مثل رقم العملية وحالتها ومبلغها، بينما تتم معالجة بيانات البطاقة الحساسة لدى مزود الدفع بحسب التكامل المستخدم ولا نطلب من المستخدم إرسالها إلى الدعم.",
      ],
      enText: [
        "We may collect account data such as name, email address, phone number, sign-in method, and account status.",
        "For talent, this may include professional name, photo, city, nationality, date of birth, gender, professional information, skills, experience, measurements, portfolio, and professional links submitted by the user.",
        "For organizations and publishers, this may include organization name, contact details, professional information, opportunities, and casting briefs they submit.",
        "We may collect technical and operational data such as IP address, device and browser information, sign-in and usage logs, security data, and platform events required to operate and protect the service.",
        "Where paid services are available, we may process transaction-related information such as transaction reference, status, and amount. Sensitive card data is handled by the applicable payment provider, and users should not send card details to support.",
      ],
    },
    {
      ar: "أغراض جمع واستخدام البيانات",
      en: "Purposes of Processing",
      arText: [
        "نستخدم البيانات لإنشاء الحسابات وإدارتها، التحقق من الوصول، تشغيل ملفات المواهب والجهات، نشر الفرص واستقبال الطلبات، وإتاحة التواصل والخصائص المرتبطة بالخدمة.",
        "نستخدم البيانات أيضًا لمراجعة الملفات والجهات والفرص، إدارة خدمة الكاستينغ، تقديم الدعم، إرسال إشعارات تشغيلية، منع الاحتيال وإساءة الاستخدام، تحسين الأمان والأداء، والامتثال للالتزامات النظامية.",
        "لا نستخدم البيانات في غرض جديد غير متوافق مع الغرض الذي جُمعت من أجله إلا وفق مسوغ نظامي مناسب وإشعار أو موافقة عندما تكون مطلوبة.",
      ],
      enText: [
        "We use personal data to create and manage accounts, authenticate access, operate talent and organization profiles, publish opportunities, receive applications, and enable service-related communication and features.",
        "We also use data to review profiles, organizations, and opportunities; operate managed casting; provide support; send operational notices; prevent fraud and misuse; improve security and performance; and comply with applicable legal obligations.",
        "We do not use personal data for a new purpose incompatible with the original collection purpose unless an appropriate legal basis, notice, or consent applies.",
      ],
    },
    {
      ar: "المسوغ النظامي والمعالجة بالموافقة",
      en: "Legal Basis and Consent",
      arText: [
        "تتم معالجة البيانات بحسب طبيعة النشاط وبالاستناد إلى المسوغ النظامي المناسب، مثل تنفيذ الخدمة أو العلاقة التعاقدية، موافقة المستخدم عندما تكون مطلوبة، الوفاء بالتزام نظامي، أو المصالح المشروعة المسموح بها نظامًا.",
        "عندما تعتمد المعالجة على الموافقة، يمكن للمستخدم العدول عنها وفق الأنظمة والضوابط المنطبقة، دون أن يؤثر ذلك على المعالجة التي تمت بشكل مشروع قبل العدول.",
      ],
      enText: [
        "Processing is based on the appropriate legal basis for the activity, which may include providing the requested service or contractual relationship, user consent where required, compliance with legal obligations, or permitted legitimate interests.",
        "Where processing relies on consent, users may withdraw that consent in accordance with applicable rules without affecting processing that was lawfully completed before withdrawal.",
      ],
    },
    {
      ar: "البيانات العامة والمحتوى الخاص بالمواهب",
      en: "Public and Restricted Talent Data",
      arText: [
        "قد تظهر بعض بيانات ملف الموهبة للعامة بحسب إعدادات النشر، مثل الاسم المهني والصورة والمدينة والمعلومات المهنية الأساسية.",
        "المحتوى والروابط الخاصة التي تحددها المنصة كبيانات مقيدة لا تُتاح للعامة، ويتم إظهارها فقط للفئات المخولة وفق قواعد الوصول المعتمدة، مثل صاحب الملف أو الإدارة أو جهة ناشرة مؤهلة بحسب الحالة.",
        "على المستخدم عدم رفع معلومات حساسة أو سرية إلى حقول مخصصة للعرض العام.",
      ],
      enText: [
        "Some talent-profile data may be visible publicly when the profile is published, such as professional name, photo, city, and basic professional information.",
        "Content and links classified by MLAMH as restricted are not made public and are only available to authorized roles under the platform's access rules, such as the profile owner, admins, or an eligible publisher where applicable.",
        "Users should not place sensitive or confidential information in fields intended for public display.",
      ],
    },
    {
      ar: "مشاركة البيانات ومزودو الخدمة",
      en: "Sharing and Service Providers",
      arText: [
        "لا نبيع البيانات الشخصية للمستخدمين.",
        "قد نشارك الحد اللازم من البيانات مع الطرف المرتبط بالخدمة، مثل إتاحة بيانات طلب التقديم للجهة الناشرة أو إدارة قائمة مرشحين في خدمة الكاستينغ.",
        "قد نستعين بمزودي خدمات للتخزين والاستضافة والمصادقة والبريد والإشعارات والتحليلات والمدفوعات والأمن، على أن تكون المعالجة في حدود الغرض المطلوب وبحسب الالتزامات النظامية والتعاقدية المنطبقة.",
        "قد نفصح عن البيانات إذا كان ذلك مطلوبًا بموجب نظام أو أمر أو طلب صالح من جهة مختصة.",
      ],
      enText: [
        "We do not sell users' personal data.",
        "We may share the minimum data needed with a party involved in the service, for example making application information available to the publisher or managing a candidate shortlist for a casting service.",
        "We may use providers for hosting, storage, authentication, email, notifications, analytics, payments, and security, with processing limited to the required purpose and subject to applicable legal and contractual safeguards.",
        "We may disclose data where required by law, court order, or a valid request from a competent authority.",
      ],
    },
    {
      ar: "المعالجة أو النقل خارج المملكة",
      en: "Processing or Transfer Outside Saudi Arabia",
      arText: [
        "قد تستخدم بعض الخدمات التقنية بنية تحتية أو مزودين خارج المملكة. عندما يترتب على ذلك نقل أو معالجة بيانات شخصية خارج المملكة، نتعامل معها وفق المتطلبات والضوابط المنطبقة على نقل البيانات الشخصية عبر الحدود.",
      ],
      enText: [
        "Some technology services may use infrastructure or providers outside Saudi Arabia. Where this results in cross-border transfer or processing of personal data, MLAMH handles the transfer in accordance with applicable Saudi cross-border data-transfer requirements.",
      ],
    },
    {
      ar: "الاحتفاظ بالبيانات وإتلافها",
      en: "Retention and Destruction",
      arText: [
        "نحتفظ بالبيانات للمدة اللازمة لتحقيق الغرض الذي جُمعت من أجله وتشغيل الحساب والخدمة، ثم نحذفها أو نتلفها أو نجعلها غير قابلة للتعريف عندما تنتهي الحاجة إليها، ما لم يتطلب النظام أو حماية الحقوق أو تسوية نزاع الاحتفاظ بها مدة أطول.",
        "تختلف مدة الاحتفاظ حسب نوع البيانات والحساب والسجل والغرض النظامي أو التشغيلي المرتبط به.",
      ],
      enText: [
        "We retain personal data for as long as necessary to fulfill the collection purpose and operate the account or service, then delete, destroy, or de-identify it when no longer needed unless a legal requirement, rights-protection need, or dispute requires longer retention.",
        "Retention periods vary by data type, account status, record type, and the relevant operational or legal purpose.",
      ],
    },
    {
      ar: "أمن البيانات ودقتها",
      en: "Security and Data Accuracy",
      arText: [
        "نتخذ إجراءات تقنية وتنظيمية معقولة لحماية البيانات من الوصول غير المصرح به أو الفقد أو التغيير أو إساءة الاستخدام.",
        "نعمل على إبقاء البيانات المرتبطة بالغرض دقيقة ومحدثة، ونوفر للمستخدم أدوات تحديث أو قنوات طلب التصحيح حيثما كان ذلك متاحًا.",
        "يتحمل المستخدم مسؤولية حماية وسيلة تسجيل الدخول وعدم مشاركة كلمة المرور أو رموز الدخول مع الآخرين.",
      ],
      enText: [
        "We use reasonable technical and organizational safeguards to protect personal data against unauthorized access, loss, alteration, or misuse.",
        "We take steps to keep data relevant to its purpose accurate and current and provide account-update tools or correction channels where available.",
        "Users are responsible for protecting their sign-in method and must not share passwords or access codes with others.",
      ],
    },
    {
      ar: "حقوق صاحب البيانات",
      en: "Data Subject Rights",
      arText: [
        "وفق نظام حماية البيانات الشخصية واللوائح المنطبقة، قد تشمل حقوق صاحب البيانات: العلم بمسوغ وغرض جمع البيانات، الوصول إلى بياناته، طلب نسخة مقروءة وواضحة منها، طلب تصحيحها أو إكمالها أو تحديثها، وطلب إتلاف ما انتهت الحاجة إليه وفق الضوابط والاستثناءات النظامية.",
        "يمكن تقديم طلب ممارسة الحقوق من خلال مركز الدعم أو hello@mlamh.net، وقد نتحقق من هوية مقدم الطلب قبل التنفيذ. تتم معالجة الطلبات وفق المدد والمتطلبات النظامية المنطبقة.",
      ],
      enText: [
        "Under Saudi Personal Data Protection Law and applicable regulations, data-subject rights may include the right to be informed of the legal basis and purpose of collection, access personal data, request a readable copy, request correction/completion/update, and request destruction when the data is no longer needed, subject to legal rules and exceptions.",
        "Rights requests may be submitted through the support center or hello@mlamh.net. We may verify the requester's identity before acting and process requests within applicable legal requirements and timelines.",
      ],
    },
    {
      ar: "الإشعارات والتسويق المباشر",
      en: "Notifications and Direct Marketing",
      arText: [
        "قد نرسل إشعارات ضرورية لتشغيل الحساب والخدمة، مثل التحقق والأمان وحالة الطلبات والمراجعات.",
        "إذا استخدمنا بيانات التواصل لتسويق مباشر يتطلب موافقة أو إمكانية إلغاء، فسيتم التعامل معه وفق المتطلبات النظامية وتوفير وسيلة مناسبة لإلغاء الاشتراك عندما تنطبق.",
      ],
      enText: [
        "We may send service-essential notices such as verification, security, application, and review-status messages.",
        "Where contact data is used for direct marketing that requires consent or an opt-out, MLAMH handles it under applicable requirements and provides an appropriate unsubscribe mechanism where required.",
      ],
    },
    {
      ar: "ملفات تعريف الارتباط والتقنيات المشابهة",
      en: "Cookies and Similar Technologies",
      arText: [
        "قد نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتشغيل الجلسات وتذكر التفضيلات وقياس الأداء وتحسين الأمان.",
        "يمكن للمستخدم التحكم في بعض هذه التقنيات من إعدادات المتصفح، وقد يؤثر تعطيل ملفات ضرورية على عمل تسجيل الدخول أو بعض وظائف المنصة.",
      ],
      enText: [
        "We may use cookies and similar technologies to operate sessions, remember preferences, measure performance, and improve security.",
        "Users may control some of these technologies through browser settings. Blocking essential cookies may affect sign-in or other platform functions.",
      ],
    },
    {
      ar: "القاصرون",
      en: "Minors",
      arText: [
        "إذا كان المستخدم دون السن أو الأهلية التي تتطلب موافقة ولي أو وصي نظامي، فيجب الحصول على الموافقة اللازمة قبل استخدام الخدمات أو تقديم البيانات بحسب الأنظمة المنطبقة.",
        "إذا تبين جمع بيانات قاصر بطريقة غير مسموح بها، نتخذ الإجراء المناسب لمعالجتها أو حذفها وفق المتطلبات النظامية.",
      ],
      enText: [
        "Where a user's age or legal capacity requires parental or guardian authorization, the required authorization must be obtained before using the service or submitting data under applicable law.",
        "If we learn that a minor's data was collected in a manner not permitted by law, we take appropriate steps to handle or delete it in accordance with applicable requirements.",
      ],
    },
    {
      ar: "تحديثات السياسة",
      en: "Policy Updates",
      arText: [
        "قد نحدث هذه السياسة عند تطوير الخدمة أو تغير المتطلبات التشغيلية أو النظامية. ننشر النسخة المحدثة في هذه الصفحة مع تاريخ آخر تحديث، ونقدم إشعارًا إضافيًا عندما يكون ذلك مطلوبًا نظامًا أو عندما يكون التغيير جوهريًا بحسب الحالة.",
      ],
      enText: [
        "We may update this policy as services or operational or legal requirements change. The updated version and date will be published here, with additional notice where legally required or appropriate for material changes.",
      ],
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-xs text-gold">{isRtl ? "قانوني وخصوصية" : "Legal & Privacy"}</p>
          <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
            {isRtl ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
            {isRtl
              ? "توضح هذه السياسة ما نجمعه من بيانات شخصية، ولماذا نستخدمها، وكيف نحميها، والحقوق المتاحة للمستخدمين."
              : "This policy explains what personal data we collect, why we use it, how we protect it, and the rights available to users."}
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
          <h2 className="text-xl font-light">{isRtl ? "طلبات الخصوصية والبيانات" : "Privacy and Data Requests"}</h2>
          <p className="mt-3 text-sm leading-7 text-white/50">
            {isRtl
              ? "استخدم مركز الدعم لطلب الوصول أو التصحيح أو الحذف أو لأي استفسار متعلق ببياناتك الشخصية."
              : "Use the support center for access, correction, deletion, or other personal-data inquiries."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/${locale}/contact`} className="rounded-xl bg-gold px-5 py-3 text-sm font-medium text-black">
              {isRtl ? "فتح طلب خصوصية" : "Open privacy request"}
            </Link>
            <a href="mailto:hello@mlamh.net" className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gold">hello@mlamh.net</a>
          </div>
        </section>
      </div>
    </main>
  );
}
