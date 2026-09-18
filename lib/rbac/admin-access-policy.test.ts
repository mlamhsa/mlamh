import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIVE_ADMIN_ACCESS_ROLES,
  hasConsistentActiveAdminRole,
  hasValidActiveAdminAssignment,
  isActiveAdminAccessRole,
  isAssignableAdminRole,
} from "./admin-access-policy.ts";

test("only Super Admin and Admin are active access roles", () => {
  assert.deepEqual(
    ACTIVE_ADMIN_ACCESS_ROLES,
    ["super_admin", "admin"],
  );

  assert.equal(
    isActiveAdminAccessRole(
      "super_admin",
    ),
    true,
  );
  assert.equal(
    isActiveAdminAccessRole("admin"),
    true,
  );
  assert.equal(
    isActiveAdminAccessRole(
      "content_manager",
    ),
    false,
  );
  assert.equal(
    isActiveAdminAccessRole(
      "moderator",
    ),
    false,
  );
  assert.equal(
    isActiveAdminAccessRole("viewer"),
    false,
  );
});

test("only active access roles can be assigned from the access center", () => {
  assert.equal(
    isAssignableAdminRole(
      "super_admin",
    ),
    true,
  );
  assert.equal(
    isAssignableAdminRole("admin"),
    true,
  );
  assert.equal(
    isAssignableAdminRole(
      "content_manager",
    ),
    false,
  );
});


test("admin registry and RBAC role must match exactly", () => {
  assert.equal(
    hasConsistentActiveAdminRole(
      "admin",
      ["admin"],
    ),
    true,
  );

  assert.equal(
    hasConsistentActiveAdminRole(
      "super_admin",
      ["super_admin"],
    ),
    true,
  );

  for (const [registry, assignments] of [
    ["admin", ["super_admin"]],
    ["super_admin", ["admin"]],
    ["admin", ["admin", "super_admin"]],
    ["admin", []],
    ["revoked", ["admin"]],
  ] as const) {
    assert.equal(
      hasConsistentActiveAdminRole(
        registry,
        [...assignments],
      ),
      false,
      `${registry} / ${assignments.join(",")} must fail closed`,
    );
  }
});


test("admin entry accepts one active RBAC role while registry remains an active/revoked gate", () => {
  assert.equal(
    hasValidActiveAdminAssignment(
      "admin",
      ["admin"],
    ),
    true,
  );

  assert.equal(
    hasValidActiveAdminAssignment(
      "admin",
      ["super_admin"],
    ),
    true,
    "legacy registry labels must not override the RBAC permission source of truth",
  );

  assert.equal(
    hasValidActiveAdminAssignment(
      "super_admin",
      ["admin"],
    ),
    true,
  );

  for (const [registry, assignments] of [
    ["revoked", ["super_admin"]],
    ["admin", []],
    ["admin", ["admin", "super_admin"]],
    ["admin", ["viewer"]],
  ] as const) {
    assert.equal(
      hasValidActiveAdminAssignment(
        registry,
        [...assignments],
      ),
      false,
    );
  }
});
