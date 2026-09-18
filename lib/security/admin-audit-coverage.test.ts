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
  "lib/actions/reactivate-entitlement.ts",
  "lib/actions/revoke-entitlement.ts",
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
        /^(admin-|create-admin-|update-admin-).*\.ts$/.test(
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

async function privilegedActionFiles() {
  const actionsDir = path.join(
    process.cwd(),
    "lib/actions",
  );

  const entries =
    await readdir(actionsDir);

  const privileged: string[] = [];

  for (const name of entries) {
    if (!name.endsWith(".ts")) {
      continue;
    }

    const file =
      `lib/actions/${name}`;
    const text =
      await source(file);

    if (
      text.includes(
        "requireAdminAccess",
      ) ||
      text.includes(
        "requirePermission",
      )
    ) {
      privileged.push(file);
    }
  }

  return privileged.sort();
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

test("every privileged server action keeps explicit audit instrumentation", async () => {
  const files =
    await privilegedActionFiles();

  assert.ok(
    files.length > 0,
    "expected at least one privileged admin server action",
  );

  const missingAudit: string[] =
    [];

  for (const file of files) {
    const text =
      await source(file);

    const audited =
      text.includes(
        "recordAdminAction",
      ) ||
      text.includes(
        "recordAdminAccessOutcome",
      );

    if (!audited) {
      missingAudit.push(file);
    }
  }

  assert.deepEqual(
    missingAudit,
    [],
    `privileged server actions missing audit instrumentation: ${missingAudit.join(", ")}`,
  );
});

async function adminApiRoutes() {
  const root = path.join(
    process.cwd(),
    "app/api/admin",
  );

  const routes: string[] = [];

  async function walk(
    directory: string,
  ) {
    const entries =
      await readdir(
        directory,
        {
          withFileTypes: true,
        },
      );

    for (const entry of entries) {
      const absolute =
        path.join(
          directory,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        await walk(absolute);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name === "route.ts"
      ) {
        routes.push(
          path.relative(
            process.cwd(),
            absolute,
          ),
        );
      }
    }
  }

  await walk(root);

  return routes.sort();
}

test("admin API routes keep explicit admin authorization and audit coverage", async () => {
  const routes =
    await adminApiRoutes();

  assert.ok(
    routes.length > 0,
    "expected at least one admin API route",
  );

  for (const file of routes) {
    const text = await source(file);

    assert.equal(
      text.includes(
        "requireAdminAccess",
      ),
      true,
      `${file} must authenticate through requireAdminAccess()`,
    );

    assert.equal(
      text.includes(
        "recordAdminAction",
      ),
      true,
      `${file} must record sensitive admin API activity`,
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


test("admin invitation lifecycle keeps activation and resend safeguards", async () => {
  const text = await source(
    "lib/actions/admin-access-actions.ts",
  );

  assert.equal(
    text.includes(
      "invite_pending_role_change",
    ),
    true,
    "pending invited admins must not be promoted before activation",
  );

  assert.equal(
    text.includes(
      "invite_access_inconsistent",
    ),
    true,
    "invite resend/cancel must fail closed when registry and RBAC assignment disagree",
  );

  assert.equal(
    text.includes(
      "admin_invite_resend",
    ) &&
      text.includes(
        "consumeServerRateLimit",
      ) &&
      text.includes(
        "invite_resend_rate_limited",
      ),
    true,
    "activation email resends must keep server-side throttling",
  );
});

test("last Super Admin protection verifies all access sources", async () => {
  const text = await source(
    "lib/actions/admin-access-actions.ts",
  );

  const start =
    text.indexOf(
      "async function countSuperAdmins",
    );
  const end =
    text.indexOf(
      "function revalidateAdminAccessPaths",
      start,
    );

  assert.ok(
    start >= 0 &&
      end > start,
    "countSuperAdmins helper must exist",
  );

  const helper =
    text.slice(
      start,
      end,
    );

  for (const sourceName of [
    "user_roles",
    "admin_users",
    "profiles",
  ]) {
    assert.equal(
      helper.includes(
        sourceName,
      ),
      true,
      `last Super Admin protection must verify ${sourceName}`,
    );
  }
});


test("sensitive admin access pages require admins view permission", async () => {
  for (const file of [
    "app/admin/admins/page.tsx",
    "app/admin/audit-log/page.tsx",
  ]) {
    const text =
      await source(file);

    assert.equal(
      text.includes(
        "requirePermission",
      ) &&
        text.includes(
          "PERMISSIONS.ADMINS_VIEW",
        ),
      true,
      `${file} must require admins.view before rendering sensitive access data`,
    );
  }
});

test("admin navigation hides sensitive destinations without admins view permission", async () => {
  const navigation = await source(
    "components/admin/layout/admin-navigation.ts",
  );

  for (const href of [
    "/admin/admins",
    "/admin/audit-log",
  ]) {
    const start =
      navigation.indexOf(
        `href: "${href}"`,
      );

    assert.ok(
      start >= 0,
      `expected navigation item for ${href}`,
    );

    const segment =
      navigation.slice(
        start,
        start + 240,
      );

    assert.equal(
      segment.includes(
        "PERMISSIONS.ADMINS_VIEW",
      ),
      true,
      `${href} must remain permission-gated in navigation`,
    );
  }

  const layout = await source(
    "app/admin/layout.tsx",
  );

  assert.equal(
    layout.includes(
      "getUserPermissions",
    ) &&
      layout.includes(
        "permissions={permissions}",
      ),
    true,
    "admin layout must pass effective permissions into desktop and mobile navigation",
  );
});


test("admin role changes require roles manage permission", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  const start =
    actions.indexOf(
      "export async function updateAdminRoleAction",
    );
  const end =
    actions.indexOf(
      "export async function revokeAdminAccessAction",
      start,
    );

  assert.ok(
    start >= 0 &&
      end > start,
    "updateAdminRoleAction must exist",
  );

  const segment =
    actions.slice(
      start,
      end,
    );

  assert.equal(
    segment.includes(
      "PERMISSIONS.ADMINS_MANAGE",
    ) &&
      segment.includes(
        "PERMISSIONS.ROLES_MANAGE",
      ) &&
      segment.includes(
        "roles_manage_permission_required",
      ),
    true,
    "admin role changes must require and audit both admin and role management permissions",
  );
});

test("access center separates roles view from admin view", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "PERMISSIONS.ROLES_VIEW",
    ) &&
      page.includes(
        "PERMISSIONS.ROLES_MANAGE",
      ) &&
      page.includes(
        "canManageRoles",
      ),
    true,
    "access center must keep role-model visibility and role mutation permissions explicit",
  );

  const controls = await source(
    "components/admin/rbac/AdminRoleControls.tsx",
  );

  assert.equal(
    controls.includes(
      "canManageRoles",
    ),
    true,
    "role controls must distinguish role changes from other admin access actions",
  );
});


test("Super Admin removal attempts are serialized before final-admin checks", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  for (const actionName of [
    "updateAdminRoleAction",
    "revokeAdminAccessAction",
  ]) {
    const start =
      actions.indexOf(
        `export async function ${actionName}`,
      );

    assert.ok(
      start >= 0,
      `${actionName} must exist`,
    );

    const nextExport =
      actions.indexOf(
        "export async function ",
        start + 24,
      );

    const segment =
      actions.slice(
        start,
        nextExport >= 0
          ? nextExport
          : undefined,
      );

    assert.equal(
      segment.includes(
        'namespace:\n            "super_admin_mutation"',
      ) &&
        segment.includes(
          'identifier:\n            "global"',
        ) &&
        segment.includes(
          "super_admin_change_busy",
        ),
      true,
      `${actionName} must serialize Super Admin removal attempts through the shared DB-backed guard`,
    );

    assert.ok(
      segment.indexOf(
        '"super_admin_mutation"',
      ) <
        segment.indexOf(
          "countSuperAdmins()",
        ),
      `${actionName} must acquire the mutation guard before counting/removing Super Admin access`,
    );
  }
});


test("admin invitation creation keeps server-side throttling", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  const start =
    actions.indexOf(
      "export async function inviteAdminAction",
    );
  const end =
    actions.indexOf(
      "export async function resendAdminInviteAction",
      start,
    );

  assert.ok(
    start >= 0 &&
      end > start,
    "inviteAdminAction must exist",
  );

  const segment =
    actions.slice(
      start,
      end,
    );

  assert.equal(
    segment.includes(
      '"admin_invite_create"',
    ) &&
      segment.includes(
        "consumeServerRateLimit",
      ) &&
      segment.includes(
        "invite_create_rate_limited",
      ),
    true,
    "admin invitation creation must remain server-side rate limited",
  );
});


test("admin entry and MFA gates require one active RBAC assignment plus an active registry", async () => {
  for (const file of [
    "lib/auth/require-admin.ts",
    "app/admin-mfa/page.tsx",
  ]) {
    const text =
      await source(file);

    assert.equal(
      text.includes(
        "hasValidActiveAdminAssignment",
      ),
      true,
      `${file} must fail closed unless the registry is active and exactly one active RBAC role is assigned`,
    );
  }
});


test("legacy admin role mismatch can be repaired without self-escalation", async () => {
  const controls = await source(
    "components/admin/rbac/AdminRoleControls.tsx",
  );

  assert.equal(
    controls.includes(
      "roleMismatch",
    ) &&
      controls.includes(
        "Sync role registry",
      ),
    true,
    "self account controls must expose only an explicit registry-sync path when RBAC and registry differ",
  );

  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  const start =
    actions.indexOf(
      "export async function updateAdminRoleAction",
    );
  const end =
    actions.indexOf(
      "export async function revokeAdminAccessAction",
      start,
    );
  const segment =
    actions.slice(
      start,
      end,
    );

  assert.equal(
    segment.includes(
      "currentRoleKey !== roleKey",
    ),
    true,
    "self role changes must remain blocked whenever the requested role differs from the effective RBAC role",
  );
});


test("legacy role registry repair does not rewrite effective RBAC assignment", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  const start =
    actions.indexOf(
      "const registryOnlySync =",
    );
  const end =
    actions.indexOf(
      "const { error: deleteError }",
      start,
    );

  assert.ok(
    start >= 0 &&
      end > start,
    "registry-only sync branch must exist before RBAC mutation",
  );

  const segment =
    actions.slice(
      start,
      end,
    );

  assert.equal(
    segment.includes(
      '.from("admin_users")',
    ) &&
      segment.includes(
        "registry_only_sync",
      ),
    true,
    "registry-only sync must update and audit the admin registry",
  );

  assert.equal(
    segment.includes(
      '.from("user_roles")',
    ),
    false,
    "registry-only sync must not rewrite the effective RBAC assignment",
  );
});


test("final Super Admin count follows effective RBAC while registry only gates active/revoked state", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  const start =
    actions.indexOf(
      "async function countSuperAdmins",
    );
  const end =
    actions.indexOf(
      "function revalidateAdminAccessPaths",
      start,
    );

  assert.ok(
    start >= 0 &&
      end > start,
    "countSuperAdmins helper must exist",
  );

  const segment =
    actions.slice(
      start,
      end,
    );

  assert.equal(
    segment.includes(
      '.eq(\n      "role_id",\n      superAdminRole.id',
    ),
    true,
    "Super Admin identity must come from the RBAC role assignment",
  );

  assert.equal(
    segment.includes(
      '.in(\n      "role",\n      [\n        ROLES.SUPER_ADMIN,\n        ROLES.ADMIN',
    ),
    true,
    "admin registry must be treated as an active/revoked gate rather than the permission source of truth",
  );
});
