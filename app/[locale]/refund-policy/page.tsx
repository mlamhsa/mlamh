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
    title: isArabic ? "سياسة الاسترجاع والاسترداد | ملامح" : "Refund & Cancellation Policy | MLAMH",
    description: isArabic
      ? "سياسة ملامح للاسترجاع والاسترداد وإلغاء الخدمات والمدفوعات عند انطباقها."
      : "MLAMH policy for refunds, cancellations, and paid services where applicable.",
  };
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  const sections = [
    {
      ar: "نطاق السياسة",
      en: "Scope",
      arText: [
        "تنطبق هذه السياسة على المبالغ التي تُدفع مباشرة إلى ملامح مقابل خدمة أو اشتراك أو ميزة مدفوعة عندما تكون هذه الخدمة متاحة ومفعلة.",
        "لا تنطبق هذه السياسة على المبالغ أو الأتعاب التي يتم الاتفاق عليها مباشرة بين المواهب والجهات الناشرة أو أي أطراف خارج ملامح، ما لم تكن ملامح هي الطرف الذي استلم المبلغ صراحةً.",
      ],
      enText: [
        "This policy applies to amounts paid directly to MLAMH for a service, subscription, or paid feature when such service is available and enabled.",
        "It does not apply to fees or payments agreed directly between talent, publishers, or other third parties unless MLAMH expressly received the payment as the service provider.",
      ],
    },
    {
      ar: "حق الإلغاء والاسترداد",
      en: "Cancellation and Refund Rights",
      arText: [
        "نحترم حقوق المستهلك المنصوص عليها في الأنظمة السعودية ذات الصلة، بما في ذلك نظام التجارة الإلكترونية متى انطبق على الخدمة محل التعاقد.",
        "إذا كان للمستهلك حق نظامي في فسخ عقد خدمة خلال مدة محددة ولم يكن قد استفاد من الخدمة أو انتفع بها، فسيتم التعامل مع طلبه وفق الأحكام النظامية والاستثناءات المنطبقة.",
        "لا تحد هذه السياسة من أي حق إلزامي للمستهلك لا يجوز التنازل عنه نظامًا.",
      ],
      enText: [
        "MLAMH respects consumer rights under applicable Saudi laws, including the E-Commerce Law where it applies to the contracted service.",
        "Where a consumer has a statutory right to cancel a service contract within an applicable period and has not used or benefited from the service, the request will be handled in accordance with the applicable legal rules and exceptions.",
        "Nothing in this policy limits any mandatory consumer right that cannot legally be waived.",
      ],
    },
    {
      ar: "الخدمات التي بدأ تنفيذها",
      en: "Services Already Started",
      arText: [
        "قد تختلف أهلية الاسترداد عندما تكون الخدمة قد بدأت بالفعل أو تم تنفيذ جزء جوهري منها بناءً على طلب العميل، وذلك وفق طبيعة الخدمة والأنظمة المنطبقة.",
        "في خدمات الكاستينغ المدارة أو الأعمال المخصصة، تتم مراجعة ما تم تنفيذه فعليًا قبل تحديد أي مبلغ قابل للاسترداد، إن وجد.",
      ],
      enText: [
        "Refund eligibility may differ once a service has already started or a substantial part has been performed at the customer's request, depending on the service and applicable law.",
        "For managed casting or customized work, MLAMH reviews the work already performed before determining any refundable amount, if applicable.",
      ],
    },
    {
      ar: "المدفوعات المكررة أو الخاطئة",
      en: "Duplicate or Incorrect Charges",
      arText: [
        "إذا ظهر للمستخدم خصم مكرر أو مبلغ غير مطابق لما وافق عليه، فيجب إرسال رقم العملية وتفاصيلها عبر مركز الدعم حتى نتمكن من التحقق منها.",
        "عند ثبوت وجود خصم غير صحيح من جانب ملامح، تتم معالجة التصحيح أو الاسترداد عبر وسيلة الدفع الأصلية متى أمكن.",
      ],
      enText: [
        "If a user sees a duplicate charge or an amount different from what they approved, they should submit the transaction reference and details through the support center for verification.",
        "Where an incorrect MLAMH charge is confirmed, the correction or refund will be processed to the original payment method where possible.",
      ],
    },
    {
      ar: "طريقة طلب الاسترداد",
      en: "How to Request a Refund",
      arText: [
        "أرسل طلبًا من صفحة الدعم والتواصل واختر «شكوى» أو اذكر بوضوح أن الطلب متعلق باسترداد مبلغ.",
        "يرجى إرفاق البريد المستخدم في الحساب، رقم العملية أو الفاتورة إن وجد، سبب الطلب، وأي معلومات تساعد على التحقق.",
      ],
      enText: [
        "Submit a request through Support & Contact and choose Complaint or clearly state that the request concerns a refund.",
        "Include the account email, transaction or invoice reference where available, the reason for the request, and any information needed to verify it.",
      ],
    },
    {
      ar: "مدة المعالجة",
      en: "Processing Time",
      arText: [
        "تتم مراجعة الطلبات في أقرب وقت ممكن بعد اكتمال المعلومات المطلوبة. وقد يختلف وقت ظهور المبلغ بعد اعتماد الاسترداد حسب البنك أو مزود خدمة الدفع.",
      ],
      enText: [
        "Requests are reviewed as soon as reasonably possible once the required information is complete. After a refund is approved, the time for funds to appear may vary by bank or payment provider.",
      ],
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-xs text-gold">{isRtl ? "قانوني" : "Legal"}</p>
          <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
            {isRtl ? "سياسة الاسترجاع والاسترداد" : "Refund & Cancellation Policy"}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
            {isRtl
              ? "توضح هذه السياسة طريقة التعامل مع الإلغاء والاسترداد للمدفوعات التي تتم مباشرة إلى ملامح عند توفر الخدمات المدفوعة."
              : "This policy explains how MLAMH handles cancellations and refunds for payments made directly to MLAMH when paid services are available."}
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

        <section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 text-center sm:p-8">
          <p className="text-sm leading-8 text-white/55">
            {isRtl ? "لطلب استرداد أو الاستفسار عن عملية دفع:" : "For a refund request or payment inquiry:"}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/contact`} className="rounded-xl bg-gold px-5 py-3 text-sm font-medium text-black">
              {isRtl ? "فتح تذكرة دعم" : "Open support ticket"}
            </Link>
            <a href="mailto:hello@mlamh.net" className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gold">
              hello@mlamh.net
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
