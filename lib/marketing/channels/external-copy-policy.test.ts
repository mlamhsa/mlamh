import test from "node:test";
import assert from "node:assert/strict";

import {
  assertExternalMarketingCopyPolicy,
  containsLiveTalentCountClaim,
  normalizeExternalCopy,
} from "./external-copy-policy";

test("normalizes escaped line breaks before external delivery", () => {
  assert.equal(normalizeExternalCopy("سطر أول\\n\\nسطر ثان"), "سطر أول\n\nسطر ثان");
});

test("blocks live talent count claims in Arabic copy", () => {
  assert.equal(containsLiveTalentCountClaim("لدينا الآن 28 موهبة مسجلة"), true);
  assert.equal(containsLiveTalentCountClaim("25 تسجيل موهبة جديدة"), true);
  assert.equal(containsLiveTalentCountClaim("لدينا ٢٨ موهبة مسجلة"), true);
  assert.throws(() => assertExternalMarketingCopyPolicy("أكثر من 33 موهبة على ملامح"), /live_talent_count_must_remain_internal/);
});

test("allows value-led copy without weak scale claims", () => {
  assert.equal(
    assertExternalMarketingCopyPolicy("ملامح تربط الممثلين والمودلز بأصحاب الفرص عبر مسار أوضح للكاستينغ."),
    "ملامح تربط الممثلين والمودلز بأصحاب الفرص عبر مسار أوضح للكاستينغ.",
  );
});
