import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeSocialCopy } from "./social-copy.ts";

test("normalizes single-escaped line breaks", () => {
  assert.equal(
    sanitizeSocialCopy("موهبتك تستحق أن تُرى\\n\\nmlamh.net"),
    "موهبتك تستحق أن تُرى\n\nmlamh.net",
  );
});

test("normalizes double-escaped line breaks from stored JSON payloads", () => {
  assert.equal(
    sanitizeSocialCopy("موهبتك تستحق أن تُرى\\\\n\\\\nmlamh.net"),
    "موهبتك تستحق أن تُرى\n\nmlamh.net",
  );
});

test("cleans escaped punctuation and excessive blank lines", () => {
  assert.equal(
    sanitizeSocialCopy("فرصتك جاهزة\\!\\n\\n\\n  سجّل الآن"),
    "فرصتك جاهزة!\n\nسجّل الآن",
  );
});

test("preserves intentional Latin brand names and URLs", () => {
  assert.equal(
    sanitizeSocialCopy("انضم إلى MLAMH\nhttps://mlamh.net"),
    "انضم إلى MLAMH\nhttps://mlamh.net",
  );
});

test("returns undefined for non-string or empty copy", () => {
  assert.equal(sanitizeSocialCopy(null), undefined);
  assert.equal(sanitizeSocialCopy("   "), undefined);
});
