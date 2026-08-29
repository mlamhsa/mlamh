import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PurchasableCatalogItem = {
  productId: number;
  productCode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  priceId: number;
  priceCode: string;
  currency: string;
  amountMinor: number;
  marketCountry: string | null;
  durationDays: number | null;
};

function isCommerciallyReady(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return (metadata as Record<string, unknown>).commercial_ready === true;
}

function getDurationDays(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const entitlement = (metadata as Record<string, unknown>).entitlement;
  if (!entitlement || typeof entitlement !== "object" || Array.isArray(entitlement)) {
    return null;
  }

  const value = (entitlement as Record<string, unknown>).duration_days;
  const durationDays = Number(value);

  return Number.isSafeInteger(durationDays) && durationDays > 0
    ? durationDays
    : null;
}

function areLivePaymentsReady() {
  const secretKey = process.env.TAP_SECRET_KEY?.trim() ?? "";
  return (
    process.env.PAYMENTS_LIVE_ENABLED === "true" &&
    secretKey.startsWith("sk_live_")
  );
}

export async function getPurchasableCatalogItem(
  productCode: string,
  marketCountry: string | null,
): Promise<PurchasableCatalogItem | null> {
  const adminClient = createAdminClient();
  const { data: product, error: productError } = await adminClient
    .from("payment_products")
    .select(
      "id, code, name_ar, name_en, description_ar, description_en, active, metadata",
    )
    .eq("code", productCode)
    .maybeSingle();

  if (productError) {
    throw new Error(`Unable to load payment product: ${productError.message}`);
  }

  if (
    !product ||
    product.active !== true ||
    !isCommerciallyReady(product.metadata)
  ) {
    return null;
  }

  if (!areLivePaymentsReady()) {
    return null;
  }

  let priceQuery = adminClient
    .from("payment_prices")
    .select(
      "id, code, currency, amount_minor, market_country, active, billing_type, valid_from, valid_until",
    )
    .eq("product_id", product.id)
    .eq("active", true)
    .eq("billing_type", "one_time")
    .order("created_at", { ascending: false })
    .limit(1);

  if (marketCountry) {
    priceQuery = priceQuery.or(
      `market_country.eq.${marketCountry},market_country.is.null`,
    );
  } else {
    priceQuery = priceQuery.is("market_country", null);
  }

  const { data: prices, error: priceError } = await priceQuery;
  if (priceError) {
    throw new Error(`Unable to load payment price: ${priceError.message}`);
  }

  const now = Date.now();
  const price = (prices ?? []).find((candidate) => {
    if (candidate.active !== true) return false;
    if (candidate.valid_from && Date.parse(candidate.valid_from) > now) return false;
    if (candidate.valid_until && Date.parse(candidate.valid_until) <= now) return false;
    return true;
  });

  if (!price) return null;

  return {
    productId: Number(product.id),
    productCode: String(product.code),
    nameAr: String(product.name_ar),
    nameEn: String(product.name_en),
    descriptionAr: product.description_ar ? String(product.description_ar) : null,
    descriptionEn: product.description_en ? String(product.description_en) : null,
    priceId: Number(price.id),
    priceCode: String(price.code),
    currency: String(price.currency),
    amountMinor: Number(price.amount_minor),
    marketCountry: price.market_country ? String(price.market_country) : null,
    durationDays: getDurationDays(product.metadata),
  };
}
