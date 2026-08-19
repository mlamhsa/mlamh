import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { isValidLocale, type Locale } from "@/lib/i18n";

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isAr = locale === "ar";
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const sections = isAr
    ? [
        {
          title: "1. نطاق السياسة",
          content: [
            "تنظم هذه السياسة طلبات الإلغاء والاسترداد المتعلقة بالخدمات والميزات المدفوعة المقدمة عبر منصة ملامح.",
            "تنطبق هذه السياسة مع مراعاة الحقوق المقررة للمستخدم بموجب الأنظمة واللوائح المعمول بها في المملكة العربية السعودية، ولا تهدف إلى تقييد أي حق نظامي لا يجوز الاتفاق على مخالفته.",
          ],
        },
        {
          title: "2. الخدمات المجانية",
          content: [
            "لا يترتب على استخدام الخدمات المجانية في ملامح أي مبالغ قابلة للاسترداد.",
            "يشمل ذلك إنشاء الحساب، وتصفح المحتوى أو الفرص أو الملفات المتاحة مجانًا، وأي خدمة تقدمها المنصة دون مقابل مالي.",
          ],
        },
        {
          title: "3. الخدمات والميزات المدفوعة",
          content: [
            "قد توفر ملامح خدمات أو ميزات مدفوعة، مثل إبراز الفرص، إبراز الملفات، الاشتراكات، الباقات، أو خدمات رقمية إضافية.",
            "يتم توضيح السعر والمدة وأهم خصائص الخدمة قبل إتمام عملية الدفع.",
            "تخضع أهلية الاسترداد لطبيعة الخدمة، وما إذا كان تنفيذها قد بدأ أو تم الانتفاع بها، إضافة إلى الحقوق المقررة بموجب الأنظمة المعمول بها.",
          ],
        },
        {
          title: "4. طلب الاسترداد قبل الاستفادة من الخدمة",
          content: [
            "يجوز للمستخدم تقديم طلب لاسترداد المبلغ المدفوع إذا لم يبدأ تنفيذ الخدمة ولم يتم الانتفاع بها، وذلك وفقًا لهذه السياسة والأنظمة المعمول بها.",
            "يتم تقييم الطلب بناءً على حالة العملية والخدمة وتاريخ الدفع وأي استخدام فعلي للميزة المدفوعة.",
          ],
        },
        {
          title: "5. بعد بدء تنفيذ الخدمة",
          content: [
            "إذا بدأ تنفيذ الخدمة الرقمية أو تم تفعيلها أو الاستفادة منها، فقد يؤثر ذلك في أهلية الاسترداد وفقًا لطبيعة الخدمة والأنظمة المطبقة.",
            "من أمثلة ذلك بدء إبراز فرصة أو ملف، تفعيل باقة، تنفيذ خدمة ترويجية، أو استخدام رصيد أو ميزة مدفوعة.",
            "لن تؤثر هذه الأحكام على أي حق إلزامي للمستخدم تقرره الأنظمة المعمول بها.",
          ],
        },
        {
          title: "6. المدفوعات المكررة أو غير الصحيحة",
          content: [
            "إذا تم خصم مبلغ مكرر للمعاملة نفسها بسبب خطأ تقني مثبت، يحق للمستخدم طلب مراجعة العملية واسترداد المبلغ المكرر عند التحقق منه.",
            "قد نطلب رقم العملية أو إثبات الدفع أو بيانات أخرى لازمة للتحقق من المعاملة.",
          ],
        },
        {
          title: "7. الخدمات التي لم يتم تنفيذها",
          content: [
            "إذا تعذر على ملامح تقديم خدمة مدفوعة تم شراؤها بسبب خطأ من المنصة، فسنقوم بمعالجة الحالة وفقًا لطبيعتها، وقد يشمل ذلك إعادة تنفيذ الخدمة أو إعادة المبلغ المستحق.",
            "كما تظل الحقوق المتعلقة بالتأخر أو عدم تنفيذ الخدمة خاضعة للأنظمة المعمول بها.",
          ],
        },
        {
          title: "8. الفرص والكاستينغ",
          content: [
            "ملامح منصة تقنية تربط المواهب بالجهات الناشرة للفرص، ولا تضمن قبول المتقدم أو اختياره أو حصوله على عمل أو عقد أو مقابل مالي.",
            "عدم قبول المستخدم في فرصة أو مشروع لا يشكل بحد ذاته سببًا لاسترداد أي رسوم تم دفعها مقابل خدمة مستقلة تم تنفيذها فعليًا داخل المنصة.",
            "ولا يجوز تفسير دفع أي رسوم للمنصة -إن وجدت- على أنه ضمان للحصول على فرصة أو اختيار مهني.",
          ],
        },
        {
          title: "9. الفرص أو الخدمات المدفوعة المنشورة من الجهات",
          content: [
            "إذا أتاحت ملامح مستقبلًا خدمات مدفوعة بين المستخدمين والجهات أو أطرافًا ثالثة، فقد تخضع بعض المعاملات لشروط إضافية تظهر للمستخدم قبل الدفع.",
            "يتم تحديد مسؤولية كل طرف وطريقة الاسترداد بحسب طبيعة المعاملة، دون الإخلال بالحقوق النظامية.",
          ],
        },
        {
          title: "10. طريقة تقديم طلب الاسترداد",
          content: [
            "يمكن تقديم طلب الاسترداد عبر قنوات التواصل الرسمية الموضحة في منصة ملامح.",
            "يجب أن يتضمن الطلب البريد الإلكتروني المرتبط بالحساب، ورقم العملية -إن وجد-، وتاريخ الدفع، وسبب طلب الاسترداد.",
            "قد نطلب معلومات إضافية للتحقق من هوية صاحب الحساب أو صحة العملية قبل معالجة الطلب.",
          ],
        },
        {
          title: "11. إعادة المبالغ",
          content: [
            "عند الموافقة على طلب الاسترداد، تتم إعادة المبلغ إلى وسيلة الدفع الأصلية متى كان ذلك ممكنًا.",
            "قد تستغرق عملية ظهور المبلغ في حساب المستخدم مدة إضافية تعتمد على مزود خدمة الدفع أو البنك المصدر لوسيلة الدفع.",
            "لا تتحمل ملامح التأخير الناتج حصريًا عن إجراءات البنوك أو مزودي خدمات الدفع بعد تنفيذ عملية الاسترداد من جانب المنصة.",
          ],
        },
        {
          title: "12. إساءة استخدام سياسة الاسترداد",
          content: [
            "يجوز للمنصة رفض الطلبات الاحتيالية أو المكررة أو التي تتضمن إساءة واضحة لاستخدام نظام الاسترداد، وذلك في الحدود التي تسمح بها الأنظمة.",
            "ويجوز اتخاذ إجراءات لحماية المنصة والمستخدمين من عمليات الاحتيال أو إساءة استخدام وسائل الدفع.",
          ],
        },
        {
          title: "13. التعديلات على السياسة",
          content: [
            "يجوز تحديث هذه السياسة عند تطوير الخدمات أو إضافة ميزات أو وسائل دفع جديدة، أو عند الحاجة للامتثال للمتطلبات النظامية.",
            "سيتم نشر النسخة المحدثة على هذه الصفحة، ويسري التحديث من التاريخ الموضح فيها، مع مراعاة الحقوق التي نشأت قبل التعديل وفقًا للأنظمة.",
          ],
        },
        {
          title: "14. التواصل",
          content: [
            "للاستفسارات المتعلقة بعمليات الدفع أو الاسترداد، يمكن التواصل معنا عبر البريد الإلكتروني الرسمي الموضح في منصة ملامح.",
          ],
        },
      ]
    : [
        {
          title: "1. Scope",
          content: [
            "This policy governs cancellation and refund requests relating to paid services and features provided through MLAMH.",
            "This policy applies subject to mandatory rights available under the laws and regulations of the Kingdom of Saudi Arabia.",
          ],
        },
        {
          title: "2. Free Services",
          content: [
            "No refund applies to services provided free of charge.",
          ],
        },
        {
          title: "3. Paid Services and Features",
          content: [
            "MLAMH may offer paid services including promoted opportunities, promoted profiles, subscriptions, packages, or other digital features.",
            "Pricing, duration, and key service details will be presented before payment.",
          ],
        },
        {
          title: "4. Refund Before Use",
          content: [
            "Users may request a refund where a paid service has not yet been performed or used, subject to this policy and applicable law.",
          ],
        },
        {
          title: "5. Services Already Activated",
          content: [
            "Once a digital service has been activated, performed, or used, refund eligibility may be affected depending on the nature of the service and applicable law.",
            "Nothing in this policy limits mandatory consumer rights.",
          ],
        },
        {
          title: "6. Duplicate or Incorrect Charges",
          content: [
            "Verified duplicate charges caused by a technical error may be refunded following review.",
          ],
        },
        {
          title: "7. Services Not Delivered",
          content: [
            "Where MLAMH is unable to provide a purchased service due to an error attributable to the platform, MLAMH may reperform the service or issue the applicable refund.",
          ],
        },
        {
          title: "8. Casting Opportunities",
          content: [
            "MLAMH is a technology platform connecting talent with opportunity publishers and does not guarantee selection, employment, contracts, or compensation.",
            "Rejection from an opportunity does not itself create a refund right for a separate platform service that has already been provided.",
          ],
        },
        {
          title: "9. Third-Party or Publisher Transactions",
          content: [
            "Future paid transactions involving publishers or third parties may be subject to additional terms disclosed before payment.",
          ],
        },
        {
          title: "10. Requesting a Refund",
          content: [
            "Refund requests may be submitted through MLAMH's official contact channels.",
            "Requests should include the account email, transaction reference where available, payment date, and reason for the request.",
          ],
        },
        {
          title: "11. Refund Processing",
          content: [
            "Approved refunds will generally be returned to the original payment method where possible.",
            "Processing times may vary depending on the payment provider or issuing bank.",
          ],
        },
        {
          title: "12. Abuse and Fraud",
          content: [
            "MLAMH may reject fraudulent, abusive, or duplicate refund claims to the extent permitted by applicable law.",
          ],
        },
        {
          title: "13. Changes to this Policy",
          content: [
            "This policy may be updated as MLAMH introduces new services, payment methods, or regulatory requirements.",
          ],
        },
        {
          title: "14. Contact",
          content: [
            "For payment or refund enquiries, contact MLAMH through the official contact details published on the platform.",
          ],
        },
      ];

  const highlights = isAr
    ? [
        {
          icon: ShieldCheck,
          title: "حقوقك محفوظة",
          text: "لا تلغي هذه السياسة أي حقوق إلزامية مقررة نظامًا.",
        },
        {
          icon: RefreshCcw,
          title: "مراجعة كل طلب",
          text: "يتم تقييم طلب الاسترداد وفق حالة الخدمة والاستخدام.",
        },
        {
          icon: FileCheck2,
          title: "وضوح قبل الدفع",
          text: "نعرض السعر وطبيعة الخدمة قبل إتمام العملية.",
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: "Your Rights Remain Protected",
          text: "Mandatory legal rights are not waived by this policy.",
        },
        {
          icon: RefreshCcw,
          title: "Requests Are Reviewed",
          text: "Refund eligibility depends on service status and usage.",
        },
        {
          icon: FileCheck2,
          title: "Clear Before Payment",
          text: "Pricing and service details are presented before purchase.",
        },
      ];

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-20 pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.12),transparent_48%)]" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-gold"
          >
            <BackArrow size={16} />
            {isAr ? "العودة إلى الرئيسية" : "Back to Home"}
          </Link>

          <div className="mt-14 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-2 text-xs text-gold">
              <CircleDollarSign size={15} />
              {isAr ? "قانوني" : "Legal"}
            </div>

            <h1 className="mt-7 text-5xl font-light leading-tight md:text-7xl">
              {isAr
                ? "سياسة الاسترجاع والاسترداد"
                : "Refund & Cancellation Policy"}
            </h1>

            <p className="mt-7 max-w-3xl text-base leading-8 text-white/55 md:text-lg">
              {isAr
                ? "توضح هذه السياسة كيفية التعامل مع الإلغاء والاسترداد للخدمات والميزات المدفوعة عبر منصة ملامح."
                : "This policy explains how cancellations and refunds are handled for paid MLAMH services and features."}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 text-xs text-white/35">
              <Clock3 size={14} />
              {isAr
                ? "آخر تحديث: أغسطس 2026"
                : "Last updated: August 2026"}
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"
                >
                  <Icon size={22} className="text-gold" />

                  <h2 className="mt-5 text-lg font-medium">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-white/45">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 rounded-[1.75rem] border border-gold/15 bg-gold/[0.04] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <BadgeCheck
                size={22}
                className="mt-1 shrink-0 text-gold"
              />

              <p className="text-sm leading-8 text-white/60">
                {isAr
                  ? "تُقرأ هذه السياسة مع الشروط والأحكام وسياسة الخصوصية الخاصة بملامح. وفي حال تعارض أي نص في هذه السياسة مع حكم نظامي إلزامي، يكون الحكم النظامي هو المعمول به."
                  : "This policy should be read together with MLAMH's Terms and Conditions and Privacy Policy. Mandatory applicable law prevails where required."}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-6 md:p-8"
              >
                <h2 className="text-2xl font-light">
                  {section.title}
                </h2>

                <div className="mt-5 space-y-4">
                  {section.content.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-8 text-white/50 md:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-[1.75rem] border border-white/10 p-7 text-center">
            <p className="text-sm text-white/45">
              {isAr
                ? "لديك استفسار متعلق بالدفع أو الاسترداد؟"
                : "Have a payment or refund question?"}
            </p>

            <a
              href="mailto:mlamh@gmail.com"
              className="mt-4 inline-flex rounded-full border border-gold/30 bg-gold/[0.07] px-6 py-3 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              mlamh@gmail.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}