import assert from "node:assert/strict";
import test from "node:test";

import {
  canTransitionApplicationStatus,
  isApplicationStatus,
  isFinalApplicationStatus,
  normalizeApplicationStatus,
  shouldCreateConversation,
} from "./status-rules.ts";

test("recognizes supported application statuses", () => {
  assert.equal(isApplicationStatus("pending"), true);
  assert.equal(isApplicationStatus("shortlisted"), true);
  assert.equal(isApplicationStatus("accepted"), true);
  assert.equal(isApplicationStatus("unknown"), false);
});

test("normalizes legacy or missing statuses to pending", () => {
  assert.equal(normalizeApplicationStatus("reviewing"), "reviewing");
  assert.equal(normalizeApplicationStatus("legacy"), "pending");
  assert.equal(normalizeApplicationStatus(null), "pending");
});

test("supports review and shortlist before final decisions", () => {
  assert.equal(canTransitionApplicationStatus("pending", "reviewing"), true);
  assert.equal(canTransitionApplicationStatus("pending", "shortlisted"), true);
  assert.equal(canTransitionApplicationStatus("reviewing", "shortlisted"), true);
  assert.equal(canTransitionApplicationStatus("shortlisted", "reviewing"), true);

  for (const current of ["pending", "reviewing", "shortlisted"] as const) {
    assert.equal(canTransitionApplicationStatus(current, "accepted"), true);
    assert.equal(canTransitionApplicationStatus(current, "rejected"), true);
  }

  assert.equal(canTransitionApplicationStatus("accepted", "shortlisted"), false);
  assert.equal(canTransitionApplicationStatus("accepted", "rejected"), false);
  assert.equal(canTransitionApplicationStatus("rejected", "accepted"), false);
});

test("only accepted applications open a conversation", () => {
  assert.equal(shouldCreateConversation("accepted"), true);
  assert.equal(shouldCreateConversation("shortlisted"), false);
  assert.equal(shouldCreateConversation("rejected"), false);
  assert.equal(shouldCreateConversation("pending"), false);
});

test("accepted and rejected are final states", () => {
  assert.equal(isFinalApplicationStatus("accepted"), true);
  assert.equal(isFinalApplicationStatus("rejected"), true);
  assert.equal(isFinalApplicationStatus("shortlisted"), false);
  assert.equal(isFinalApplicationStatus("pending"), false);
});
