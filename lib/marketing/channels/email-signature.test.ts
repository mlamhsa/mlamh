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

test("does not duplicate an existing official signature", () => {
  const signed = `Hello\n\n${MLAMH_EMAIL_SIGNATURE}`;
  assert.equal(withMlamhEmailSignature(signed), signed);
});
