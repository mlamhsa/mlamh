import test from "node:test";
import assert from "node:assert/strict";
import { MLAMH_EMAIL_SIGNATURE, withMlamhEmailSignature } from "./email-signature.ts";

test("appends the official MLAMH signature", () => {
  const result = withMlamhEmailSignature("Hello publisher");
  assert.match(result, /Hello publisher/);
  assert.match(result, /MLAMH \| ملامح/);
  assert.match(result, /hello@mlamh\.net/);
  assert.match(result, /W: mlamh\.net/);
});

test("normalizes escaped line breaks before sending", () => {
  const result = withMlamhEmailSignature("مرحبًا\\n\\nهذه رسالة تجريبية");
  assert.equal(result.includes("\\n"), false);
  assert.match(result, /مرحبًا\n\nهذه رسالة تجريبية/);
});

test("does not duplicate an existing official signature", () => {
  const signed = `Hello\n\n${MLAMH_EMAIL_SIGNATURE}`;
  assert.equal(withMlamhEmailSignature(signed), signed);
});
