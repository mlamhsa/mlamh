const CURRENCY_EXPONENTS: Readonly<Record<string, number>> = {
  BHD: 3,
  JOD: 3,
  KWD: 3,
  OMR: 3,
};

const DEFAULT_CURRENCY_EXPONENT = 2;

export function normalizeCurrency(currency: string) {
  const normalized = currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`Invalid ISO 4217 currency code: ${currency}`);
  }

  return normalized;
}

export function getCurrencyExponent(currency: string) {
  const normalized = normalizeCurrency(currency);
  return CURRENCY_EXPONENTS[normalized] ?? DEFAULT_CURRENCY_EXPONENT;
}

export function minorToMajorAmount(amountMinor: number, currency: string) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new Error("amountMinor must be a non-negative safe integer.");
  }

  return amountMinor / 10 ** getCurrencyExponent(currency);
}

export function majorToMinorAmount(amountMajor: number, currency: string) {
  if (!Number.isFinite(amountMajor) || amountMajor < 0) {
    throw new Error("amountMajor must be a non-negative finite number.");
  }

  const multiplier = 10 ** getCurrencyExponent(currency);
  const amountMinor = Math.round((amountMajor + Number.EPSILON) * multiplier);

  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error("Converted minor amount exceeds JavaScript safe integer range.");
  }

  return amountMinor;
}

export function formatProviderAmount(amountMinor: number, currency: string) {
  const exponent = getCurrencyExponent(currency);
  return minorToMajorAmount(amountMinor, currency).toFixed(exponent);
}
