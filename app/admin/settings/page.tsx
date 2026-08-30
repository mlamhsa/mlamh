import {
  CheckCircle2,
  CreditCard,
  Save,
  Settings,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { updateAdminPaymentPriceAction } from "@/lib/actions/update-admin-payment-price";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
    price_saved?: string;
    price_error?: string;
    product?: string;
  }>;
};

type PriceRow = {
  id: number;
  code: string;
  currency: string;
  amount_minor: number;
  active: boolean;
  product_id: number;
  metadata: Record<string, unknown> | null;
};

type ProductRow = {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
};

const EDITABLE_PRODUCT_CODES = new Set([
  "featured_talent",
  "featured_opportunity",
]);

export const metadata = {
  title: "Settings — MLAMH Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const query = await searchParams;
  const locale = query.lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const adminClient = createAdminClient();

  const [{ data: prices }, { data: products }] = await Promise.all([
    adminClient
      .from("payment_prices")
      .select("id, code, currency, amount_minor, active, product_id, metadata")
      .eq("active", true)
      .order("id", { ascending: true }),
    adminClient
      .from("payment_products")
      .select("id, code, name_ar, name_en")
      .eq("active", true)
      .order("id", { ascending: true }),
  ]);

  const allPriceRows = (prices ?? []) as PriceRow[];
  const productRows = (products ?? []) as ProductRow[];
  const productsById = new Map(productRows.map((product) => [product.id, product]));

  const priceRows = allPriceRows.filter((price) => {
    const product = productsById.get(price.product_id);
    return Boolean(product && EDITABLE_PRODUCT_CODES.has(product.code));
  });

  const errorMessage = query.price_error
    ? isArabic
      ? query.price_error === "invalid_amount"
        ? "السعر يجب أن يكون بين 1 و10,000 ريال."
        : "تعذر تحديث السعر. تحقق من البيانات وحاول مرة أخرى."
      : query.price_error === "invalid_amount"
        ? "The price must be between SAR 1 and SAR 10,000."
        : "Unable to update the price. Check the data and try again."
    : null;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto max-w-6xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10"
    >
      <section className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
          MLAMH ADMIN
        </p>
        <h1 className="mt-3 text-3xl font-light md:text-5xl">
          {isArabic ? "الإعدادات" : "Settings"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
          {isArabic
            ? "إدارة الإعدادات التجارية والأسعار النشطة مباشرة من لوحة الإدارة."
            : "Manage active commercial settings and prices directly from the admin dashboard."}
        </p>
      </section>

      {query.price_saved === "1" ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {isArabic
              ? "تم تحديث السعر بنجاح. سيُستخدم السعر الجديد في عمليات الشراء الجديدة فقط."
              : "Price updated successfully. The new price will apply to new purchases only."}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
          <div className="flex items-center gap-2 text-[10px] text-white/45 sm:text-xs">
            <Settings className="h-4 w-4" />
            {isArabic ? "بيئة الإدارة" : "Admin environment"}
          </div>
          <p className="mt-3 text-xs leading-6 text-white/65 sm:text-sm">
            {isArabic
              ? "التغييرات تحفظ مباشرة في قاعدة البيانات."
              : "Changes are saved directly to the database."}
          </p>
        </div>

        <div className="rounded-2xl border border-gold/15 bg-gold/[0.035] p-4 sm:rounded-3xl sm:p-5">
          <div className="flex items-center gap-2 text-[10px] text-white/45 sm:text-xs">
            <CreditCard className="h-4 w-4 text-gold" />
            {isArabic ? "الأسعار القابلة للتعديل" : "Editable prices"}
          </div>
          <p className="mt-3 text-2xl font-light sm:text-3xl">{priceRows.length}</p>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="text-base font-medium sm:text-lg">
              {isArabic ? "أسعار المزايا المدفوعة" : "Paid benefit prices"}
            </h2>
          </div>
          <p className="mt-2 text-xs leading-6 text-white/35">
            {isArabic
              ? "تعديل السعر لا يغيّر أي دفعة سابقة أو ميزة مفعلة بالفعل؛ السعر الجديد يطبق على الشراء التالي."
              : "Changing a price does not alter previous payments or active benefits; it applies to future purchases."}
          </p>
        </div>

        {priceRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">
            {isArabic ? "لا توجد أسعار تجارية قابلة للتعديل." : "No editable commercial prices found."}
          </p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {priceRows.map((price) => {
              const product = productsById.get(price.product_id);
              const name = isArabic
                ? product?.name_ar || product?.name_en || price.code
                : product?.name_en || product?.name_ar || price.code;
              const amountMajor = minorToMajorAmount(price.amount_minor, price.currency);
              const durationDays = Number(price.metadata?.duration_days ?? 0);

              return (
                <div key={price.id} className="px-4 py-5 sm:px-5 sm:py-6">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0 text-gold" />
                        <p className="truncate text-sm font-medium text-white/80 sm:text-base">
                          {name}
                        </p>
                      </div>

                      <p className="mt-1.5 truncate font-mono text-[10px] text-white/25">
                        {product?.code ?? price.code}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/35">
                        <span className="rounded-full border border-white/[0.08] px-2.5 py-1">
                          {price.currency}
                        </span>
                        {durationDays > 0 ? (
                          <span className="rounded-full border border-white/[0.08] px-2.5 py-1">
                            {isArabic ? `${durationDays} يوم` : `${durationDays} days`}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <form
                      action={updateAdminPaymentPriceAction}
                      className="rounded-2xl border border-gold/15 bg-black/20 p-3 sm:p-4"
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="price_id" value={price.id} />

                      <label className="block">
                        <span className="mb-2 block text-[10px] text-white/40">
                          {isArabic ? "السعر بالريال السعودي" : "Price in Saudi Riyals"}
                        </span>
                        <div className="flex gap-2">
                          <div className="relative min-w-0 flex-1">
                            <input
                              type="number"
                              name="amount_major"
                              min="1"
                              max="10000"
                              step="0.01"
                              required
                              defaultValue={amountMajor}
                              dir="ltr"
                              className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 pe-14 text-base text-white outline-none transition focus:border-gold/40"
                            />
                            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-gold">
                              SAR
                            </span>
                          </div>

                          <button
                            type="submit"
                            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-medium text-black transition hover:bg-gold-soft"
                          >
                            <Save className="h-3.5 w-3.5" />
                            {isArabic ? "حفظ" : "Save"}
                          </button>
                        </div>
                      </label>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
