import assert from "node:assert/strict";
import test from "node:test";

import {
  getApplicationDeadline,
  isApplicationWindowClosed,
  isOpportunityAvailable,
  isValidOpportunityId,
} from "./apply-rules.ts";

test("validates opportunity ids", () => {
  assert.equal(isValidOpportunityId(1), true);
  assert.equal(isValidOpportunityId(0), false);
  assert.equal(isValidOpportunityId(-1), false);
  assert.equal(isValidOpportunityId(1.5), false);
  assert.equal(isValidOpportunityId("1"), false);
});

test("only allows published open opportunities", () => {
  assert.equal(isOpportunityAvailable({ published: true, status: "open" }), true);
  assert.equal(
    isOpportunityAvailable({ published: true, status: "published" }),
    true,
  );
  assert.equal(isOpportunityAvailable({ published: false, status: "open" }), false);
  assert.equal(isOpportunityAvailable({ published: true, status: "closed" }), false);
  assert.equal(isOpportunityAvailable(null), false);
});

test("calculates the application deadline without platform dependencies", () => {
  assert.equal(
    getApplicationDeadline("2026-09-01T00:00:00.000Z", 5)?.toISOString(),
    "2026-09-06T00:00:00.000Z",
  );
  assert.equal(getApplicationDeadline(null, 5), null);
  assert.equal(getApplicationDeadline("invalid", 5), null);
  assert.equal(getApplicationDeadline("2026-09-01T00:00:00.000Z", 0), null);
});

test("detects a closed application window", () => {
  const opportunity = {
    createdAt: "2026-09-01T00:00:00.000Z",
    applicationDays: 5,
  };

  assert.equal(
    isApplicationWindowClosed(opportunity, new Date("2026-09-05T23:59:59.000Z")),
    false,
  );
  assert.equal(
    isApplicationWindowClosed(opportunity, new Date("2026-09-06T00:00:01.000Z")),
    true,
  );
});
