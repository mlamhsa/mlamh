import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeAuditMetadata } from "./audit-sanitizer.ts";

test("redacts sensitive audit metadata recursively", () => {
  const sanitized =
    sanitizeAuditMetadata({
      action:
        "invite_admin",
      password: "secret-value",
      nested: {
        access_token:
          "token-value",
        invited_email:
          "admin@example.com",
      },
      list: [
        {
          apiKey:
            "key-value",
          role: "admin",
        },
      ],
    });

  assert.equal(
    sanitized.password,
    "[REDACTED]",
  );

  assert.deepEqual(
    sanitized.nested,
    {
      access_token:
        "[REDACTED]",
      invited_email:
        "admin@example.com",
    },
  );

  assert.deepEqual(
    sanitized.list,
    [
      {
        apiKey:
          "[REDACTED]",
        role: "admin",
      },
    ],
  );
});

test("truncates oversized audit metadata safely", () => {
  const sanitized =
    sanitizeAuditMetadata({
      note: "x".repeat(2100),
      items: Array.from(
        { length: 55 },
        (_, index) =>
          index,
      ),
    });

  assert.equal(
    typeof sanitized.note,
    "string",
  );

  assert.match(
    String(sanitized.note),
    /\[TRUNCATED\]$/,
  );

  assert.equal(
    Array.isArray(
      sanitized.items,
    ),
    true,
  );

  assert.equal(
    (
      sanitized.items as unknown[]
    ).length,
    51,
  );
});
