import Link from "next/link";

import { orchestrateSucceededPayment } from "@/lib/payments/payment-orchestrator";
import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";
import { reconcileTapPayment } from "@/lib/payments/reconciliation";

export const dynamic = "force-dynamic";

type PaymentReturnStatus = "succeeded" | "processing" | "failed" | "cancelled" | "error";

function getTapId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const tapId = candidate?.trim() ?? "";

  if (!tapId || tapId.length > 200 || !/^[A-Za-z0-9_-]+$/.test(tapId)) {
    return null;
  }

  return tapId;
}

function mapReturnStatus(status: string): PaymentReturnStatus {
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  return "processing";
}

export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{ tap_id?: string | string[] }>;
}) {
  const [{ locale: rawLocale = "ar" }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const tapId = getTapId(query.tap_id);

  let status: PaymentReturnStatus = "error";

  if (tapId) {
    try {
      const providerPayment = await tapPaymentProvider.retrievePayment({
        providerPaymentId: tapId,
      });

      const reconciled = await reconcileTapPayment(providerPayment);

      if (providerPayment.status === "succeeded") {
        await orchestrateSucceededPayment(reconciled.payment.id);
      }

      status = mapReturnStatus(providerPayment.status);
    } catch (error) {
      console.error("[PaymentReturn] unable to verify Tap payment", {
        tapId,
        error: error instanceof Error ? error.message : "unknown_error",
      });
      status = "error";
    }
  }

  const content = {
    succeeded: {
      title: isArabic ? "تم تأكيد عملية الدفع" : "Payment confirmed",
      description: isArabic
        ? "تم التحقق من العملية مباشرة من مزود الدفع وتحديث حالتها في ملامح."
        : "The transaction was verified directly with the payment provider and updated in MLAMH.",
    },
    processing: {
      title: isArabic ? "جاري تأكيد عملية الدفع" : "Payment is being confirmed",
      description: isArabic
        ? "لم تصل العملية إلى حالتها النهائية بعد. سيتم تحديثها تلقائيًا عند استلام التأكيد النهائي."
        : "The transaction has not reached a final state yet. It will update automatically once final confirmation is received.",
    },
    failed: {
      title: isArabic ? "لم تكتمل عملية الدفع" : "Payment was not completed",
      description: isArabic
        ? "تم التحقق من العملية ولم يتم تحصيل المبلغ بنجاح."
        : "The transaction was verified and the payment was not successfully captured.",
    },
    cancelled: {
      title: isArabic ? "تم إلغاء عملية الدفع" : "Payment was cancelled",
      description: isArabic
        ? "تم التحقق من العملية وهي في حالة إلغاء."
        : "The transaction was verified and is marked as cancelled.",
    },
    error: {
      title: isArabic ? "تعذر تأكيد حالة الدفع" : "Unable to confirm payment status",
      description: isArabic
        ? "لم نتمكن من التحقق من العملية من هذه الصفحة. لا يعني ذلك أن المبلغ تم تحصيله، وسيظل إشعار مزود الدفع هو مصدر التأكيد النهائي."
        : "We could not verify the transaction from this page. This does not mean the payment was captured; the provider confirmation remains the source of truth.",
    },
  } satisfies Record<PaymentReturnStatus, { title: string; description: string }>;

  const current = content[status];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 pb-24 pt-32 text-white sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.025] p-7 sm:p-10">
          <p className="text-xs text-gold">
            {isArabic ? "حالة الدفع" : "Payment Status"}
          </p>

          <h1 className="mt-5 text-3xl font-light sm:text-4xl">
            {current.title}
          </h1>

          <p className="mt-5 text-sm leading-8 text-white/60 sm:text-base">
            {current.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft"
            >
              {isArabic ? "العودة للرئيسية" : "Back to Home"}
            </Link>

            <Link
              href={`/${locale}/contact`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm text-white/70 transition hover:border-gold/30 hover:text-gold"
            >
              {isArabic ? "تواصل مع الدعم" : "Contact Support"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
