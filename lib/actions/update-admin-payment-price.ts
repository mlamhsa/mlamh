"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { majorToMinorAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

const EDITABLE_PRODUCT_CODES = new Set([
  "featured_talent",
  "featured_opportunity",
]);

function settingsUrl(
  locale: "ar" | "en",
  params: Record<string, string>,
) {
  const query = new URLSearchParams({
    lang: locale,
    ...params,
  }).toString();

  return `/admin/settings?${query}`;
}

export async function updateAdminPaymentPriceAction(
  formData: FormData,
) {
  const adminUser = await requireAdminAccess();
  const locale: "ar" | "en" =
    formData.get("locale") === "en" ? "en" : "ar";

  const priceId = Number(formData.get("price_id"));
  const amountMajor = Number(formData.get("amount_major"));

  if (!Number.isInteger(priceId) || priceId <= 0) {
    redirect(settingsUrl(locale, { price_error: "invalid_price" }));
  }

  if (
    !Number.isFinite(amountMajor) ||
    amountMajor < 1 ||
    amountMajor > 10000
  ) {
    redirect(settingsUrl(locale, { price_error: "invalid_amount" }));
  }

  let amountMinor: number;

  try {
    amountMinor = majorToMinorAmount(amountMajor, "SAR");
  } catch (error) {
    console.error("[updateAdminPaymentPriceAction amount]", error);
    redirect(settingsUrl(locale, { price_error: "invalid_amount" }));
  }

  const adminClient = createAdminClient();

  const { data: price, error: priceError } = await adminClient
    .from("payment_prices")
    .select("id, product_id, currency, active, amount_minor")
    .eq("id", priceId)
    .maybeSingle();

  if (priceError || !price) {
    console.error("[updateAdminPaymentPriceAction price]", priceError);
    redirect(settingsUrl(locale, { price_error: "price_not_found" }));
  }

  if (!price.active || price.currency !== "SAR") {
    redirect(settingsUrl(locale, { price_error: "price_not_editable" }));
  }

  const { data: product, error: productError } = await adminClient
    .from("payment_products")
    .select("id, code, active")
    .eq("id", price.product_id)
    .maybeSingle();

  if (
    productError ||
    !product ||
    !product.active ||
    !EDITABLE_PRODUCT_CODES.has(product.code)
  ) {
    console.error("[updateAdminPaymentPriceAction product]", productError);
    redirect(settingsUrl(locale, { price_error: "product_not_editable" }));
  }

  if (Number(price.amount_minor) === amountMinor) {
    redirect(
      settingsUrl(locale, {
        price_saved: "1",
        product: product.code,
      }),
    );
  }

  const { error: updateError } = await adminClient
    .from("payment_prices")
    .update({
      amount_minor: amountMinor,
      updated_at: new Date().toISOString(),
      metadata: {
        admin_price_updated_by: adminUser.id,
        admin_price_updated_at: new Date().toISOString(),
      },
    })
    .eq("id", price.id)
    .eq("active", true);

  if (updateError) {
    console.error("[updateAdminPaymentPriceAction update]", updateError);
    redirect(settingsUrl(locale, { price_error: "update_failed" }));
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/entitlements");
  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/en/talent-dashboard");
  revalidatePath("/ar/publisher-dashboard");
  revalidatePath("/en/publisher-dashboard");

  redirect(
    settingsUrl(locale, {
      price_saved: "1",
      product: product.code,
    }),
  );
}
