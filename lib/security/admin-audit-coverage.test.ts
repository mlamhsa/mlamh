import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ACTION_FILES = [
  "lib/actions/admin-access-actions.ts",
  "lib/actions/admin-application-actions.ts",
  "lib/actions/admin-casting-commercial.ts",
  "lib/actions/admin-casting-files.ts",
  "lib/actions/admin-casting.ts",
  "lib/actions/admin-claim-requests.ts",
  "lib/actions/admin-managed-booking.ts",
  "lib/actions/admin-managed-invitations.ts",
  "lib/actions/admin-message-actions.ts",
  "lib/actions/admin-notification-actions.ts",
  "lib/actions/admin-opportunity-actions.ts",
  "lib/actions/admin-publisher-verification.ts",
  "lib/actions/admin-scene-actions.ts",
  "lib/actions/admin-support-actions.ts",
  "lib/actions/create-admin-opportunity.ts",
  "lib/actions/create-admin-localized-opportunity.ts",
  "lib/actions/create-admin-opportunity-auto-translate.ts",
  "lib/actions/review-talent.ts",
  "lib/actions/review-talent-profile-change.ts",
  "lib/actions/update-admin-talent-status.ts",
] as const;

async function source(
  file: string,
) {
  return readFile(
    path.join(
      process.cwd(),
      file,
    ),
    "utf8",
  );
}

test("sensitive admin action files keep an explicit admin authorization gate", async () => {
  for (const file of ACTION_FILES) {
    const text = await source(file);

    const authorized =
      text.includes(
        "requireAdminAccess",
      ) ||
      text.includes(
        "requirePermission",
      );

    assert.equal(
      authorized,
      true,
      `${file} must use requireAdminAccess() or requirePermission() before privileged work`,
    );
  }
});

test("sensitive admin action files keep explicit audit instrumentation", async () => {
  for (const file of ACTION_FILES) {
    const text = await source(file);

    const audited =
      text.includes(
        "recordAdminAction",
      ) ||
      text.includes(
        "recordAdminAccessOutcome",
      );

    assert.equal(
      audited,
      true,
      `${file} must record admin action outcomes`,
    );
  }
});

test("admin access mutations keep dedicated blocked/failed/no-op audit outcomes", async () => {
  const text = await source(
    "lib/actions/admin-access-actions.ts",
  );

  for (const outcome of [
    '"blocked"',
    '"failed"',
    '"noop"',
  ]) {
    assert.equal(
      text.includes(outcome),
      true,
      `admin access actions must retain ${outcome} audit handling`,
    );
  }
});

test("platform admin audit metadata stays sanitized before persistence", async () => {
  const text = await source(
    "lib/events/create-audit-event.ts",
  );

  assert.equal(
    text.includes(
      "sanitizeAuditMetadata",
    ),
    true,
    "strict audit persistence must sanitize metadata",
  );
});
