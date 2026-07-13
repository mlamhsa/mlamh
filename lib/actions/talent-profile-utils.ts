import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";

export const ALLOWED_AVAILABILITY = new Set([
  "available_now",
  "available_this_week",
  "available_next_month",
  "unavailable",
]);

export function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

export function requiredStringValue(
  formData: FormData,
  key: string
) {
  const value = stringValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export function nullableStringValue(
  formData: FormData,
  key: string
) {
  const value = stringValue(formData, key);

  return value.length > 0 ? value : null;
}

export function nullableNumberValue(
  formData: FormData,
  key: string
) {
  const value = stringValue(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

export function booleanValue(
  formData: FormData,
  key: string
) {
  const value = formData.get(key);

  return (
    value === "true" ||
    value === "1" ||
    value === "on"
  );
}

function isValidDateParts(
  year: number,
  month: number,
  day: number
) {
  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function normalizeDateValue(value: string) {
  /*
   * الصيغة القياسية القادمة من:
   * <input type="date" />
   *
   * مثال:
   * 1989-08-07
   */
  const standardDateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (standardDateMatch) {
    const year = Number(standardDateMatch[1]);
    const month = Number(standardDateMatch[2]);
    const day = Number(standardDateMatch[3]);

    if (!isValidDateParts(year, month, day)) {
      throw new Error(
        "Invalid date value. Use YYYY-MM-DD."
      );
    }

    return `${standardDateMatch[1]}-${standardDateMatch[2]}-${standardDateMatch[3]}`;
  }

  /*
   * دعم القيم المكتوبة يدويًا بصيغة:
   * DDMMYYYY
   *
   * مثال:
   * 07081989
   * تصبح:
   * 1989-08-07
   */
  const compactDateMatch = value.match(
    /^(\d{2})(\d{2})(\d{4})$/
  );

  if (compactDateMatch) {
    const day = Number(compactDateMatch[1]);
    const month = Number(compactDateMatch[2]);
    const year = Number(compactDateMatch[3]);

    if (!isValidDateParts(year, month, day)) {
      throw new Error(
        "Invalid date value. Use YYYY-MM-DD."
      );
    }

    return `${compactDateMatch[3]}-${compactDateMatch[2]}-${compactDateMatch[1]}`;
  }

  /*
   * دعم صيغة:
   * DD/MM/YYYY
   * أو:
   * DD-MM-YYYY
   */
  const separatedDateMatch = value.match(
    /^(\d{2})[/-](\d{2})[/-](\d{4})$/
  );

  if (separatedDateMatch) {
    const day = Number(separatedDateMatch[1]);
    const month = Number(separatedDateMatch[2]);
    const year = Number(separatedDateMatch[3]);

    if (!isValidDateParts(year, month, day)) {
      throw new Error(
        "Invalid date value. Use YYYY-MM-DD."
      );
    }

    return `${separatedDateMatch[3]}-${separatedDateMatch[2]}-${separatedDateMatch[1]}`;
  }

  throw new Error(
    "Invalid date format. Use YYYY-MM-DD."
  );
}

export function dateValue(
  formData: FormData,
  key: string
) {
  const value = stringValue(formData, key);

  if (!value) {
    return null;
  }

  return normalizeDateValue(value);
}

export function stringArrayValue(
  formData: FormData,
  key: string
) {
  const value = stringValue(formData, key);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0
    );
  } catch {
    return [];
  }
}

export function availabilityValue(
  formData: FormData
) {
  const value = stringValue(
    formData,
    "availability_status"
  );

  return ALLOWED_AVAILABILITY.has(value)
    ? value
    : "available_now";
}

export function getSelectedCity(
  formData: FormData
) {
  const citySlug = requiredStringValue(
    formData,
    "city_slug"
  );

  const city = SAUDI_CITIES.find(
    (item) => item.slug === citySlug
  );

  if (!city) {
    throw new Error(
      "Invalid city selected."
    );
  }

  return {
    city_slug: city.slug,
    city_ar: city.ar,
    city_en: city.en,
  };
}

export function getSelectedCategory(
  formData: FormData
) {
  const categorySlug = requiredStringValue(
    formData,
    "category_slug"
  );

  const category = TALENT_CATEGORIES.find(
    (item) => item.slug === categorySlug
  );

  if (!category) {
    throw new Error(
      "Invalid category selected."
    );
  }

  return {
    category_slug: category.slug,
    category_ar: category.ar,
    category_en: category.en,
  };
}

export function createDisplayName(
  value: string
) {
  return (
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ??
    value.trim()
  );
}

export function createSlug(
  value: string,
  id: number
) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[\`'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base
    ? `${base}-${id}`
    : `talent-${id}`;
}