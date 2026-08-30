import { CreditCard, Settings, Sparkles } from "lucide-react";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { minorToMajorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

type PriceRow = {
  id: number;
  code: string;
  currency: string;
  amount_minor: number;
  active: boolean;
  product_id: number;
};

type ProductRow = {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
};

export const metadata = {
  title: "Settings — MLAMH Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const locale = lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const adminClient = createAdminClient();

  const [{ data: prices }, { data: products }] = await Promise.all([
    adminClient
      .from("payment_prices")
      .select("id, code, currency, amount_minor, active, product_id")
      .eq("active", true)
      .order("id", { ascending: true }),
    adminClient
      .from("payment_products")
      .select("id, code, name_ar, name_en")
      .eq("active", true)
      .order("id", { ascending: true }),
  ]);

  const priceRows = (prices ?? []) as PriceRow[];
  const productRows = (products ?? []) as ProductRow[];
  const productsById = new Map(productRows.map((product) => [product.id, product]));

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="mx-auto max-w-6xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10">
      <section className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH ADMIN</p>
        <h1 className="mt-3 text-3xl font-light md:text-5xl">
          {isArabic ? "الإعدادات" : "Settings"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
          {isArabic
            ? "نظرة تشغيلية على إعدادات النظام التجارية الحالية."
            : "Operational overview of the platform's current commercial settings."}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <Settings className="h-4 w-4" />
            {isArabic ? "بيئة الإدارة" : "Admin environment"}
          </div>
          <p className="mt-3 text-sm text-white/70">{isArabic ? "الإعدادات متصلة بقاعدة البيانات مباشرة." : "Settings are connected directly to the database."}</p>
        </div>
        <div className="rounded-3xl border border-gold/15 bg-gold/[0.035] p-5">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <CreditCard className="h-4 w-4 text-gold" />
            {isArabic ? "المنتجات التجارية النشطة" : "Active commercial products"}
          </div>
          <p className="mt-3 text-3xl font-light">{priceRows.length}</p>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-medium">{isArabic ? "الأسعار النشطة" : "Active prices"}</h2>
        </div>
        {priceRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">
            {isArabic ? "لا توجد أسعار نشطة." : "No active prices found."}
          </p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {priceRows.map((price) => {
              const product = productsById.get(price.product_id);
              const name = isArabic
                ? product?.name_ar || product?.name_en || price.code
                : product?.name_en || product?.name_ar || price.code;
              const formatted = new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
                style: "currency",
                currency: price.currency,
              }).format(minorToMajorAmount(price.amount_minor, price.currency));

              return (
                <div key={price.id} className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <p className="truncate text-sm text-white/80">{name}</p>
                    </div>
                    <p className="mt-1 truncate font-mono text-[10px] text-white/25">{price.code}</p>
                  </div>
                  <span className="w-fit rounded-full border border-gold/20 bg-gold/[0.08] px-3 py-1.5 text-sm text-gold">
                    {formatted}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
