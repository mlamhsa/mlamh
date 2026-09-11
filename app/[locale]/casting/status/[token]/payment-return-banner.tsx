"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentReturnBanner({ locale }: { locale: "ar" | "en" }) {
  const searchParams = useSearchParams();
  const state = searchParams.get("payment");
  if (!state) return null;

  const ar = locale === "ar";
  const copy: Record<string, { title: string; body: string; tone: string }> = {
    paid: {
      title: ar ? "تم استلام الدفعة" : "Payment received",
      body: ar ? "تم تسجيل الدفعة بنجاح وتفعيل المرحلة التالية من المشروع تلقائيًا." : "Your payment was recorded successfully and the next project stage is now active.",
      tone: "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-100",
    },
    pending: {
      title: ar ? "جاري تأكيد حالة الدفع" : "Payment confirmation in progress",
      body: ar ? "قد تستغرق مزامنة عملية الدفع لحظات قليلة. سيتم تحديث الحالة تلقائيًا عند تأكيد Tap للعملية." : "Payment synchronization can take a few moments. The status will update once Tap confirms the charge.",
      tone: "border-amber-300/25 bg-amber-300/[0.07] text-amber-100",
    },
    failed: {
      title: ar ? "لم تكتمل عملية الدفع" : "Payment was not completed",
      body: ar ? "يمكنك إعادة المحاولة من قسم المدفوعات. لن يبدأ أي التزام مدفوع قبل نجاح العملية." : "You can try again from the payments section. No paid stage starts until the charge succeeds.",
      tone: "border-red-300/25 bg-red-300/[0.07] text-red-100",
    },
    cancelled: {
      title: ar ? "تم إلغاء عملية الدفع" : "Payment was cancelled",
      body: ar ? "لم يتم تحصيل المبلغ. يمكنك إعادة المحاولة من قسم المدفوعات متى أردت." : "No amount was collected. You can retry from the payments section whenever you are ready.",
      tone: "border-white/15 bg-white/[0.04] text-white/80",
    },
    invalid: {
      title: ar ? "تعذر التحقق من عملية الدفع" : "We could not verify this payment",
      body: ar ? "لم نقم بتفعيل أي مرحلة مدفوعة. إذا تم خصم مبلغ فتواصل مع فريق ملامح مع مرجع العملية." : "No paid stage was activated. If you were charged, contact MLAMH with the payment reference.",
      tone: "border-red-300/25 bg-red-300/[0.07] text-red-100",
    },
    not_found: {
      title: ar ? "لم يتم العثور على عملية الدفع" : "Payment record was not found",
      body: ar ? "لم يتم تفعيل أي مرحلة مدفوعة. تواصل مع فريق ملامح إذا كنت تتوقع وجود عملية دفع." : "No paid stage was activated. Contact MLAMH if you expected a payment record here.",
      tone: "border-red-300/25 bg-red-300/[0.07] text-red-100",
    },
  };

  const message = copy[state];
  if (!message) return null;

  return (
    <div dir={ar ? "rtl" : "ltr"} className="bg-black px-4 pt-24 sm:px-6 lg:pt-32">
      <div className={`mx-auto max-w-6xl rounded-2xl border p-4 sm:p-5 ${message.tone}`}>
        <p className="text-sm font-medium">{message.title}</p>
        <p className="mt-1 text-xs leading-6 opacity-75 sm:text-sm">{message.body}</p>
      </div>
    </div>
  );
}
