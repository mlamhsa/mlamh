import assert from "node:assert/strict";
import {
  readFile,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const EXTRA_SENSITIVE_ACTION_FILES = [
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

async function actionFiles() {
  const actionsDir = path.join(
    process.cwd(),
    "lib/actions",
  );

  const entries =
    await readdir(actionsDir);

  const discovered =
    entries
      .filter((name) =>
        /^admin-.*\.ts$/.test(
          name,
        ),
      )
      .map(
        (name) =>
          `lib/actions/${name}`,
      );

  return Array.from(
    new Set([
      ...discovered,
      ...EXTRA_SENSITIVE_ACTION_FILES,
    ]),
  ).sort();
}

test("sensitive admin action files keep an explicit admin authorization gate", async () => {
  for (const file of await actionFiles()) {
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
  for (const file of await actionFiles()) {
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
