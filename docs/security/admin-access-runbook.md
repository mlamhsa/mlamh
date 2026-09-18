# MLAMH Admin Access Security Runbook

This runbook documents the operational rules for MLAMH administrator access, MFA, RBAC, audit history, and recovery.

## 1. Source of truth

Administrator access requires all of the following:

1. A valid authenticated user.
2. `profiles.account_type = admin`.
3. A present and active `admin_users` registry row.
4. Exactly one active RBAC assignment in `user_roles`.
5. An AAL2 session for entry to the admin console.

RBAC is the permission source of truth. The `admin_users.role` value is the active/revoked registry gate and may be synchronized to the effective RBAC role when legacy data differs.

Do not grant or restore admin access by editing only one of these layers.

## 2. Live roles

The currently live assignable roles are:

- `super_admin`
- `admin`

Prepared roles such as `content_manager`, `moderator`, and `viewer` must remain non-assignable until granular route/action enforcement is complete for their intended permission scope.

## 3. Least privilege

Use the smallest role that supports the administrator's operational duties.

The following permissions are deliberately separated:

- `admins.view`: view the access center and full audit log.
- `admins.manage`: manage administrator access lifecycle.
- `roles.view`: view the role/permission model.
- `roles.manage`: change or restore administrator roles.

Changing an administrator role requires both administrator-management and role-management authority.

## 4. Super Admin safeguards

Never intentionally operate with zero effective Super Admins.

Maintain at least two verified Super Admin accounts for administrative continuity when possible.

The application protects the final effective Super Admin from demotion or revocation. Super Admin removal attempts are serialized before the final-admin count to reduce concurrent lockout races.

Crossing the Super Admin privilege boundary requires explicit confirmation for:

- Admin → Super Admin.
- Super Admin → Admin.
- Restoring a revoked/unassigned identity directly as Super Admin.

Do not bypass these controls with direct database edits during normal operations.

## 5. Invitations

New administrator invitations:

- Are server-side rate limited.
- Remain pending until the administrator completes password setup and MFA.
- Cannot be promoted while still pending.
- Must have consistent registry and RBAC state before resend/cancel operations proceed.
- Are surfaced as stale after seven days without activation.

For a stale invitation, either resend activation if access is still required or cancel it if the identity is no longer needed.

## 6. MFA

Admin console access requires AAL2.

The system audits:

- MFA enrollment success.
- MFA verification success.
- MFA verification failure.

Failed MFA telemetry is allowed before AAL2 only after the account passes the centralized admin-identity gate. Failure telemetry is rate limited and is rejected after the session is already AAL2.

Never store or copy the TOTP secret, QR value, one-time verification code, refresh token, access token, cookie, or password into audit metadata, tickets, screenshots, or support notes.

## 7. Dormant administrators

An active administrator with no sign-in for 90 days or more is surfaced as dormant.

Review dormant accounts regularly. If continued access is not justified, revoke access instead of leaving unused administrative privileges active.

## 8. Role-registry mismatch

A legacy account may have an active RBAC role that differs from `admin_users.role`.

The Access Center surfaces this explicitly as an access-role mismatch.

Use the safe registry synchronization path. Registry-only repair updates `admin_users.role` to the already-effective RBAC role and deliberately does not delete/reinsert `user_roles`.

Do not use mismatch repair to escalate privileges.

## 9. Audit history

Security-sensitive administrator actions should use the centralized admin audit helpers.

Admin audit metadata is sanitized before persistence. Sensitive credential/token fields must remain excluded.

The full audit view supports:

- Actor filtering.
- Target filtering.
- Event filtering.
- Time ranges.
- Server-side pagination.
- Permission-gated CSV export.

Free-text metadata search is intentionally bounded to a recent window and is labeled accordingly.

CSV export is permission gated, rate limited, audited, capped, no-store, and formula-injection protected.

## 10. Append-only admin audit events

The branch includes a migration that makes `admin_*` event rows append-only at the database layer.

Runtime UPDATE or DELETE attempts against those rows fail closed. Inserts remain allowed.

Do not remove or weaken this trigger for convenience. If a future legal retention requirement requires a different policy, implement that change through an explicit reviewed migration.

## 11. Admin logout

Admin logout requests are audited before browser-session teardown. Browser sign-out failures are also reported while the AAL2 session is still available.

Do not move logout auditing after session destruction because the server can no longer reliably attribute the event afterward.

## 12. Invalid admin access attempts

Authenticated users who fail the admin identity gate are audited with non-secret reasons such as:

- Profile is not an admin.
- Admin registry is missing.
- Active RBAC assignment is invalid.
- Required access-state lookup failed.

Unauthenticated traffic is redirected to login and cannot be attributed to an authenticated actor.

## 13. Incident response

If suspicious admin activity appears:

1. Review the Access Center security alerts.
2. Open the actor-focused Audit Log.
3. Check recent failed MFA and blocked identity-gate activity.
4. Verify the administrator's current RBAC assignment and registry state.
5. Revoke access if the identity should no longer be trusted.
6. Preserve the append-only audit history.
7. Rotate credentials or MFA factors through the identity provider if compromise is suspected.
8. Review adjacent privileged actions performed by the actor before and after the suspicious event.
9. Record the incident outcome outside the platform if organizational policy requires it.

Do not delete audit rows to "clean up" an incident.

## 14. Recovery / break-glass

If an administrator cannot access the console:

1. Determine whether the failure is authentication, MFA, registry, RBAC, or profile-related.
2. Prefer normal invitation, role-management, MFA-recovery, and registry-sync paths.
3. Do not demote or revoke the last effective Super Admin.
4. Do not create ad-hoc prepared roles to recover access.
5. Do not disable MFA globally.
6. Do not directly modify Production unless an approved recovery procedure requires it.

If direct Production repair is ever unavoidable, use the smallest possible audited change, verify the effective RBAC state immediately afterward, and restore normal application-managed access control.

## 15. Deployment checklist

Before deploying changes to administrator access:

- Security tests pass.
- CodeQL passes.
- Secret scan passes.
- Production build passes.
- Vercel preview is healthy.
- No unresolved review threads remain.
- New migrations have been reviewed for idempotency and rollback implications.
- No Production mutation has been performed unintentionally.
- The final effective Super Admin cannot be locked out by the change.
