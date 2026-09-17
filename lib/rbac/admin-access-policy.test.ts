import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIVE_ADMIN_ACCESS_ROLES,
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
