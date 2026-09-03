import assert from "node:assert/strict";
import test from "node:test";

import { isRestrictedAccountStatus } from "./account-rules.ts";

test("recognizes restricted account statuses", () => {
  for (const status of ["suspended", "blocked", "banned", "disabled"]) {
    assert.equal(isRestrictedAccountStatus(status), true);
  }

  assert.equal(isRestrictedAccountStatus("active"), false);
  assert.equal(isRestrictedAccountStatus(null), false);
  assert.equal(isRestrictedAccountStatus(undefined), false);
});
