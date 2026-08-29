import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PaymentCheckoutButton from "@/components/payments/PaymentCheckoutButton";
import { getPurchasableCatalogItem } from "@/lib/payments/catalog";
import { formatProviderAmount } from "@/lib/payments/money";
import type { PaymentTargetType } from "@/lib/payments/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProductCode = "featured_talent" | "featured_opportunity";

type PageProps = {
  params: Promise<{ locale: string; product: string }>;
  searchParams: Promise<{ target_id?: string; market?: string }>;
};

function getProductConfig(product: string): {
  code: ProductCode;
  targetType: PaymentTargetType;
} | null {
  if (product === "featured_talent") {
    return { code: "featured_talent", targetType: "talent" };
  }

  if (product === "featured_opportunity") {
    return { code: "featured_opportunity", targetType: "opportunity" };
  }

  return null;
}

export default async function FeaturedCheckoutPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale, product } = await params;
  const query = await searchParams;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const config = getProductConfig(product);

  if (!config) notFound();

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const targetId = String(query.target_id ?? "").trim();
  const numericTargetId = Number(targetId);
  if (!Number.isSafeInteger(numericTargetId) || numericTargetId <= 0) {
    notFound();
  }

  const requestedMarket = String(query.market ?? "SA").trim().toUpperCase();
  const marketCountry = /^[A-Z]{2}$/.test(requestedMarket) ? requestedMarket : "SA";
  const item = await getPurchasableCatalogItem(config.code, marketCountry);

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold">MLAMH</p>
        <h1 className="mt-4 text-4xl font-light">
          {isArabic ? "إضافة ظهور مميز" : "Add featured visibility"}
        </h1>

        {!item ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-medium">
              {isArabic ? "الخدمة غير متاحة للشراء حاليًا" : "This service is not available for purchase yet"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {isArabic
                ? "تم تجهيز الخدمة تقنيًا، لكن لم يتم تفعيل المنتج والسعر التجاري بعد. لا توجد أي عملية دفع يمكن بدؤها من هذه الصفحة حاليًا."
                : "The service is technically prepared, but its commercial product and price are not active yet. No payment can be started from this page."}
            </p>
            <Link
              href={config.targetType === "talent" ? `/${locale}/dashboard/talent` : `/${locale}/publisher-dashboard/opportunities/${targetId}`}
              className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:border-gold/30 hover:text-gold"
            >
              {isArabic ? "العودة" : "Back"}
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-gold/20 bg-gold/[0.04] p-7">
            <h2 className="text-2xl font-medium">{isArabic ? item.nameAr : item.nameEn}</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {isArabic ? item.descriptionAr : item.descriptionEn}
            </p>

            <div className="mt-6 grid gap-4 border-y border-white/10 py-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-white/50">{isArabic ? "السعر" : "Price"}</p>
                <p className="mt-2 text-xl font-medium text-gold">
                  {formatProviderAmount(item.amountMinor, item.currency)} {item.currency}
                </p>
              </div>

              {item.durationDays ? (
                <div>
                  <p className="text-sm text-white/50">{isArabic ? "مدة التمييز" : "Featured duration"}</p>
                  <p className="mt-2 text-xl font-medium text-white">
                    {item.durationDays} {isArabic ? "يومًا" : "days"}
                  </p>
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-xs leading-6 text-white/40">
              {isArabic
                ? "دفعة واحدة. يبدأ التمييز بعد نجاح الدفع وتفعيله على العنصر المحدد."
                : "One-time payment. Featured visibility starts after successful payment and activation on the selected item."}
            </p>

            <div className="mt-7">
              <PaymentCheckoutButton
                priceId={item.priceId}
                locale={locale}
                marketCountry={item.marketCountry ?? marketCountry}
                target={{ type: config.targetType, id: targetId }}
                label={isArabic ? "المتابعة إلى الدفع" : "Continue to payment"}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
