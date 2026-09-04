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
    title: isArabic ? "سياسة الشكاوى والمقترحات | ملامح" : "Complaints & Feedback Policy | MLAMH",
    description: isArabic
      ? "آلية تقديم الشكاوى والمقترحات ومتابعتها عبر ملامح."
      : "How to submit and follow complaints, reports, and feedback through MLAMH.",
  };
}

export default async function ComplaintsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  const sections = [
    {
      ar: "القنوات المعتمدة",
      en: "Official Channels",
      arText: [
        "يمكن إرسال الشكاوى والمقترحات والبلاغات عبر صفحة الدعم والتواصل في ملامح، حيث يتم إنشاء رقم تذكرة يمكن الرجوع إليه.",
        "يمكن كذلك التواصل عبر البريد hello@mlamh.net عند الحاجة، مع تفضيل نظام التذاكر لأنه يحفظ مسار المتابعة بشكل أوضح.",
      ],
      enText: [
        "Complaints, feedback, and reports can be submitted through MLAMH Support & Contact, where a ticket reference is created for follow-up.",
        "Users may also contact hello@mlamh.net when needed, although the ticket system is preferred because it provides a clearer follow-up record.",
      ],
    },
    {
      ar: "المعلومات المطلوبة",
      en: "Information to Include",
      arText: [
        "اذكر البريد المرتبط بالحساب، نوع المشكلة، تفاصيلها، وأي رقم فرصة أو عملية أو مستخدم مرتبط بالموضوع عند توفره.",
        "لا ترسل كلمات المرور أو بيانات بطاقات الدفع أو أي معلومات سرية لا نحتاجها لمعالجة الطلب.",
      ],
      enText: [
        "Include the account email, issue category, relevant details, and any opportunity, transaction, or user reference where available.",
        "Do not send passwords, card details, or other secrets that are not needed to handle the request.",
      ],
    },
    {
      ar: "المراجعة والمتابعة",
      en: "Review and Follow-up",
      arText: [
        "تتم مراجعة كل طلب بحسب طبيعته وأولويته، وقد نطلب معلومات إضافية أو التحقق من هوية مقدم الطلب قبل اتخاذ إجراء يؤثر على حساب أو بيانات شخصية.",
        "قد تتطلب بعض البلاغات وقتًا أطول إذا احتاجت مراجعة سجلات أو تواصلًا مع أطراف أخرى أو تحققًا نظاميًا.",
      ],
      enText: [
        "Each request is reviewed according to its nature and priority. We may request additional information or identity verification before taking action affecting an account or personal data.",
        "Some reports may take longer where logs, third-party communication, or legal verification are required.",
      ],
    },
    {
      ar: "الشكاوى المتعلقة بالمدفوعات",
      en: "Payment Complaints",
      arText: [
        "للخصومات أو طلبات الاسترداد، يرجى إرفاق رقم العملية أو الفاتورة إن وجد ومراجعة سياسة الاسترجاع والاسترداد.",
      ],
      enText: [
        "For charges or refund requests, include the transaction or invoice reference where available and review the Refund & Cancellation Policy.",
      ],
    },
    {
      ar: "البلاغات المتعلقة بالمحتوى أو المستخدمين",
      en: "Content or User Reports",
      arText: [
        "إذا كان البلاغ متعلقًا بفرصة مضللة أو إساءة استخدام أو انتحال أو محتوى مخالف، اذكر الرابط أو رقم السجل وكل ما يساعد على التحقق دون نشر معلومات حساسة علنًا.",
      ],
      enText: [
        "For misleading opportunities, misuse, impersonation, or prohibited content, include the relevant link or record reference and supporting details without publishing sensitive information publicly.",
      ],
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-xs text-gold">{isRtl ? "الدعم والامتثال" : "Support & Compliance"}</p>
          <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
            {isRtl ? "سياسة الشكاوى والمقترحات" : "Complaints & Feedback Policy"}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
            {isRtl
              ? "نستخدم نظام تذاكر موحد لتسجيل الشكاوى والمقترحات والبلاغات ومتابعتها بشكل منظم."
              : "MLAMH uses a unified ticket system to record and follow complaints, feedback, and reports in an organized way."}
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

        <section className="mt-8 flex flex-col gap-3 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-light">{isRtl ? "هل لديك شكوى أو ملاحظة؟" : "Have a complaint or feedback?"}</h2>
            <p className="mt-2 text-sm text-white/45">{isRtl ? "افتح تذكرة ليتم تسجيل الطلب ومتابعته." : "Open a ticket so the request can be recorded and followed."}</p>
          </div>
          <Link href={`/${locale}/contact`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-5 py-3 text-sm font-medium text-black">
            {isRtl ? "فتح تذكرة" : "Open ticket"}
          </Link>
        </section>
      </div>
    </main>
  );
}
