import test from "node:test";
import assert from "node:assert/strict";

import {
  formatRecoveryItems,
  resolveTalentCommunicationLocale,
} from "./recovery-communication.ts";

test("uses the talent's stored Arabic communication preference", () => {
  assert.equal(
    resolveTalentCommunicationLocale({ preferred_locale: "ar" }),
    "ar",
  );
  assert.equal(
    resolveTalentCommunicationLocale({ preferred_locale: "ar-SA" }),
    "ar",
  );
});

test("uses the talent's stored English communication preference", () => {
  assert.equal(
    resolveTalentCommunicationLocale({ preferred_locale: "en" }),
    "en",
  );
  assert.equal(
    resolveTalentCommunicationLocale({ preferred_locale: "en-US" }),
    "en",
  );
});

test("legacy accounts without a preference fall back to bilingual communication", () => {
  assert.equal(resolveTalentCommunicationLocale(undefined), "bilingual");
  assert.equal(resolveTalentCommunicationLocale({}), "bilingual");
  assert.equal(
    resolveTalentCommunicationLocale({ preferred_locale: "ur" }),
    "bilingual",
  );
});

test("legacy Arabic requirement labels are translated for English reminders", () => {
  assert.deepEqual(
    formatRecoveryItems(
      ["الصورة الشخصية", "الموافقة على دقة البيانات والتواصل"],
      "en",
    ),
    ["Profile photo", "Data accuracy and contact consent"],
  );
});

test("bilingual reminders contain both labels without guessing from profile data", () => {
  assert.deepEqual(
    formatRecoveryItems(
      [{ ar: "الصورة الشخصية", en: "Profile photo" }],
      "bilingual",
    ),
    ["Profile photo — الصورة الشخصية"],
  );
});
