import assert from "node:assert/strict";
import test from "node:test";

import {
  APPROVED_INVESTOR_GMAIL,
  assertApprovedInvestorGmail,
  normalizeInvestorGmailAddress,
} from "./account-policy.ts";

test("normalizes the approved investor Gmail address", () => {
  assert.equal(normalizeInvestorGmailAddress("  MLAMHCO@GMAIL.COM "), APPROVED_INVESTOR_GMAIL);
});

test("accepts only the approved investor Gmail account", () => {
  assert.equal(assertApprovedInvestorGmail("mlamhco@gmail.com"), APPROVED_INVESTOR_GMAIL);
  assert.throws(
    () => assertApprovedInvestorGmail("someoneelse@gmail.com"),
    /Investor Relations Gmail must be mlamhco@gmail\.com/,
  );
  assert.throws(() => assertApprovedInvestorGmail(null));
});
