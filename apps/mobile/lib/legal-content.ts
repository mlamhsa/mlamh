export type LegalDocumentKey = "privacy" | "terms" | "refund";

export type LegalSection = {
  arTitle: string;
  enTitle: string;
  ar: string[];
  en: string[];
};

export type LegalDocumentContent = {
  arTitle: string;
  enTitle: string;
  lastUpdatedAr: string;
  lastUpdatedEn: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENT_KEYS: LegalDocumentKey[] = ["privacy", "terms", "refund"];

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocumentContent> = {
  privacy: {
    arTitle: "سياسة الخصوصية",
    enTitle: "Privacy Policy",
    lastUpdatedAr: "آخر تحديث: يوليو 2026",
    lastUpdatedEn: "Last updated: July 2026",
    sections: [
      {
        arTitle: "مقدمة",
        enTitle: "Introduction",
        ar: [
          "تحترم منصة ملامح خصوصية المستخدمين، وتلتزم بالتعامل مع المعلومات الشخصية بمسؤولية وشفافية.",
          "توضح هذه السياسة أنواع المعلومات التي قد نجمعها، وكيفية استخدامها وحمايتها، والخيارات المتاحة للمستخدم بشأن بياناته.",
        ],
        en: [
          "MLAMH respects the privacy of its users and is committed to handling personal information responsibly and transparently.",
          "This policy explains the information we may collect, how it is used and protected, and the choices available to users regarding their data.",
        ],
      },
      {
        arTitle: "المعلومات التي نجمعها",
        enTitle: "Information We Collect",
        ar: [
          "قد نجمع المعلومات التي يقدمها المستخدم مباشرة عند إنشاء الحساب أو تحديث الملف الشخصي أو نشر فرصة أو التقديم عليها.",
          "قد تشمل هذه المعلومات الاسم، البريد الإلكتروني، رقم التواصل، المدينة، المعلومات المهنية، الصور، السيرة الذاتية، نماذج الأعمال، وبيانات الشركة أو الجهة.",
          "قد نجمع أيضًا معلومات تقنية أساسية مثل نوع الجهاز والمتصفح وعنوان بروتوكول الإنترنت وسجلات استخدام المنصة، عند توفرها.",
        ],
        en: [
          "We may collect information provided directly when a user creates an account, updates a profile, publishes an opportunity, or submits an application.",
          "This may include a name, email address, contact number, city, professional information, photographs, résumé, portfolio items, and company or organization details.",
          "We may also collect basic technical information, such as device type, browser, IP address, and platform usage records, when available.",
        ],
      },
      {
        arTitle: "كيفية استخدام المعلومات",
        enTitle: "How We Use Information",
        ar: [
          "نستخدم المعلومات لتشغيل المنصة وتقديم خدماتها، وإنشاء الحسابات وإدارتها، وعرض الملفات الشخصية والفرص، ومعالجة طلبات التقديم.",
          "قد نستخدمها أيضًا لتحسين تجربة المستخدم، وإرسال الإشعارات المتعلقة بالحساب أو الطلبات، والرد على الاستفسارات وطلبات الدعم.",
          "قد نستخدم البيانات لمنع إساءة الاستخدام، وتعزيز الأمان، والالتزام بالمتطلبات النظامية عند انطباقها.",
        ],
        en: [
          "We use information to operate the platform, provide its services, create and manage accounts, display profiles and opportunities, and process applications.",
          "We may also use it to improve the user experience, send account or application notifications, and respond to inquiries and support requests.",
          "Information may be used to prevent misuse, improve security, and comply with applicable legal requirements.",
        ],
      },
      {
        arTitle: "ظهور المعلومات للمستخدمين الآخرين",
        enTitle: "Information Visible to Other Users",
        ar: [
          "قد تكون بعض معلومات الملف الشخصي للمواهب ظاهرة للشركات أو للمستخدمين الآخرين بحسب إعدادات المنصة وطبيعة الخدمة.",
          "قد تتضمن المعلومات الظاهرة الاسم المهني، الصورة، المدينة، المهارات، الخبرات، ونماذج الأعمال التي يختار المستخدم إضافتها.",
          "تظهر معلومات الفرص المنشورة للمستخدمين المؤهلين للاطلاع عليها والتقديم عليها.",
        ],
        en: [
          "Some talent profile information may be visible to companies or other users, depending on platform settings and the nature of the service.",
          "Visible information may include a professional name, photograph, city, skills, experience, and portfolio items selected by the user.",
          "Published opportunity information may be visible to users who are eligible to view and apply for it.",
        ],
      },
      {
        arTitle: "مشاركة المعلومات",
        enTitle: "Sharing Information",
        ar: [
          "لا نبيع المعلومات الشخصية للمستخدمين.",
          "قد تتم مشاركة المعلومات بالقدر اللازم لتقديم وظائف المنصة، مثل مشاركة بيانات المتقدم مع الجهة التي نشرَت الفرصة.",
          "قد نستعين بمزودي خدمات تقنيين للمساعدة في الاستضافة، التخزين، المصادقة، الإشعارات، التحليلات، أو حماية المنصة.",
          "قد نفصح عن المعلومات عند وجود التزام نظامي أو طلب رسمي صالح من جهة مختصة.",
        ],
        en: [
          "We do not sell users’ personal information.",
          "Information may be shared when necessary to provide platform features, such as sharing applicant information with the organization that published an opportunity.",
          "We may use technical service providers for hosting, storage, authentication, notifications, analytics, or platform security.",
          "Information may be disclosed where required by applicable law or a valid request from a competent authority.",
        ],
      },
      {
        arTitle: "حماية البيانات",
        enTitle: "Data Protection",
        ar: [
          "نتخذ إجراءات تقنية وتنظيمية معقولة للمساعدة في حماية المعلومات من الوصول غير المصرح به أو الفقد أو التعديل أو إساءة الاستخدام.",
          "ومع ذلك، لا توجد وسيلة إلكترونية تضمن الأمان الكامل، لذلك يتحمل المستخدم مسؤولية حماية بيانات تسجيل الدخول وعدم مشاركتها مع الآخرين.",
        ],
        en: [
          "We take reasonable technical and organizational measures to help protect information against unauthorized access, loss, alteration, or misuse.",
          "However, no electronic method can guarantee complete security. Users are responsible for protecting their login credentials and not sharing them with others.",
        ],
      },
      {
        arTitle: "الاحتفاظ بالمعلومات",
        enTitle: "Data Retention",
        ar: [
          "نحتفظ بالمعلومات للمدة اللازمة لتقديم خدمات المنصة، وإدارة الحساب، وتنفيذ الأغراض الموضحة في هذه السياسة.",
          "قد نحتفظ ببعض البيانات لمدة إضافية عندما يكون ذلك ضروريًا للالتزام بالمتطلبات النظامية، أو تسوية النزاعات، أو حماية حقوق المنصة والمستخدمين.",
        ],
        en: [
          "We retain information for as long as necessary to provide platform services, manage accounts, and fulfill the purposes described in this policy.",
          "Certain information may be retained for an additional period where necessary to comply with legal requirements, resolve disputes, or protect the rights of the platform and its users.",
        ],
      },
      {
        arTitle: "حقوق المستخدم",
        enTitle: "User Rights",
        ar: [
          "يمكن للمستخدم مراجعة بعض بياناته أو تحديثها من خلال إعدادات الحساب عند توفر هذه الخاصية.",
          "يمكن للمستخدم التواصل معنا لطلب تصحيح معلوماته أو حذف حسابه وبياناته، مع مراعاة أي التزامات نظامية أو حالات تتطلب الاحتفاظ ببعض السجلات.",
          "قد نطلب التحقق من هوية مقدم الطلب قبل تنفيذ الطلب لحماية خصوصية المستخدم.",
        ],
        en: [
          "Users may review or update certain information through their account settings where this feature is available.",
          "Users may contact us to request correction of their information or deletion of their account and data, subject to legal obligations or circumstances requiring certain records to be retained.",
          "We may request identity verification before completing a request to protect user privacy.",
        ],
      },
      {
        arTitle: "ملفات تعريف الارتباط",
        enTitle: "Cookies",
        ar: [
          "قد تستخدم المنصة ملفات تعريف الارتباط أو تقنيات مشابهة لتشغيل الجلسات، وتذكر التفضيلات، وتحسين الأداء والأمان.",
          "يمكن للمستخدم التحكم في بعض هذه التقنيات من خلال إعدادات المتصفح، وقد يؤدي تعطيلها إلى التأثير في بعض وظائف المنصة.",
        ],
        en: [
          "The platform may use cookies or similar technologies to operate sessions, remember preferences, and improve performance and security.",
          "Users may control some of these technologies through browser settings, although disabling them may affect certain platform features.",
        ],
      },
      {
        arTitle: "خصوصية القاصرين",
        enTitle: "Children’s Privacy",
        ar: [
          "لا تستهدف المنصة الأطفال الذين تقل أعمارهم عن السن المسموح به نظاميًا لاستخدام هذه الخدمات دون موافقة ولي الأمر.",
          "إذا تبين لنا جمع معلومات من قاصر بطريقة غير مسموحة، فسنتخذ الإجراءات المناسبة لحذفها أو معالجتها وفق المتطلبات المنطبقة.",
        ],
        en: [
          "The platform is not intended for children below the legally permitted age to use these services without parental or guardian consent.",
          "If we learn that information has been collected from a minor in an unauthorized manner, we will take appropriate steps to delete or otherwise handle it in accordance with applicable requirements.",
        ],
      },
      {
        arTitle: "الخدمات والروابط الخارجية",
        enTitle: "External Services and Links",
        ar: [
          "قد تحتوي المنصة على روابط لخدمات أو مواقع خارجية لا تديرها ملامح.",
          "لا تتحمل ملامح مسؤولية ممارسات الخصوصية أو المحتوى الخاص بتلك الخدمات، ويُنصح المستخدم بمراجعة سياساتها بشكل مستقل.",
        ],
        en: [
          "The platform may contain links to external websites or services that are not operated by MLAMH.",
          "MLAMH is not responsible for the privacy practices or content of those services, and users should review their policies separately.",
        ],
      },
      {
        arTitle: "تحديث سياسة الخصوصية",
        enTitle: "Updates to This Policy",
        ar: [
          "قد نقوم بتحديث سياسة الخصوصية عند تطوير خدمات المنصة أو تغير المتطلبات التشغيلية أو النظامية.",
          "سيتم نشر النسخة المحدثة في هذه الصفحة، ويُعد استمرار استخدام المنصة بعد نشر التحديث قبولًا بالسياسة المحدثة بالقدر الذي يسمح به النظام.",
        ],
        en: [
          "We may update this privacy policy as platform services develop or operational and legal requirements change.",
          "The updated version will be published on this page. Continued use of the platform after publication constitutes acceptance of the updated policy to the extent permitted by law.",
        ],
      },
      {
        arTitle: "التواصل معنا",
        enTitle: "Contact Us",
        ar: ["للاستفسارات أو الطلبات المتعلقة بالخصوصية والبيانات الشخصية، يمكن التواصل معنا عبر البريد الإلكتروني: support@mlamh.com."],
        en: ["For questions or requests relating to privacy and personal information, contact us at support@mlamh.com."],
      },
    ],
  },
  terms: {
    arTitle: "الشروط والأحكام",
    enTitle: "Terms and Conditions",
    lastUpdatedAr: "آخر تحديث: يوليو 2026",
    lastUpdatedEn: "Last updated: July 2026",
    sections: [
      {
        arTitle: "مقدمة", enTitle: "Introduction",
        ar: ["تنظم هذه الشروط والأحكام استخدام منصة ملامح والخدمات والخصائص المتاحة من خلالها.", "يعد دخول المستخدم إلى المنصة أو إنشاء حساب أو استخدام أي من خدماتها موافقة على الالتزام بهذه الشروط.", "إذا لم يوافق المستخدم على هذه الشروط، فيجب عليه التوقف عن استخدام المنصة."],
        en: ["These terms and conditions govern the use of the MLAMH platform and the services and features available through it.", "By accessing the platform, creating an account, or using any of its services, the user agrees to be bound by these terms.", "If the user does not agree to these terms, they must stop using the platform."],
      },
      {
        arTitle: "التعريفات", enTitle: "Definitions",
        ar: ["تشير كلمة «ملامح» أو «المنصة» إلى الموقع والخدمات الرقمية التابعة لملامح.", "يشير «المستخدم» إلى كل شخص أو جهة تستخدم المنصة، بما في ذلك المواهب والشركات والوكالات وجهات الإنتاج.", "تشير «الموهبة» إلى المستخدم الذي ينشئ ملفًا مهنيًا أو يتقدم إلى الفرص.", "تشير «الجهة الناشرة» إلى الشركة أو الوكالة أو جهة الإنتاج أو أي جهة تنشر فرصة عبر المنصة.", "تشير «الفرصة» إلى أي إعلان مهني أو مشروع أو عمل أو طلب مواهب يتم نشره عبر المنصة."],
        en: ["“MLAMH” or “the platform” refers to the website and digital services operated under the MLAMH name.", "“User” means any individual or organization using the platform, including talent, companies, agencies, and production entities.", "“Talent” means a user who creates a professional profile or applies for opportunities.", "“Publisher” means a company, agency, production entity, or other organization that publishes an opportunity through the platform.", "“Opportunity” means any professional listing, project, work request, or talent requirement published through the platform."],
      },
      {
        arTitle: "الأهلية لاستخدام المنصة", enTitle: "Eligibility",
        ar: ["يجب أن يكون المستخدم مؤهلًا نظاميًا لاستخدام المنصة وإبرام الالتزامات الناتجة عن استخدامها.", "إذا كان المستخدم دون السن النظامية المسموح بها، فيجب أن يتم استخدام المنصة بموافقة ولي الأمر أو الوصي النظامي عند الحاجة.", "يحق لملامح رفض إنشاء حساب أو تعليق استخدامه إذا تبين عدم استيفاء متطلبات الأهلية."],
        en: ["Users must be legally eligible to use the platform and enter into obligations arising from its use.", "If a user is below the legally permitted age, use of the platform must be authorized by a parent or legal guardian where required.", "MLAMH may refuse account creation or suspend access where eligibility requirements are not met."],
      },
      {
        arTitle: "إنشاء الحساب", enTitle: "Account Registration",
        ar: ["يلتزم المستخدم بتقديم معلومات صحيحة وكاملة ومحدثة عند إنشاء الحساب أو تحديثه.", "يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات تسجيل الدخول وجميع الأنشطة التي تتم من خلال حسابه.", "يجب إبلاغ ملامح فورًا عند الاشتباه في استخدام غير مصرح به للحساب.", "لا يجوز إنشاء حساب باستخدام بيانات شخص أو جهة أخرى دون تفويض صحيح."],
        en: ["Users must provide accurate, complete, and current information when creating or updating an account.", "Users are responsible for maintaining the confidentiality of their login credentials and for all activity carried out through their account.", "MLAMH must be notified promptly if unauthorized account use is suspected.", "Users may not create an account using another person’s or organization’s information without proper authorization."],
      },
      {
        arTitle: "استخدام المنصة", enTitle: "Use of the Platform",
        ar: ["يجب استخدام المنصة لأغراض مشروعة ومهنية ومتوافقة مع هذه الشروط.", "لا يجوز استخدام المنصة للإساءة إلى الآخرين أو انتحال الهوية أو نشر محتوى مضلل أو احتيالي أو غير قانوني.", "لا يجوز محاولة اختراق المنصة أو تعطيلها أو الوصول غير المصرح به إلى حسابات أو بيانات أو أنظمة أخرى.", "لا يجوز استخدام أدوات آلية لجمع البيانات أو نسخ المحتوى أو إساءة استخدام وظائف المنصة دون إذن مكتوب."],
        en: ["The platform must be used for lawful and professional purposes consistent with these terms.", "Users may not harass others, impersonate another person, or publish misleading, fraudulent, or unlawful content.", "Users may not attempt to compromise, disrupt, or gain unauthorized access to the platform, accounts, data, or other systems.", "Automated tools may not be used to collect data, copy content, or misuse platform features without written permission."],
      },
      {
        arTitle: "ملفات المواهب", enTitle: "Talent Profiles",
        ar: ["تتحمل الموهبة مسؤولية صحة المعلومات والمهارات والخبرات والصور ونماذج الأعمال التي تضيفها إلى ملفها.", "يجب أن تمتلك الموهبة الحقوق اللازمة لاستخدام ونشر أي محتوى تضيفه إلى المنصة.", "لا تضمن ملامح صحة جميع المعلومات الواردة في الملفات الشخصية، وعلى الجهات الناشرة التحقق من المعلومات قبل اتخاذ أي قرار.", "يحق لملامح إزالة أي محتوى مخالف أو مضلل أو غير مناسب أو ينتهك حقوق الآخرين."],
        en: ["Talent users are responsible for the accuracy of the information, skills, experience, images, and portfolio materials added to their profiles.", "Talent users must hold the necessary rights to use and publish any content uploaded to the platform.", "MLAMH does not guarantee the accuracy of all profile information, and publishers should verify information before making decisions.", "MLAMH may remove content that is misleading, inappropriate, unlawful, or infringes the rights of others."],
      },
      {
        arTitle: "نشر الفرص", enTitle: "Publishing Opportunities",
        ar: ["تتحمل الجهة الناشرة مسؤولية صحة تفاصيل الفرصة ومتطلباتها ومواعيدها وموقعها وأي معلومات مالية أو تعاقدية مرتبطة بها.", "يجب أن تكون الفرص المنشورة مشروعة وحقيقية وواضحة، وألا تتضمن تضليلًا أو تمييزًا غير مشروع أو إساءة استخدام للمواهب.", "لا يجوز نشر فرص وهمية أو استخدام المنصة لجمع البيانات دون وجود غرض مهني مشروع.", "يحق لملامح مراجعة الفرص أو تعليقها أو حذفها إذا خالفت هذه الشروط أو الأنظمة المعمول بها."],
        en: ["Publishers are responsible for the accuracy of opportunity details, requirements, deadlines, location, and any financial or contractual information.", "Published opportunities must be lawful, genuine, and clear, and must not contain deception, unlawful discrimination, or misuse of talent.", "Fake opportunities or listings intended only to collect data without a legitimate professional purpose are prohibited.", "MLAMH may review, suspend, or remove opportunities that violate these terms or applicable laws."],
      },
      {
        arTitle: "طلبات التقديم", enTitle: "Applications",
        ar: ["تتيح المنصة للمواهب التقديم على الفرص، وتتيح للجهات الناشرة مراجعة الطلبات وإدارتها.", "لا تضمن ملامح قبول أي طلب أو حصول أي مستخدم على فرصة أو عقد أو مقابل مالي.", "تتحمل الموهبة والجهة الناشرة مسؤولية أي تواصل أو تفاوض أو اتفاق يتم بينهما.", "يجوز للجهة الناشرة قبول الطلب أو رفضه أو إغلاق الفرصة وفق احتياجها، مع الالتزام بالأنظمة والمتطلبات المنطبقة."],
        en: ["The platform enables talent to apply for opportunities and allows publishers to review and manage applications.", "MLAMH does not guarantee that any application will be accepted or that any user will receive an opportunity, contract, or payment.", "Talent and publishers are responsible for any communication, negotiation, or agreement entered into between them.", "Publishers may accept or reject applications or close opportunities according to their needs, subject to applicable laws and requirements."],
      },
      {
        arTitle: "العلاقات والاتفاقات بين المستخدمين", enTitle: "Agreements Between Users",
        ar: ["تعمل ملامح كمنصة تقنية لتسهيل الوصول والتواصل بين المواهب والجهات الناشرة.", "لا تعد ملامح طرفًا في أي عقد أو اتفاق يتم بين المستخدمين، ما لم يتم النص على خلاف ذلك بشكل صريح.", "يتحمل المستخدمون مسؤولية التحقق من الهوية والخبرة والأهلية والشروط المالية والتنفيذية قبل إبرام أي اتفاق.", "أي نزاع ينشأ بين المستخدمين يتم التعامل معه بينهم مباشرة، مع احتفاظ ملامح بحق التعاون عند وجود طلب نظامي صحيح."],
        en: ["MLAMH operates as a technical platform that facilitates discovery and communication between talent and publishers.", "MLAMH is not a party to contracts or agreements between users unless expressly stated otherwise.", "Users are responsible for verifying identity, experience, eligibility, financial terms, and performance requirements before entering into an agreement.", "Disputes between users must be handled directly between them, while MLAMH may cooperate where a valid legal request exists."],
      },
      {
        arTitle: "الرسوم والمدفوعات", enTitle: "Fees and Payments",
        ar: ["قد تكون بعض خدمات المنصة مجانية، وقد تخضع خدمات أخرى لرسوم أو اشتراكات يتم توضيحها قبل استخدامها.", "عند تطبيق رسوم، يلتزم المستخدم بسداد المبالغ وفق الأسعار والشروط المعروضة وقت الشراء أو الاشتراك.", "ما لم يُذكر خلاف ذلك، فإن المبالغ المدفوعة لا تكون قابلة للاسترداد بعد تقديم الخدمة أو بدء فترة الاشتراك، مع مراعاة الحقوق النظامية للمستخدم.", "لا تتحمل ملامح مسؤولية المدفوعات التي تتم مباشرة بين المواهب والجهات الناشرة خارج خدمات الدفع الرسمية للمنصة."],
        en: ["Some platform services may be free, while others may be subject to fees or subscriptions disclosed before use.", "Where fees apply, users must pay the amounts according to the prices and terms displayed at the time of purchase or subscription.", "Unless otherwise stated, payments are non-refundable after a service has been provided or a subscription period has started, subject to users’ statutory rights.", "MLAMH is not responsible for payments made directly between talent and publishers outside the platform’s official payment services."],
      },
      {
        arTitle: "المحتوى وحقوق الملكية الفكرية", enTitle: "Content and Intellectual Property",
        ar: ["تظل ملكية المحتوى الذي يرفعه المستخدم عائدة إليه أو إلى مالكه النظامي.", "يمنح المستخدم ملامح ترخيصًا غير حصري لعرض المحتوى وتخزينه ومعالجته بالقدر اللازم لتشغيل المنصة وتقديم خدماتها.", "تعود حقوق تصميم المنصة وشعارها وواجهاتها وبرمجياتها ومحتواها الأصلي إلى ملامح أو إلى أصحاب التراخيص المعنيين.", "لا يجوز نسخ أو إعادة نشر أو استغلال أي جزء من المنصة تجاريًا دون إذن مكتوب."],
        en: ["Ownership of content uploaded by a user remains with that user or its lawful owner.", "The user grants MLAMH a non-exclusive license to display, store, and process the content to the extent necessary to operate the platform and provide its services.", "Rights in the platform design, logo, interfaces, software, and original content belong to MLAMH or the relevant licensors.", "No part of the platform may be copied, republished, or commercially exploited without written permission."],
      },
      {
        arTitle: "الخصوصية والبيانات", enTitle: "Privacy and Data",
        ar: ["تخضع معالجة المعلومات الشخصية لسياسة الخصوصية المنشورة على المنصة.", "يقر المستخدم بأن بعض معلوماته قد تظهر للمستخدمين الآخرين بحسب نوع الحساب وطبيعة الخدمة.", "ينبغي للمستخدم مراجعة سياسة الخصوصية لفهم كيفية جمع البيانات واستخدامها والاحتفاظ بها."],
        en: ["The handling of personal information is governed by the privacy policy published on the platform.", "Users acknowledge that certain information may be visible to other users depending on account type and the nature of the service.", "Users should review the privacy policy to understand how information is collected, used, and retained."],
      },
      {
        arTitle: "التعليق وإنهاء الحساب", enTitle: "Suspension and Termination",
        ar: ["يجوز للمستخدم التوقف عن استخدام المنصة أو طلب حذف حسابه وفق الوسائل المتاحة.", "يحق لملامح تعليق الحساب أو تقييد الوصول أو إنهائه عند مخالفة هذه الشروط أو إساءة استخدام المنصة أو وجود مخاطر أمنية أو نظامية.", "قد يتم حذف المحتوى المرتبط بالحساب أو الاحتفاظ ببعض السجلات عند الحاجة للوفاء بالتزامات نظامية أو حماية حقوق المنصة والمستخدمين."],
        en: ["Users may stop using the platform or request account deletion through the available methods.", "MLAMH may suspend, restrict, or terminate an account where these terms are violated, the platform is misused, or security or legal risks exist.", "Account-related content may be deleted, while certain records may be retained where necessary to meet legal obligations or protect the rights of the platform and its users."],
      },
      {
        arTitle: "إخلاء المسؤولية", enTitle: "Disclaimer",
        ar: ["تُقدم المنصة وخدماتها بالحالة المتاحة، وقد تتعرض للتوقف المؤقت أو الأخطاء أو أعمال الصيانة.", "لا تضمن ملامح استمرار توفر جميع الخدمات دون انقطاع أو خلوها الكامل من الأخطاء.", "لا تضمن ملامح صحة أو جودة أو ملاءمة المحتوى أو الفرص أو الملفات التي ينشرها المستخدمون.", "يتحمل المستخدم مسؤولية قراراته المهنية والتعاقدية والمالية الناتجة عن استخدام المنصة."],
        en: ["The platform and its services are provided on an available basis and may experience temporary interruptions, errors, or maintenance.", "MLAMH does not guarantee uninterrupted availability or that all services will be entirely error-free.", "MLAMH does not guarantee the accuracy, quality, or suitability of content, opportunities, or profiles published by users.", "Users are responsible for professional, contractual, and financial decisions arising from use of the platform."],
      },
      {
        arTitle: "حدود المسؤولية", enTitle: "Limitation of Liability",
        ar: ["بالقدر الذي يسمح به النظام، لا تتحمل ملامح المسؤولية عن الأضرار غير المباشرة أو فقد الأرباح أو الفرص أو البيانات الناتجة عن استخدام المنصة أو تعذر استخدامها.", "لا تتحمل ملامح مسؤولية تصرفات المستخدمين أو إخلالهم بالاتفاقات أو عدم تنفيذهم للالتزامات المتفق عليها بينهم.", "لا يؤثر هذا البند في أي مسؤولية لا يجوز استبعادها أو تقييدها بموجب الأنظمة المنطبقة."],
        en: ["To the extent permitted by law, MLAMH is not liable for indirect damages or loss of profits, opportunities, or data arising from use of or inability to use the platform.", "MLAMH is not responsible for user conduct, breaches of agreements, or failure to perform obligations agreed between users.", "Nothing in this section excludes or limits liability that cannot lawfully be excluded or limited."],
      },
      {
        arTitle: "التعويض", enTitle: "Indemnity",
        ar: ["يتحمل المستخدم المسؤولية عن الأضرار والمطالبات الناتجة عن مخالفته لهذه الشروط أو الأنظمة أو حقوق الآخرين.", "يجوز لملامح مطالبة المستخدم بالتعويض عن الخسائر أو المصروفات المعقولة الناتجة مباشرة عن مخالفته، بالقدر الذي يسمح به النظام."],
        en: ["Users are responsible for damages and claims arising from their violation of these terms, applicable laws, or the rights of others.", "MLAMH may seek compensation for reasonable losses or expenses directly resulting from a user’s violation, to the extent permitted by law."],
      },
      {
        arTitle: "التعديلات على المنصة", enTitle: "Platform Changes",
        ar: ["يحق لملامح تطوير المنصة أو تعديل خصائصها أو إضافة خدمات أو إيقاف بعضها بصورة مؤقتة أو دائمة.", "قد تتغير بعض الوظائف أو المتطلبات أو حدود الاستخدام مع تطور المنصة.", "سنسعى إلى إشعار المستخدمين بالتغييرات الجوهرية متى كان ذلك مناسبًا وممكنًا."],
        en: ["MLAMH may develop the platform, modify its features, add services, or temporarily or permanently discontinue certain services.", "Functions, requirements, or usage limits may change as the platform develops.", "We will seek to notify users of material changes where appropriate and reasonably possible."],
      },
      {
        arTitle: "تعديل الشروط", enTitle: "Changes to These Terms",
        ar: ["يجوز تحديث هذه الشروط لتتوافق مع تطوير الخدمات أو تغير المتطلبات التشغيلية أو النظامية.", "سيتم نشر النسخة المحدثة على هذه الصفحة مع توضيح تاريخ آخر تحديث.", "يعد استمرار استخدام المنصة بعد نشر التعديلات قبولًا بالشروط المحدثة بالقدر الذي يسمح به النظام."],
        en: ["These terms may be updated to reflect service development or changes in operational or legal requirements.", "The updated version will be published on this page together with the latest revision date.", "Continued use of the platform after publication constitutes acceptance of the updated terms to the extent permitted by law."],
      },
      {
        arTitle: "الأنظمة والاختصاص", enTitle: "Governing Law and Jurisdiction",
        ar: ["تخضع هذه الشروط للأنظمة المعمول بها في المملكة العربية السعودية.", "تتم محاولة تسوية أي نزاع بصورة ودية أولًا، وإذا تعذر ذلك فيحال النزاع إلى الجهة القضائية المختصة في المملكة العربية السعودية."],
        en: ["These terms are governed by the applicable laws of the Kingdom of Saudi Arabia.", "Any dispute should first be addressed through an amicable resolution. If this is not possible, the dispute will be referred to the competent judicial authority in the Kingdom of Saudi Arabia."],
      },
      {
        arTitle: "التواصل معنا", enTitle: "Contact Us",
        ar: ["للاستفسارات المتعلقة بهذه الشروط والأحكام، يمكن التواصل معنا عبر البريد الإلكتروني: support@mlamh.com."],
        en: ["For questions relating to these terms and conditions, contact us at support@mlamh.com."],
      },
    ],
  },
  refund: {
    arTitle: "سياسة الاسترجاع والاسترداد",
    enTitle: "Refund & Cancellation Policy",
    lastUpdatedAr: "السياسة المعتمدة داخل ملامح",
    lastUpdatedEn: "Authoritative MLAMH policy",
    sections: [
      {
        arTitle: "نطاق السياسة", enTitle: "Scope",
        ar: ["تنظم هذه السياسة طلبات الإلغاء والاسترداد المتعلقة بالخدمات والميزات المدفوعة المقدمة عبر منصة ملامح.", "تنطبق هذه السياسة مع مراعاة الحقوق المقررة للمستخدم بموجب الأنظمة واللوائح المعمول بها في المملكة العربية السعودية، ولا تهدف إلى تقييد أي حق نظامي لا يجوز الاتفاق على مخالفته."],
        en: ["This policy governs cancellation and refund requests relating to paid services and features provided through MLAMH.", "This policy applies subject to mandatory rights available under the laws and regulations of the Kingdom of Saudi Arabia."],
      },
      {
        arTitle: "الخدمات المجانية", enTitle: "Free Services",
        ar: ["لا يترتب على استخدام الخدمات المجانية في ملامح أي مبالغ قابلة للاسترداد.", "يشمل ذلك إنشاء الحساب، وتصفح المحتوى أو الفرص أو الملفات المتاحة مجانًا، وأي خدمة تقدمها المنصة دون مقابل مالي."],
        en: ["No refund applies to services provided free of charge."],
      },
      {
        arTitle: "الخدمات والميزات المدفوعة", enTitle: "Paid Services and Features",
        ar: ["قد توفر ملامح خدمات أو ميزات مدفوعة، مثل إبراز الفرص، إبراز الملفات، الاشتراكات، الباقات، أو خدمات رقمية إضافية.", "يتم توضيح السعر والمدة وأهم خصائص الخدمة قبل إتمام عملية الدفع.", "تخضع أهلية الاسترداد لطبيعة الخدمة، وما إذا كان تنفيذها قد بدأ أو تم الانتفاع بها، إضافة إلى الحقوق المقررة بموجب الأنظمة المعمول بها."],
        en: ["MLAMH may offer paid services including promoted opportunities, promoted profiles, subscriptions, packages, or other digital features.", "Pricing, duration, and key service details will be presented before payment."],
      },
      {
        arTitle: "طلب الاسترداد قبل الاستفادة من الخدمة", enTitle: "Refund Before Use",
        ar: ["يجوز للمستخدم تقديم طلب لاسترداد المبلغ المدفوع إذا لم يبدأ تنفيذ الخدمة ولم يتم الانتفاع بها، وذلك وفقًا لهذه السياسة والأنظمة المعمول بها.", "يتم تقييم الطلب بناءً على حالة العملية والخدمة وتاريخ الدفع وأي استخدام فعلي للميزة المدفوعة."],
        en: ["Users may request a refund where a paid service has not yet been performed or used, subject to this policy and applicable law."],
      },
      {
        arTitle: "بعد بدء تنفيذ الخدمة", enTitle: "Services Already Activated",
        ar: ["إذا بدأ تنفيذ الخدمة الرقمية أو تم تفعيلها أو الاستفادة منها، فقد يؤثر ذلك في أهلية الاسترداد وفقًا لطبيعة الخدمة والأنظمة المطبقة.", "من أمثلة ذلك بدء إبراز فرصة أو ملف، تفعيل باقة، تنفيذ خدمة ترويجية، أو استخدام رصيد أو ميزة مدفوعة.", "لن تؤثر هذه الأحكام على أي حق إلزامي للمستخدم تقرره الأنظمة المعمول بها."],
        en: ["Once a digital service has been activated, performed, or used, refund eligibility may be affected depending on the nature of the service and applicable law.", "Nothing in this policy limits mandatory consumer rights."],
      },
      {
        arTitle: "المدفوعات المكررة أو غير الصحيحة", enTitle: "Duplicate or Incorrect Charges",
        ar: ["إذا تم خصم مبلغ مكرر للمعاملة نفسها بسبب خطأ تقني مثبت، يحق للمستخدم طلب مراجعة العملية واسترداد المبلغ المكرر عند التحقق منه.", "قد نطلب رقم العملية أو إثبات الدفع أو بيانات أخرى لازمة للتحقق من المعاملة."],
        en: ["Verified duplicate charges caused by a technical error may be refunded following review."],
      },
      {
        arTitle: "الخدمات التي لم يتم تنفيذها", enTitle: "Services Not Delivered",
        ar: ["إذا تعذر على ملامح تقديم خدمة مدفوعة تم شراؤها بسبب خطأ من المنصة، فسنقوم بمعالجة الحالة وفقًا لطبيعتها، وقد يشمل ذلك إعادة تنفيذ الخدمة أو إعادة المبلغ المستحق.", "كما تظل الحقوق المتعلقة بالتأخر أو عدم تنفيذ الخدمة خاضعة للأنظمة المعمول بها."],
        en: ["Where MLAMH is unable to provide a purchased service due to an error attributable to the platform, MLAMH may reperform the service or issue the applicable refund."],
      },
      {
        arTitle: "الفرص والكاستينغ", enTitle: "Casting Opportunities",
        ar: ["ملامح منصة تقنية تربط المواهب بالجهات الناشرة للفرص، ولا تضمن قبول المتقدم أو اختياره أو حصوله على عمل أو عقد أو مقابل مالي.", "عدم قبول المستخدم في فرصة أو مشروع لا يشكل بحد ذاته سببًا لاسترداد أي رسوم تم دفعها مقابل خدمة مستقلة تم تنفيذها فعليًا داخل المنصة.", "ولا يجوز تفسير دفع أي رسوم للمنصة -إن وجدت- على أنه ضمان للحصول على فرصة أو اختيار مهني."],
        en: ["MLAMH is a technology platform connecting talent with opportunity publishers and does not guarantee selection, employment, contracts, or compensation.", "Rejection from an opportunity does not itself create a refund right for a separate platform service that has already been provided."],
      },
      {
        arTitle: "الفرص أو الخدمات المدفوعة المنشورة من الجهات", enTitle: "Third-Party or Publisher Transactions",
        ar: ["إذا أتاحت ملامح مستقبلًا خدمات مدفوعة بين المستخدمين والجهات أو أطرافًا ثالثة، فقد تخضع بعض المعاملات لشروط إضافية تظهر للمستخدم قبل الدفع.", "يتم تحديد مسؤولية كل طرف وطريقة الاسترداد بحسب طبيعة المعاملة، دون الإخلال بالحقوق النظامية."],
        en: ["Future paid transactions involving publishers or third parties may be subject to additional terms disclosed before payment."],
      },
      {
        arTitle: "طريقة تقديم طلب الاسترداد", enTitle: "Requesting a Refund",
        ar: ["يمكن تقديم طلب الاسترداد عبر قنوات التواصل الرسمية الموضحة في منصة ملامح.", "يجب أن يتضمن الطلب البريد الإلكتروني المرتبط بالحساب، ورقم العملية -إن وجد-، وتاريخ الدفع، وسبب طلب الاسترداد.", "قد نطلب معلومات إضافية للتحقق من هوية صاحب الحساب أو صحة العملية قبل معالجة الطلب."],
        en: ["Refund requests may be submitted through MLAMH's official contact channels.", "Requests should include the account email, transaction reference where available, payment date, and reason for the request."],
      },
      {
        arTitle: "إعادة المبالغ", enTitle: "Refund Processing",
        ar: ["عند الموافقة على طلب الاسترداد، تتم إعادة المبلغ إلى وسيلة الدفع الأصلية متى كان ذلك ممكنًا.", "قد تستغرق عملية ظهور المبلغ في حساب المستخدم مدة إضافية تعتمد على مزود خدمة الدفع أو البنك المصدر لوسيلة الدفع.", "لا تتحمل ملامح التأخير الناتج حصريًا عن إجراءات البنوك أو مزودي خدمات الدفع بعد تنفيذ عملية الاسترداد من جانب المنصة."],
        en: ["Approved refunds will generally be returned to the original payment method where possible.", "Processing times may vary depending on the payment provider or issuing bank."],
      },
      {
        arTitle: "إساءة استخدام سياسة الاسترداد", enTitle: "Abuse and Fraud",
        ar: ["يجوز للمنصة رفض الطلبات الاحتيالية أو المكررة أو التي تتضمن إساءة واضحة لاستخدام نظام الاسترداد، وذلك في الحدود التي تسمح بها الأنظمة.", "ويجوز اتخاذ إجراءات لحماية المنصة والمستخدمين من عمليات الاحتيال أو إساءة استخدام وسائل الدفع."],
        en: ["MLAMH may reject fraudulent, abusive, or duplicate refund claims to the extent permitted by applicable law."],
      },
      {
        arTitle: "التعديلات على السياسة", enTitle: "Changes to this Policy",
        ar: ["يجوز تحديث هذه السياسة عند تطوير الخدمات أو إضافة ميزات أو وسائل دفع جديدة، أو عند الحاجة للامتثال للمتطلبات النظامية.", "سيتم نشر النسخة المحدثة على هذه الصفحة، ويسري التحديث من التاريخ الموضح فيها، مع مراعاة الحقوق التي نشأت قبل التعديل وفقًا للأنظمة."],
        en: ["This policy may be updated as MLAMH introduces new services, payment methods, or regulatory requirements."],
      },
      {
        arTitle: "التواصل", enTitle: "Contact",
        ar: ["للاستفسارات المتعلقة بعمليات الدفع أو الاسترداد، يمكن التواصل معنا عبر البريد الإلكتروني الرسمي الموضح في منصة ملامح."],
        en: ["For payment or refund enquiries, contact MLAMH through the official contact details published on the platform."],
      },
    ],
  },
};
