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
      ) ||
        text.includes(
          "requirePermission",
        ),
      true,
      `${file} must authenticate through requireAdminAccess() or requirePermission()`,
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


test("admin invitation state is stored in server-owned app metadata", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    actions.includes(
      "app_metadata: {",
    ) &&
      actions.includes(
        "admin_invited_at",
      ) &&
      actions.includes(
        "admin_invite_status",
      ) &&
      actions.includes(
        'inviteStatus ===\n      "pending"',
      ) &&
      actions.includes(
        "user?.app_metadata",
      ),
    true,
    "admin invite lifecycle markers and pending-state decisions must use explicit server-owned app_metadata",
  );

  assert.equal(
    actions.includes(
      "user?.user_metadata",
    ) ||
      page.includes(
        ".user_metadata\n            ?.admin_invited_at",
      ),
    false,
    "pending admin invite decisions must not rely on user-editable user_metadata",
  );

  assert.equal(
    page.includes(
      ".app_metadata\n            ?.admin_invited_at",
    ) &&
      page.includes(
        ".app_metadata\n            ?.admin_invite_status",
      ) &&
      page.includes(
        'authState?.inviteStatus ===\n          "pending"',
      ),
    true,
    "access center must read the server-owned invite timestamp and explicit activation state",
  );

  const mfaRoute = await source(
    "app/api/admin/security/mfa-event/route.ts",
  );

  assert.equal(
    mfaRoute.includes(
      "admin_invite_status",
    ) &&
      mfaRoute.includes(
        '"completed"',
      ) &&
      mfaRoute.includes(
        "admin_invite_completed_at",
      ) &&
      mfaRoute.includes(
        "getAuthenticatorAssuranceLevel",
      ) &&
      mfaRoute.includes(
        '"admin_mfa_activation_recovery"',
      ) &&
      mfaRoute.includes(
        "complete_admin_invite",
      ),
    true,
    "pending admin invites must transition to completed only from the successful AAL2 MFA path",
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


test("admin MFA enrollment recovers from interrupted unverified factors", async () => {
  const gate = await source(
    "components/admin/security/AdminMfaGate.tsx",
  );

  const cleanupStart =
    gate.indexOf(
      'factor.status === "unverified"',
    );
  const unenrollStart =
    gate.indexOf(
      "supabase.auth.mfa.unenroll",
      cleanupStart,
    );
  const enrollStart =
    gate.indexOf(
      "supabase.auth.mfa.enroll",
      cleanupStart,
    );

  assert.ok(
    cleanupStart >= 0 &&
      unenrollStart > cleanupStart &&
      enrollStart > unenrollStart,
    "interrupted unverified TOTP factors must be removed before creating a fresh enrollment",
  );

  assert.equal(
    gate.includes(
      'setMode("error")',
    ),
    true,
    "MFA initialization failures must render a recoverable error state instead of an unusable challenge form",
  );
});


test("blocked admin identity-gate audit writes are server-side throttled", async () => {
  const guard = await source(
    "lib/auth/require-admin.ts",
  );

  const gateStart =
    guard.indexOf(
      '"admin_identity_gate"',
    );
  const limiterStart =
    guard.lastIndexOf(
      "consumeServerRateLimit",
      gateStart,
    );

  assert.ok(
    gateStart >= 0 &&
      limiterStart >= 0 &&
      guard.includes(
        '"admin_identity_gate_audit"',
      ),
    "blocked authenticated accounts must not be able to flood identity-gate audit events",
  );

  assert.equal(
    guard.includes(
      "redirect(ADMIN_LOGIN_PATH)",
    ),
    true,
    "identity-gate rate-limit failures must never weaken the access denial path",
  );
});


test("pending admin invites stay blocked until the AAL2 activation marker is persisted", async () => {
  const guard = await source(
    "lib/auth/require-admin.ts",
  );
  const gate = await source(
    "components/admin/security/AdminMfaGate.tsx",
  );
  const route = await source(
    "app/api/admin/security/mfa-event/route.ts",
  );

  assert.equal(
    guard.includes(
      "admin_invite_status",
    ) &&
      guard.includes(
        '"pending"',
      ) &&
      guard.includes(
        "ADMIN_MFA_PATH",
      ),
    true,
    "normal admin access must redirect pending invited identities back through MFA activation",
  );

  assert.equal(
    gate.includes(
      'mode:\n                      "activation"',
    ) &&
      gate.includes(
        "activationResponse.ok",
      ) &&
      gate.includes(
        "mfaVerified",
      ),
    true,
    "an already-AAL2 pending invite must retry activation and must not misreport a post-verification persistence failure as an MFA failure",
  );

  assert.equal(
    route.includes(
      "getAuthenticatorAssuranceLevel",
    ) &&
      route.includes(
        '"admin_mfa_activation_recovery"',
      ),
    true,
    "activation recovery must independently prove AAL2 on the server before completing the invite",
  );
});


test("admin entry and MFA gates share the centralized active-admin identity guard", async () => {
  const guard = await source(
    "lib/auth/require-admin.ts",
  );

  assert.equal(
    guard.includes(
      "hasValidActiveAdminAssignment",
    ) &&
      guard.includes(
        "requireAdminIdentityInternal",
      ) &&
      guard.includes(
        "export async function requireAdminIdentity",
      ) &&
      guard.includes(
        "export async function requireAdminAccess",
      ),
    true,
    "admin identity and full AAL2 access must share one fail-closed registry/RBAC guard",
  );

  const mfaPage = await source(
    "app/admin-mfa/page.tsx",
  );

  assert.equal(
    mfaPage.includes(
      "requireAdminIdentity",
    ),
    true,
    "MFA enrollment page must reuse the centralized pre-MFA admin identity guard",
  );
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
      "const {\n    error: roleMutationError",
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
      '"set_admin_access_role"',
    ) &&
      segment.includes(
        "p_change_reason:",
      ),
    true,
    "registry-only sync must use the same atomic database audit path as effective access mutations",
  );

  assert.equal(
    segment.includes(
      '.from("admin_users")',
    ) ||
      segment.includes(
        '.from("user_roles")',
      ),
    false,
    "registry-only sync must not perform split application-side RBAC or registry writes",
  );

  const migration = await source(
    "supabase/migrations/20260918193000_harden_admin_rbac_invariants.sql",
  );

  assert.equal(
    migration.includes(
      "v_registry_only_sync",
    ) &&
      migration.includes(
        "'sync_admin_role_registry'",
      ) &&
      migration.includes(
        "'registry_only_sync'",
      ),
    true,
    "database mutation must recognize registry-only repair and audit it transactionally without rewriting the effective RBAC role",
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


test("Super Admin privilege boundary changes require explicit confirmation", async () => {
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
      "confirm_sensitive_role",
    ) &&
      segment.includes(
        "sensitive_role_confirmation_required",
      ),
    true,
    "Super Admin promotion/demotion must require explicit server-side confirmation",
  );

  const controls = await source(
    "components/admin/rbac/AdminRoleControls.tsx",
  );

  assert.equal(
    controls.includes(
      'name="confirm_sensitive_role"',
    ) &&
      controls.includes(
        "crossesSuperAdminBoundary",
      ),
    true,
    "role controls must route Super Admin boundary changes through a confirmation dialog",
  );
});


test("admin audit CSV export escapes spreadsheet formula triggers", async () => {
  const route = await source(
    "app/api/admin/audit/export/route.ts",
  );

  for (const trigger of [
    "\\t",
    "\\r",
    "\\n",
    "\\0",
    "\\uFF1D",
    "\\uFF0B",
    "\\uFF0D",
    "\\uFF20",
  ]) {
    assert.equal(
      route.includes(trigger),
      true,
      `audit CSV sanitizer must protect ${trigger} formula/control prefixes`,
    );
  }

  assert.equal(
    route.includes(
      "formulaSafe.replaceAll",
    ),
    true,
    "audit CSV cells must continue escaping embedded quotes after formula neutralization",
  );
});


test("audit log keeps server-side pagination and exact actor scoping", async () => {
  const page = await source(
    "app/admin/audit-log/page.tsx",
  );

  assert.equal(
    page.includes(
      "const pageSize = 100",
    ) &&
      page.includes(
        ".range(",
      ) &&
      page.includes(
        'count: databaseSearchMode',
      ),
    true,
    "audit log must paginate database-backed history instead of truncating all activity to one recent window",
  );

  assert.equal(
    page.includes(
      '.eq(\n        "actor_id",\n        actorFilter',
    ) &&
      page.includes(
        "actorEmail",
      ),
    true,
    "actor activity views must keep exact server-side actor filtering and surface the resolved admin identity",
  );

  assert.equal(
    page.includes(
      "currentPage > totalPages",
    ) &&
      page.includes(
        "page: totalPages",
      ),
    true,
    "out-of-range audit pages must redirect to the final valid page",
  );
});


test("revoked registry state is treated as no active role for Super Admin restoration", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  assert.equal(
    actions.includes(
      "const currentAccessRole =",
    ) &&
      actions.includes(
        "isAssignableAdminRole(\n      targetAdmin.role",
      ),
    true,
    "server must treat revoked registry state as no active access before evaluating Super Admin confirmation",
  );

  const controls = await source(
    "components/admin/rbac/AdminRoleControls.tsx",
  );

  assert.equal(
    controls.includes(
      "registryActive",
    ) &&
      controls.includes(
        "registryActive\n        ? currentRoleKey\n        : null",
      ),
    true,
    "UI confirmation logic must treat revoked registry state as no active access",
  );
});


test("audit log time filters stay server-side and survive pagination", async () => {
  const page = await source(
    "app/admin/audit-log/page.tsx",
  );

  assert.equal(
    page.includes(
      'period === "24h"',
    ) &&
      page.includes(
        'period === "7d"',
      ) &&
      page.includes(
        'period === "30d"',
      ) &&
      page.includes(
        '.gte(\n        "created_at",\n        periodStart',
      ),
    true,
    "audit log time windows must be enforced by the database query",
  );

  assert.equal(
    page.includes(
      "period:\n                    periodFilter",
    ),
    true,
    "audit pagination must preserve the selected time window",
  );
});


test("audit history keeps supporting database indexes", async () => {
  const migration = await source(
    "supabase/migrations/20260918190000_add_admin_audit_query_indexes.sql",
  );

  for (const indexName of [
    "events_actor_created_at_idx",
    "events_target_type_created_at_idx",
    "events_event_type_created_at_idx",
    "events_target_id_created_at_idx",
  ]) {
    assert.equal(
      migration.includes(
        indexName,
      ),
      true,
      `audit query index ${indexName} must remain defined`,
    );
  }
});


test("admin audit events are append-only at the database layer", async () => {
  const migration = await source(
    "supabase/migrations/20260918191500_make_admin_audit_events_append_only.sql",
  );

  assert.equal(
    migration.includes(
      "create trigger prevent_admin_audit_event_mutation",
    ) &&
      migration.includes(
        "before update or delete",
      ) &&
      migration.includes(
        "left(old.event_type, 6) = 'admin_'",
      ) &&
      migration.includes(
        "left(new.event_type, 6) = 'admin_'",
      ),
    true,
    "admin_* audit rows must remain append-only for runtime update/delete attempts",
  );

  assert.equal(
    migration.includes(
      "revoke all",
    ) &&
      migration.includes(
        "service_role",
      ),
    true,
    "audit mutation trigger function must not be directly executable by application roles",
  );

  assert.equal(
    migration.includes(
      "security invoker",
    ) &&
      migration.includes(
        "set search_path = ''",
      ),
    true,
    "append-only trigger must not carry unnecessary definer privileges or a mutable search path",
  );
});


test("audit CSV export is permission-gated, rate-limited, audited, and formula-safe", async () => {
  const route = await source(
    "app/api/admin/audit/export/route.ts",
  );

  assert.equal(
    route.includes(
      "PERMISSIONS.ADMINS_VIEW",
    ) &&
      route.includes(
        "requirePermission",
      ),
    true,
    "audit export must require admins.view permission",
  );

  assert.equal(
    route.includes(
      '"admin_audit_export"',
    ) &&
      route.includes(
        "consumeServerRateLimit",
      ) &&
      route.includes(
        "audit_export_rate_limited",
      ),
    true,
    "audit export must remain server-side rate limited",
  );

  assert.equal(
    route.includes(
      "recordAdminAction",
    ) &&
      route.includes(
        '"export_admin_audit_log"',
      ),
    true,
    "audit export must record export activity",
  );

  assert.equal(
    route.includes(
      "/^[=+\\-@\\t\\r\\n\\0\\uFF1D\\uFF0B\\uFF0D\\uFF20]/u",
    ) &&
      route.includes(
        '"Cache-Control":\n          "private, no-store"',
      ) &&
      route.includes(
        '"X-Content-Type-Options":\n          "nosniff"',
      ),
    true,
    "audit CSV must protect against formula injection and unsafe caching",
  );

  assert.equal(
    route.includes(
      "const EXPORT_LIMIT = 5000",
    ) &&
      route.includes(
        "X-MLAMH-Audit-Truncated",
      ) &&
      route.includes(
        "export_truncated",
      ),
    true,
    "audit export must keep an explicit row cap and disclose truncation to both the response and audit record",
  );
});


test("access center surfaces Super Admin redundancy health", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "effectiveSuperAdminCount",
    ) &&
      page.includes(
        "Only one effective Super Admin is available",
      ) &&
      page.includes(
        "No effective Super Admin detected",
      ),
    true,
    "access center must surface effective Super Admin redundancy and lockout risk",
  );
});


test("access center surfaces stale pending admin invitations", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "STALE_ADMIN_INVITE_MS",
    ) &&
      page.includes(
        "staleInviteCount",
      ) &&
      page.includes(
        'value="stale"',
      ) &&
      page.includes(
        "Stale pending invite",
      ),
    true,
    "pending admin invitations older than the operational threshold must be visible and filterable",
  );
});


test("admin MFA success and failed verification attempts are audited at the correct assurance level", async () => {
  const route = await source(
    "app/api/admin/security/mfa-event/route.ts",
  );

  assert.equal(
    route.includes(
      "requireAdminIdentity",
    ) &&
      route.includes(
        "requireAdminAccess",
      ) &&
      route.includes(
        '"admin_mfa_enrolled"',
      ) &&
      route.includes(
        '"admin_mfa_verified"',
      ) &&
      route.includes(
        '"admin_mfa_verification_failed"',
      ) &&
      route.includes(
        '"admin_mfa_failed_audit"',
      ) &&
      route.includes(
        '"failed_mfa_event_after_aal2"',
      ),
    true,
    "MFA audit endpoint must accept pre-AAL2 failure telemetry, reject bogus post-AAL2 failures, and require AAL2 for successful verification records",
  );

  const gate = await source(
    "components/admin/security/AdminMfaGate.tsx",
  );

  assert.equal(
    gate.includes(
      '"/api/admin/security/mfa-event"',
    ) &&
      gate.includes(
        'outcome:\n                  "success"',
      ) &&
      gate.includes(
        'outcome:\n                "failed"',
      ),
    true,
    "MFA client must report both successful and failed verification outcomes",
  );
});


test("access center surfaces recent failed MFA activity without secret material", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "failedMfaAttempts24h",
    ) &&
      page.includes(
        '"admin_mfa_verification_failed"',
      ) &&
      page.includes(
        "failed MFA verification attempt",
      ),
    true,
    "access center must surface failed admin MFA activity from the audit stream",
  );

  assert.equal(
    page.includes(
      "Verification codes and MFA secrets are never stored",
    ),
    true,
    "MFA health messaging must explicitly confirm secret values are not persisted in audit data",
  );
});


test("access center surfaces dormant active admin accounts", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "DORMANT_ADMIN_MS",
    ) &&
      page.includes(
        "dormantAdminCount",
      ) &&
      page.includes(
        'value="dormant"',
      ) &&
      page.includes(
        "Dormant admin",
      ),
    true,
    "active admin accounts with 90-day sign-in inactivity must be visible and filterable",
  );
});


test("access-center recent security timeline includes generic admin audit outcomes", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  for (const eventType of [
    "admin_action_success",
    "admin_action_blocked",
    "admin_action_failed",
    "admin_action_noop",
  ]) {
    assert.equal(
      page.includes(
        `"${eventType}"`,
      ),
      true,
      `recent admin access timeline must include ${eventType}`,
    );
  }
});


test("admin logout lifecycle is audited before session teardown", async () => {
  const route = await source(
    "app/api/admin/security/logout-event/route.ts",
  );

  assert.equal(
    route.includes(
      "requireAdminAccess",
    ) &&
      route.includes(
        '"admin_logout_requested"',
      ) &&
      route.includes(
        '"admin_logout_failed"',
      ) &&
      route.includes(
        "recordAdminAction",
      ),
    true,
    "admin logout audit endpoint must require AAL2 admin access and record requested/failed outcomes",
  );

  const button = await source(
    "components/admin/AdminLogoutButton.tsx",
  );

  assert.ok(
    button.indexOf(
      'outcome:\n              "requested"',
    ) <
      button.indexOf(
        "supabase.auth.signOut()",
      ),
    "logout request must be audited before the browser session is destroyed",
  );

  assert.equal(
    button.includes(
      'outcome:\n                "failed"',
    ),
    true,
    "failed browser sign-out must be reported while the admin session is still available",
  );
});


test("access health alerts provide direct remediation paths", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  for (const fragment of [
    "status=stale",
    "status=dormant",
    "status=inconsistent",
    "admin_mfa_verification_failed",
  ]) {
    assert.equal(
      page.includes(fragment),
      true,
      `access health alert must keep remediation path for ${fragment}`,
    );
  }
});


test("authenticated admin identity-gate failures are audited and surfaced", async () => {
  const guard = await source(
    "lib/auth/require-admin.ts",
  );

  assert.equal(
    guard.includes(
      '"admin_identity_gate"',
    ) &&
      guard.includes(
        "profile_not_admin",
      ) &&
      guard.includes(
        "admin_registry_missing",
      ) &&
      guard.includes(
        "invalid_admin_role_assignment",
      ) &&
      guard.includes(
        "EVENT_TARGETS.AUTH_USER",
      ),
    true,
    "authenticated users that fail the admin identity gate must produce a non-secret audit event",
  );

  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "blockedIdentityGateAttempts24h",
    ) &&
      page.includes(
        "admin_identity_gate",
      ) &&
      page.includes(
        "target=auth_user",
      ),
    true,
    "access center must surface and link to recent invalid admin identity attempts",
  );
});


test("access center shows a 24-hour security health summary", async () => {
  const page = await source(
    "app/admin/admins/page.tsx",
  );

  assert.equal(
    page.includes(
      "securityAlerts24h",
    ) &&
      page.includes(
        "24h security alerts",
      ) &&
      page.includes(
        "blockedIdentityGateAttempts24h",
      ) &&
      page.includes(
        "failedMfaAttempts24h",
      ),
    true,
    "access center must aggregate recent access, MFA, and identity-gate security signals",
  );
});


test("database enforces one admin role per user and valid registry states", async () => {
  const migration = await source(
    "supabase/migrations/20260918193000_harden_admin_rbac_invariants.sql",
  );

  assert.equal(
    migration.includes(
      "admin_users_role_allowed_check",
    ) &&
      migration.includes(
        "'admin'",
      ) &&
      migration.includes(
        "'super_admin'",
      ) &&
      migration.includes(
        "'revoked'",
      ),
    true,
    "admin registry must reject unsupported role-state values",
  );

  assert.equal(
    migration.includes(
      "user_roles_single_role_per_user_idx",
    ) &&
      migration.includes(
        "unique index",
      ),
    true,
    "database must prevent multiple RBAC role assignments for the same user",
  );
});


test("admin access mutations are atomic and final-Super-Admin safe in PostgreSQL", async () => {
  const migration = await source(
    "supabase/migrations/20260918193000_harden_admin_rbac_invariants.sql",
  );
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  for (const invariant of [
    "set_admin_access_role",
    "pg_advisory_xact_lock",
    "LAST_SUPER_ADMIN",
    "ADMIN_ACCESS_PERMISSION_DENIED",
    "ADMIN_ROLE_PERMISSION_DENIED",
    "delete from public.user_roles",
    "update public.admin_users",
    "insert into public.events",
    "atomic_access_mutation",
    "security invoker",
    "grant execute",
    "service_role",
  ]) {
    assert.equal(
      migration.includes(invariant),
      true,
      `atomic admin access migration must keep ${invariant}`,
    );
  }

  assert.equal(
    actions.includes(
      'adminClient.rpc(\n    "set_admin_access_role"',
    ),
    true,
    "admin role changes and revocations must use the atomic database mutation",
  );

  assert.equal(
    actions.includes(
      "atomic_role_update_failed",
    ) &&
      actions.includes(
        "atomic_revoke_failed",
      ) &&
      actions.includes(
        "LAST_SUPER_ADMIN",
      ) &&
      actions.includes(
        "p_change_reason",
      ),
    true,
    "application actions must fail closed, pass the validated justification, and preserve a specific final-Super-Admin outcome when the database guard blocks a mutation",
  );

  for (const actionName of [
    "updateAdminRoleAction",
    "revokeAdminAccessAction",
  ]) {
    const start =
      actions.indexOf(
        `export async function ${actionName}`,
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
    const rpcStart =
      segment.indexOf(
        '"set_admin_access_role"',
      );

    assert.ok(
      rpcStart >= 0,
      `${actionName} must call the atomic mutation RPC`,
    );

    const afterRpc =
      segment.slice(rpcStart);

    assert.equal(
      afterRpc.includes(
        "createAuditEvent({",
      ),
      false,
      `${actionName} must not create a duplicate best-effort success audit after the transactional audit has committed`,
    );
  }
});


test("sensitive role changes and revocations require human justification", async () => {
  const actions = await source(
    "lib/actions/admin-access-actions.ts",
  );

  assert.equal(
    actions.includes(
      "sensitive_role_reason_required",
    ) &&
      actions.includes(
        "revoke_reason_required",
      ) &&
      actions.includes(
        "change_reason",
      ),
    true,
    "sensitive admin access changes must require and audit a bounded human justification",
  );

  const controls = await source(
    "components/admin/rbac/AdminRoleControls.tsx",
  );

  assert.equal(
    controls.includes(
      'name="change_reason"',
    ) &&
      controls.includes(
        "minLength={5}",
      ) &&
      controls.includes(
        "maxLength={300}",
      ),
    true,
    "sensitive access dialogs must collect the bounded justification before submission",
  );
});


test("audit cards surface human justification for sensitive access changes", async () => {
  const card = await source(
    "components/admin/system/AuditCard.tsx",
  );

  assert.equal(
    card.includes(
      '"change_reason"',
    ) &&
      card.includes(
        "Change justification",
      ),
    true,
    "sensitive access-change justification must be visible without opening raw metadata",
  );
});


test("free-text audit export matches the UI recent-event search window", async () => {
  const route = await source(
    "app/api/admin/audit/export/route.ts",
  );

  assert.equal(
    route.includes(
      "const freeTextSearch =",
    ) &&
      route.includes(
        "freeTextSearch\n      ? 500\n      : EXPORT_LIMIT",
      ),
    true,
    "free-text CSV export must remain scoped to the same latest-500-event window disclosed by the audit UI",
  );
});


test("admin dashboard surfaces the Access Center only with admins view permission", async () => {
  const page = await source(
    "app/admin/page.tsx",
  );

  assert.equal(
    page.includes(
      "PERMISSIONS.ADMINS_VIEW",
    ) &&
      page.includes(
        "canViewAdminAccess",
      ) &&
      page.includes(
        "[AdminDashboard access permission]",
      ) &&
      page.includes(
        "Admins & Access Center",
      ) &&
      page.includes(
        '"/admin/admins"',
      ) &&
      page.includes(
        '"/admin/audit-log"',
      ),
    true,
    "admin dashboard must expose the Access Center and audit log only to admins.view holders",
  );
});
