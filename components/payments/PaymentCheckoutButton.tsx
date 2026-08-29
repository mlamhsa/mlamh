"use client";

import { useState } from "react";

import { createPaymentCheckoutAction } from "@/lib/actions/create-payment-checkout";
import type { PaymentTargetType } from "@/lib/payments/types";

type Props = {
  priceId: number;
  locale: "ar" | "en";
  marketCountry: string | null;
  target: {
    type: PaymentTargetType;
    id: string;
  };
  label: string;
};

export default function PaymentCheckoutButton({
  priceId,
  locale,
  marketCountry,
  target,
  label,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createPaymentCheckoutAction({
        priceId,
        requestKey: crypto.randomUUID(),
        marketCountry,
        locale,
        target,
      });

      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      console.error("[PaymentCheckoutButton]", checkoutError);
      setError(
        locale === "ar"
          ? "تعذر بدء عملية الدفع. حاول مرة أخرى."
          : "Unable to start checkout. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? locale === "ar"
            ? "جارٍ التحويل للدفع..."
            : "Opening checkout..."
          : label}
      </button>

      {error ? (
        <p className="mt-3 text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
