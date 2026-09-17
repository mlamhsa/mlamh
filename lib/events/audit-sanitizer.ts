const SENSITIVE_KEY_PATTERN =
  /(password|passcode|secret|token|authorization|cookie|otp|api[_-]?key|access[_-]?token|refresh[_-]?token|temporary[_-]?password)/i;

const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 100;
const MAX_STRING_LENGTH = 2000;

function sanitizeValue(
  value: unknown,
  depth: number,
): unknown {
  if (depth > MAX_DEPTH) {
    return "[TRUNCATED_DEPTH]";
  }

  if (typeof value === "string") {
    return value.length >
      MAX_STRING_LENGTH
      ? `${value.slice(
          0,
          MAX_STRING_LENGTH,
        )}…[TRUNCATED]`
      : value;
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) =>
        sanitizeValue(
          item,
          depth + 1,
        ),
      );

    if (
      value.length >
      MAX_ARRAY_ITEMS
    ) {
      items.push(
        `[+${value.length - MAX_ARRAY_ITEMS} ITEMS TRUNCATED]`,
      );
    }

    return items;
  }

  if (
    typeof value === "object"
  ) {
    const entries =
      Object.entries(
        value as Record<
          string,
          unknown
        >,
      ).slice(
        0,
        MAX_OBJECT_KEYS,
      );

    const result: Record<
      string,
      unknown
    > = {};

    for (const [key, nestedValue] of entries) {
      result[key] =
        SENSITIVE_KEY_PATTERN.test(
          key,
        )
          ? "[REDACTED]"
          : sanitizeValue(
              nestedValue,
              depth + 1,
            );
    }

    if (
      Object.keys(
        value as Record<
          string,
          unknown
        >,
      ).length >
      MAX_OBJECT_KEYS
    ) {
      result.__truncated_keys =
        true;
    }

    return result;
  }

  return String(value);
}

export function sanitizeAuditMetadata(
  metadata: Record<
    string,
    unknown
  >,
) {
  return sanitizeValue(
    metadata,
    0,
  ) as Record<string, unknown>;
}
