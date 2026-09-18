"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
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
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: "invalid-input",
      reason: "invalid_price_id",
    });
    redirect(settingsUrl(locale, { price_error: "invalid_price" }));
  }

  if (
    !Number.isFinite(amountMajor) ||
    amountMajor < 1 ||
    amountMajor > 10000
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: priceId,
      reason: "invalid_amount",
      metadata: { requested_amount_major: amountMajor },
    });
    redirect(settingsUrl(locale, { price_error: "invalid_amount" }));
  }

  let amountMinor: number;

  try {
    amountMinor = majorToMinorAmount(amountMajor, "SAR");
  } catch (error) {
    console.error("[updateAdminPaymentPriceAction amount]", error);
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: priceId,
      reason: "amount_conversion_failed",
      metadata: { requested_amount_major: amountMajor },
    });
    redirect(settingsUrl(locale, { price_error: "invalid_amount" }));
  }

  const adminClient = createAdminClient();

  const { data: price, error: priceError } = await adminClient
    .from("payment_prices")
    .select("id, product_id, currency, active, amount_minor, metadata")
    .eq("id", priceId)
    .maybeSingle();

  if (priceError || !price) {
    console.error("[updateAdminPaymentPriceAction price]", priceError);
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "failed",
      target: EVENT_TARGETS.PAYMENT,
      targetId: priceId,
      reason: "price_not_found",
    });
    redirect(settingsUrl(locale, { price_error: "price_not_found" }));
  }

  if (!price.active || price.currency !== "SAR") {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: price.id,
      reason: "price_not_editable",
      metadata: { active: price.active, currency: price.currency },
    });
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
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: price.id,
      reason: "product_not_editable",
      metadata: { product_id: price.product_id },
    });
    redirect(settingsUrl(locale, { price_error: "product_not_editable" }));
  }

  if (Number(price.amount_minor) === amountMinor) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "noop",
      target: EVENT_TARGETS.PAYMENT,
      targetId: price.id,
      reason: "price_already_set",
      metadata: { product_code: product.code, amount_minor: amountMinor },
    });
    redirect(
      settingsUrl(locale, {
        price_saved: "1",
        product: product.code,
      }),
    );
  }

  const now = new Date().toISOString();
  const existingMetadata =
    price.metadata &&
    typeof price.metadata === "object" &&
    !Array.isArray(price.metadata)
      ? (price.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await adminClient
    .from("payment_prices")
    .update({
      amount_minor: amountMinor,
      updated_at: now,
      metadata: {
        ...existingMetadata,
        admin_price_updated_by: adminUser.id,
        admin_price_updated_at: now,
      },
    })
    .eq("id", price.id)
    .eq("active", true);

  if (updateError) {
    console.error("[updateAdminPaymentPriceAction update]", updateError);
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_payment_price",
      outcome: "failed",
      target: EVENT_TARGETS.PAYMENT,
      targetId: price.id,
      reason: "price_update_failed",
      metadata: {
        product_code: product.code,
        previous_amount_minor: Number(price.amount_minor),
        requested_amount_minor: amountMinor,
      },
    });
    redirect(settingsUrl(locale, { price_error: "update_failed" }));
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "update_payment_price",
    outcome: "success",
    target: EVENT_TARGETS.PAYMENT,
    targetId: price.id,
    metadata: {
      product_code: product.code,
      previous_amount_minor: Number(price.amount_minor),
      new_amount_minor: amountMinor,
      currency: price.currency,
    },
  });

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
