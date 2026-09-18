import Link from "next/link";

import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  History,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import { AdminInviteDialog } from "@/components/admin/rbac/AdminInviteDialog";
import { AdminRoleControls } from "@/components/admin/rbac/AdminRoleControls";
import {
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { requirePermission } from "@/lib/rbac/guards";
import {
  hasConsistentActiveAdminRole,
  isAssignableAdminRole,
} from "@/lib/rbac/admin-access-policy";
import { getUserPermissions } from "@/lib/rbac/helpers";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
    access_saved?: string;
    access_revoked?: string;
    access_invited?: string;
    access_resent?: string;
    access_cancelled?: string;
    access_synced?: string;
    access_error?: string;
    q?: string;
    status?: string;
  }>;
};

type AdminUserRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

type RoleRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

type PermissionRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  group_name: string;
};

type RolePermissionRow = {
  role_id: number;
  permission_id: number;
};

type UserRoleRow = {
  user_id: string;
  role_id: number;
};

type AccessEventRow = {
  id: number;
  event_type: string;
  target_id: string | null;
  actor_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const ROLE_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  super_admin: {
    ar: "مدير أعلى",
    en: "Super Admin",
  },
  admin: {
    ar: "مدير",
    en: "Admin",
  },
  content_manager: {
    ar: "مدير المحتوى",
    en: "Content Manager",
  },
  moderator: {
    ar: "مشرف",
    en: "Moderator",
  },
  viewer: {
    ar: "مشاهد",
    en: "Viewer",
  },
};

const ROLE_DESCRIPTIONS: Record<
  string,
  { ar: string; en: string }
> = {
  super_admin: {
    ar: "وصول كامل إلى جميع أقسام الإدارة، بما فيها إدارة المشرفين والصلاحيات الحساسة.",
    en: "Full access to every admin area, including administrator and sensitive permission management.",
  },
  admin: {
    ar: "وصول إداري تشغيلي واسع دون صلاحية إدارة المشرفين أو تغيير نموذج الوصول.",
    en: "Broad operational admin access without administrator management or access-model changes.",
  },
  content_manager: {
    ar: "مخصص لإدارة المحتوى العام. التعيين غير مفعّل حتى اكتمال الحماية الدقيقة لجميع المسارات.",
    en: "Prepared for public content management. Assignment stays disabled until granular route enforcement is complete.",
  },
  moderator: {
    ar: "مخصص للمراجعة والإشراف التشغيلي. التعيين غير مفعّل حتى اكتمال الحماية الدقيقة.",
    en: "Prepared for moderation workflows. Assignment stays disabled until granular enforcement is complete.",
  },
  viewer: {
    ar: "دور قراءة فقط مخطط له. التعيين غير مفعّل حتى اكتمال الحماية الدقيقة.",
    en: "Prepared read-only role. Assignment stays disabled until granular enforcement is complete.",
  },
};

const GROUP_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  admin: {
    ar: "لوحة الإدارة",
    en: "Admin",
  },
  site_management: {
    ar: "إدارة الموقع",
    en: "Site Management",
  },
  cms: {
    ar: "المحتوى وCMS",
    en: "Content & CMS",
  },
  rbac: {
    ar: "الأدوار والصلاحيات",
    en: "Roles & Permissions",
  },
  marketing: {
    ar: "التسويق",
    en: "Marketing",
  },
};

export const metadata = {
  title: "Admins & Roles — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STALE_ADMIN_INVITE_MS =
  7 * 24 * 60 * 60 * 1000;

function formatRoleKey(
  roleKey: string,
  isArabic: boolean,
) {
  const label = ROLE_LABELS[roleKey];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return roleKey
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatGroupName(
  groupName: string,
  isArabic: boolean,
) {
  const label = GROUP_LABELS[groupName];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return groupName
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatDate(
  value: string,
  isArabic: boolean,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-SA-u-nu-latn"
      : "en-US",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function formatDateTime(
  value: string,
  isArabic: boolean,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-SA-u-nu-latn"
      : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getAccessEventLabel(
  eventType: string,
  isArabic: boolean,
) {
  if (eventType === "admin_invited") {
    return isArabic
      ? "دعوة مشرف"
      : "Admin invited";
  }

  if (
    eventType ===
    "admin_invite_resent"
  ) {
    return isArabic
      ? "إعادة إرسال التفعيل"
      : "Activation resent";
  }

  if (
    eventType ===
    "admin_invite_cancelled"
  ) {
    return isArabic
      ? "إلغاء دعوة مشرف"
      : "Admin invite cancelled";
  }

  if (
    eventType ===
    "admin_access_action_blocked"
  ) {
    return isArabic
      ? "إجراء إداري محظور"
      : "Admin action blocked";
  }

  if (
    eventType ===
    "admin_access_action_failed"
  ) {
    return isArabic
      ? "فشل إجراء إداري"
      : "Admin action failed";
  }

  if (
    eventType ===
    "admin_access_action_noop"
  ) {
    return isArabic
      ? "إجراء بلا تغيير"
      : "Admin action no-op";
  }

  if (
    eventType ===
    "admin_role_changed"
  ) {
    return isArabic
      ? "تغيير الدور"
      : "Role changed";
  }

  if (
    eventType ===
    "admin_access_revoked"
  ) {
    return isArabic
      ? "سحب الوصول"
      : "Access revoked";
  }

  return eventType;
}

function getRoleTone(roleKey: string) {
  if (roleKey === "super_admin") {
    return "border-gold/30 bg-gold/[0.10] text-gold";
  }

  if (roleKey === "admin") {
    return "border-sky-400/20 bg-sky-400/[0.08] text-sky-200";
  }

  if (roleKey === "content_manager") {
    return "border-violet-400/20 bg-violet-400/[0.08] text-violet-200";
  }

  if (roleKey === "moderator") {
    return "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200";
  }

  return "border-white/[0.10] bg-white/[0.035] text-white/55";
}

export default async function AdminUsersPage({
  searchParams,
}: PageProps) {
  const currentAdmin =
    await requirePermission(
      PERMISSIONS.ADMINS_VIEW,
    );

  const {
    lang,
    access_saved,
    access_revoked,
    access_invited,
    access_resent,
    access_cancelled,
    access_synced,
    access_error,
    q,
    status,
  } = await searchParams;

  const isArabic = lang !== "en";
  const locale: "ar" | "en" =
    isArabic ? "ar" : "en";
  const searchQuery =
    (q ?? "").trim();
  const normalizedSearchQuery =
    searchQuery.toLowerCase();
  const statusFilter =
    status === "active" ||
    status === "pending" ||
    status === "revoked" ||
    status === "inconsistent" ||
    status === "stale"
      ? status
      : "all";
  const adminClient = createAdminClient();
  const auditWindowStart =
    new Date(
      Date.now() -
        24 * 60 * 60 * 1000,
    ).toISOString();

  let currentPermissions:
    Awaited<
      ReturnType<
        typeof getUserPermissions
      >
    > = [];

  let permissionSnapshotHealthy =
    true;

  try {
    currentPermissions =
      await getUserPermissions(
        currentAdmin.id,
      );
  } catch (permissionError) {
    permissionSnapshotHealthy =
      false;
    console.error(
      "[AdminAccessCenter permissions snapshot]",
      permissionError,
    );
  }

  const currentPermissionSet =
    new Set(currentPermissions);

  const canManage =
    currentPermissionSet.has(
      PERMISSIONS.ADMINS_MANAGE,
    );

  const canManageRoles =
    currentPermissionSet.has(
      PERMISSIONS.ROLES_MANAGE,
    );

  const canViewRoles =
    currentPermissionSet.has(
      PERMISSIONS.ROLES_VIEW,
    );

  const [
    adminsResult,
    rolesResult,
    permissionsResult,
    rolePermissionsResult,
    userRolesResult,
    accessEventsResult,
    accessHealthEventsResult,
  ] = await Promise.all([
    adminClient
      .from("admin_users")
      .select("id, email, role, created_at")
      .order("created_at", {
        ascending: true,
      }),
    adminClient
      .from("roles")
      .select(
        "id, key, name, description, is_system",
      )
      .order("id", {
        ascending: true,
      }),
    adminClient
      .from("permissions")
      .select(
        "id, key, name, description, group_name",
      )
      .order("group_name", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      }),
    adminClient
      .from("role_permissions")
      .select("role_id, permission_id"),
    adminClient
      .from("user_roles")
      .select("user_id, role_id"),
    adminClient
      .from("events")
      .select(
        "id, event_type, target_id, actor_id, created_at, metadata",
      )
      .eq("target_type", "admin")
      .in("event_type", [
        "admin_invited",
        "admin_invite_resent",
        "admin_invite_cancelled",
        "admin_access_action_blocked",
        "admin_access_action_failed",
        "admin_access_action_noop",
        "admin_role_changed",
        "admin_access_revoked",
      ])
      .order("created_at", {
        ascending: false,
      })
      .limit(8),
    adminClient
      .from("events")
      .select("event_type, metadata")
      .eq("target_type", "admin")
      .in("event_type", [
        "admin_access_action_blocked",
        "admin_access_action_failed",
        "admin_action_failed",
      ])
      .gte(
        "created_at",
        auditWindowStart,
      ),
  ]);

  if (adminsResult.error) {
    throw new Error(
      `Unable to load admins: ${adminsResult.error.message}`,
    );
  }

  const logOptionalError = (
    label: string,
    error: unknown,
  ) => {
    if (error) {
      console.error(
        `[AdminAccessCenter ${label}]`,
        error,
      );
    }
  };

  logOptionalError(
    "roles",
    rolesResult.error,
  );
  logOptionalError(
    "permissions",
    permissionsResult.error,
  );
  logOptionalError(
    "rolePermissions",
    rolePermissionsResult.error,
  );
  logOptionalError(
    "userRoles",
    userRolesResult.error,
  );
  logOptionalError(
    "accessEvents",
    accessEventsResult.error,
  );
  logOptionalError(
    "accessHealthEvents",
    accessHealthEventsResult.error,
  );

  const accessStateDataHealthy =
    !rolesResult.error &&
    !userRolesResult.error;

  const rbacDataHealthy =
    accessStateDataHealthy &&
    !permissionsResult.error &&
    !rolePermissionsResult.error;

  const accessEventsUnavailable =
    Boolean(
      accessEventsResult.error,
    );

  const degradedDataSources = [
    !permissionSnapshotHealthy
      ? isArabic
        ? "صلاحيات حسابك الحالي"
        : "current admin permissions"
      : null,
    rolesResult.error
      ? isArabic
        ? "الأدوار"
        : "roles"
      : null,
    permissionsResult.error
      ? isArabic
        ? "الصلاحيات"
        : "permissions"
      : null,
    rolePermissionsResult.error
      ? isArabic
        ? "ربط الأدوار بالصلاحيات"
        : "role-permission mappings"
      : null,
    userRolesResult.error
      ? isArabic
        ? "تعيينات أدوار المشرفين"
        : "admin role assignments"
      : null,
  ].filter(
    (value): value is string =>
      Boolean(value),
  );

  const effectiveCanManage =
    permissionSnapshotHealthy &&
    canManage &&
    rbacDataHealthy;

  const effectiveCanManageRoles =
    permissionSnapshotHealthy &&
    canManageRoles &&
    canViewRoles &&
    rbacDataHealthy;

  const admins =
    (adminsResult.data ??
      []) as AdminUserRow[];

  const adminAuthStateEntries =
    await Promise.all(
      admins.map(async (admin) => {
        const {
          data,
          error,
        } =
          await adminClient.auth.admin.getUserById(
            admin.id,
          );

        if (error || !data.user) {
          console.error(
            "[AdminAccessCenter authUser]",
            error,
          );

          return [
            admin.id,
            null,
          ] as const;
        }

        const invitedAt =
          typeof data.user
            .user_metadata
            ?.admin_invited_at ===
          "string"
            ? data.user
                .user_metadata
                .admin_invited_at
            : null;

        return [
          admin.id,
          {
            invitedAt,
            lastSignInAt:
              data.user
                .last_sign_in_at ??
              null,
          },
        ] as const;
      }),
    );

  const adminAuthStateById =
    new Map(
      adminAuthStateEntries,
    );

  const roles = rolesResult.error
    ? []
    : ((rolesResult.data ??
        []) as RoleRow[]);

  const permissions =
    permissionsResult.error
      ? []
      : ((permissionsResult.data ??
          []) as PermissionRow[]);

  const rolePermissions =
    rolePermissionsResult.error
      ? []
      : ((rolePermissionsResult.data ??
          []) as RolePermissionRow[]);

  const userRoles = userRolesResult.error
    ? []
    : ((userRolesResult.data ??
        []) as UserRoleRow[]);

  const accessEvents =
    accessEventsResult.error
      ? []
      : ((accessEventsResult.data ??
          []) as AccessEventRow[]);

  const accessHealthEvents =
    accessHealthEventsResult.error
      ? []
      : ((accessHealthEventsResult.data ??
          []) as {
          event_type: string;
          metadata:
            | Record<
                string,
                unknown
              >
            | null;
        }[]);

  const failedAccessActions24h =
    accessHealthEvents.filter(
      (event) =>
        event.event_type ===
        "admin_access_action_failed",
    ).length;

  const blockedAccessActions24h =
    accessHealthEvents.filter(
      (event) =>
        event.event_type ===
        "admin_access_action_blocked",
    ).length;

  const failedMfaAttempts24h =
    accessHealthEvents.filter(
      (event) =>
        event.event_type ===
          "admin_action_failed" &&
        event.metadata?.action ===
          "admin_mfa_verification_failed",
    ).length;

  const accessHealthSummaryUnavailable =
    Boolean(
      accessHealthEventsResult.error,
    );

  const roleById = new Map(
    roles.map((role) => [
      role.id,
      role,
    ]),
  );

  const permissionIdsByRole =
    new Map<number, Set<number>>();

  for (const item of rolePermissions) {
    const current =
      permissionIdsByRole.get(
        item.role_id,
      ) ?? new Set<number>();

    current.add(item.permission_id);
    permissionIdsByRole.set(
      item.role_id,
      current,
    );
  }

  const roleIdsByUser =
    new Map<string, number[]>();

  for (const item of userRoles) {
    const current =
      roleIdsByUser.get(
        item.user_id,
      ) ?? [];

    current.push(item.role_id);
    roleIdsByUser.set(
      item.user_id,
      current,
    );
  }

  const userCountByRole =
    new Map<number, number>();

  for (const item of userRoles) {
    userCountByRole.set(
      item.role_id,
      (userCountByRole.get(
        item.role_id,
      ) ?? 0) + 1,
    );
  }

  const permissionGroups =
    permissions.reduce(
      (groups, permission) => {
        const current =
          groups.get(
            permission.group_name,
          ) ?? [];

        current.push(permission);
        groups.set(
          permission.group_name,
          current,
        );

        return groups;
      },
      new Map<
        string,
        PermissionRow[]
      >(),
    );

  const groupedPermissions =
    Array.from(
      permissionGroups.entries(),
    );

  const systemRoles = roles.filter(
    (role) => role.is_system,
  ).length;

  const adminAccessStates =
    admins.map((admin) => {
      const assignedRoleKeys =
        (roleIdsByUser.get(
          admin.id,
        ) ?? [])
          .map(
            (roleId) =>
              roleById.get(
                roleId,
              )?.key,
          )
          .filter(
            (
              roleKey,
            ): roleKey is string =>
              Boolean(roleKey),
          );

      const hasActiveRole =
        hasConsistentActiveAdminRole(
          admin.role,
          assignedRoleKeys,
        );

      const hasInconsistentRole =
        (
          isAssignableAdminRole(
            admin.role,
          ) &&
          !hasActiveRole
        ) ||
        (
          !isAssignableAdminRole(
            admin.role,
          ) &&
          assignedRoleKeys.some(
            isAssignableAdminRole,
          )
        );

      const authState =
        adminAuthStateById.get(
          admin.id,
        );

      const authStateKnown =
        authState !== null &&
        authState !== undefined;
      const statusKnown =
        accessStateDataHealthy &&
        authStateKnown;

      const pendingInvite =
        statusKnown &&
        Boolean(
          authState?.invitedAt,
        ) &&
        !authState?.lastSignInAt;

      const invitedAtMs =
        authState?.invitedAt
          ? Date.parse(
              authState.invitedAt,
            )
          : Number.NaN;

      const staleInvite =
        pendingInvite &&
        Number.isFinite(
          invitedAtMs,
        ) &&
        Date.now() -
            invitedAtMs >=
          STALE_ADMIN_INVITE_MS;

      return {
        adminId: admin.id,
        hasActiveRole:
          statusKnown
            ? hasActiveRole
            : false,
        hasInconsistentRole:
          statusKnown
            ? hasInconsistentRole
            : false,
        pendingInvite,
        staleInvite,
        statusKnown,
      };
    });

  const pendingAdminCount =
    adminAccessStates.filter(
      (state) =>
        state.statusKnown &&
        state.hasActiveRole &&
        state.pendingInvite,
    ).length;

  const staleInviteCount =
    adminAccessStates.filter(
      (state) =>
        state.statusKnown &&
        state.hasActiveRole &&
        state.staleInvite,
    ).length;

  const activeAdminCount =
    adminAccessStates.filter(
      (state) =>
        state.statusKnown &&
        state.hasActiveRole &&
        !state.pendingInvite,
    ).length;

  const revokedAdminCount =
    adminAccessStates.filter(
      (state) =>
        state.statusKnown &&
        !state.hasActiveRole &&
        !state.hasInconsistentRole,
    ).length;

  const inconsistentAdminCount =
    adminAccessStates.filter(
      (state) =>
        state.statusKnown &&
        state.hasInconsistentRole,
    ).length;

  const unknownAdminCount =
    adminAccessStates.filter(
      (state) =>
        !state.statusKnown,
    ).length;

  const effectiveSuperAdminCount =
    accessStateDataHealthy
      ? admins.filter(
          (admin) => {
            if (
              !isAssignableAdminRole(
                admin.role,
              )
            ) {
              return false;
            }

            const assignedRoleKeys =
              (roleIdsByUser.get(
                admin.id,
              ) ?? [])
                .map(
                  (roleId) =>
                    roleById.get(
                      roleId,
                    )?.key,
                )
                .filter(
                  (
                    roleKey,
                  ): roleKey is string =>
                    Boolean(
                      roleKey,
                    ),
                );

            return (
              assignedRoleKeys.length ===
                1 &&
              assignedRoleKeys[0] ===
                "super_admin"
            );
          },
        ).length
      : null;

  const adminAccessStateById =
    new Map(
      adminAccessStates.map(
        (state) => [
          state.adminId,
          state,
        ],
      ),
    );

  const filteredAdmins =
    admins.filter((admin) => {
      const matchesSearch =
        !normalizedSearchQuery ||
        admin.email
          .toLowerCase()
          .includes(
            normalizedSearchQuery,
          ) ||
        admin.id
          .toLowerCase()
          .includes(
            normalizedSearchQuery,
          );

      if (!matchesSearch) {
        return false;
      }

      if (
        statusFilter === "all"
      ) {
        return true;
      }

      const state =
        adminAccessStateById.get(
          admin.id,
        );

      if (!state) {
        return false;
      }

      if (!state.statusKnown) {
        return false;
      }

      if (
        statusFilter ===
        "pending"
      ) {
        return (
          state.hasActiveRole &&
          state.pendingInvite
        );
      }

      if (
        statusFilter ===
        "active"
      ) {
        return (
          state.hasActiveRole &&
          !state.pendingInvite
        );
      }

      if (
        statusFilter ===
        "inconsistent"
      ) {
        return state.hasInconsistentRole;
      }

      if (
        statusFilter ===
        "stale"
      ) {
        return (
          state.hasActiveRole &&
          state.staleInvite
        );
      }

      return (
        !state.hasActiveRole &&
        !state.hasInconsistentRole
      );
    });

  const roleOptions = roles
    .filter((role) =>
      isAssignableAdminRole(
        role.key,
      ),
    )
    .map((role) => ({
      key: role.key,
      label: formatRoleKey(
        role.key,
        isArabic,
      ),
    }));

  const accessErrorMessage =
    access_error ===
    "invalid_input"
      ? isArabic
        ? "تم رفض الطلب لأن بيانات إجراء الإدارة غير صالحة. تم تسجيل المحاولة في سجل العمليات."
        : "The request was blocked because the admin-action input was invalid. The attempt was recorded in the audit log."
      : access_error ===
    "admin_exists"
      ? isArabic
        ? "هذا البريد مسجل بالفعل ضمن حسابات الإدارة."
        : "This email is already registered as an admin."
      : access_error ===
          "email_in_use"
        ? isArabic
          ? "هذا البريد مرتبط بحساب موجود في ملامح. لا يتم تحويل حسابات المواهب أو الناشرين إلى إدارة تلقائيًا لأسباب أمنية."
          : "This email already belongs to a MLAMH account. Talent or publisher accounts are never converted to admin automatically for security reasons."
        : access_error ===
            "invite_email_failed"
          ? isArabic
            ? "تعذر إرسال رابط تفعيل حساب الإدارة. تم التراجع عن إنشاء الحساب."
            : "The admin activation email could not be sent. Account creation was rolled back."
          : access_error ===
              "invite_create_rate_limited"
            ? isArabic
              ? "تم إيقاف إنشاء دعوات مشرفين جديدة مؤقتًا بسبب تكرار المحاولات. انتظر قليلًا ثم حاول مرة أخرى."
              : "Creating new admin invitations is temporarily rate-limited because of repeated attempts. Please wait and try again."
            : access_error ===
              "invite_resend_failed"
            ? isArabic
              ? "تعذر إعادة إرسال رابط تفعيل حساب الإدارة. حاول مرة أخرى."
              : "The admin activation link could not be resent. Please try again."
            : access_error ===
                "invite_rate_limited"
              ? isArabic
                ? "تم إيقاف إعادة إرسال رابط التفعيل مؤقتًا بسبب تكرار المحاولة. انتظر قليلًا ثم حاول مرة أخرى."
                : "Activation-link resending is temporarily rate-limited because of repeated attempts. Please wait and try again."
              : access_error ===
                "invite_cancel_failed"
              ? isArabic
                ? "تعذر إلغاء دعوة المشرف بالكامل. لم يتم اعتماد الإلغاء."
                : "The admin invitation could not be fully cancelled. The cancellation was not confirmed."
              : access_error ===
                  "invite_not_pending"
                ? isArabic
                  ? "هذه الدعوة لم تعد معلقة، لذلك لا يمكن تنفيذ هذا الإجراء عليها."
                  : "This invitation is no longer pending, so this action cannot be performed."
                : access_error ===
                    "invite_pending_role_change"
                  ? isArabic
                    ? "لا يمكن تغيير دور المشرف قبل إكمال التفعيل وتسجيل الدخول الأول. تم منع التغيير وتسجيل المحاولة."
                    : "The admin role cannot be changed before activation and first sign-in. The change was blocked and audited."
                  : access_error ===
                      "invite_access_inconsistent"
                    ? isArabic
                      ? "توجد حالة غير متطابقة بين سجل المشرف وتعيين الدور الفعلي. تم منع الإجراء لحماية الوصول حتى تتم المراجعة."
                      : "The admin registry and effective role assignment are inconsistent. The action was blocked until the access state is reviewed."
                    : access_error ===
                  "invite_lookup_failed" ||
                access_error ===
                  "invite_create_failed"
                ? isArabic
                  ? "تعذر إنشاء دعوة المشرف بأمان. لم يتم اعتماد الحساب."
                  : "The admin invitation could not be created safely. No account was approved."
                : access_error ===
    "self_role_change"
      ? isArabic
        ? "لا يمكن تغيير دور حسابك الحالي من هذه الصفحة لتجنب فقدان الوصول بالخطأ."
        : "You cannot change your current account role from this page to prevent accidental lockout."
      : access_error ===
          "self_revoke"
        ? isArabic
          ? "لا يمكن سحب وصول حسابك الحالي من نفس الجلسة."
          : "You cannot revoke your current account from the same session."
        : access_error ===
            "last_super_admin"
          ? isArabic
            ? "لا يمكن إزالة آخر مدير أعلى من النظام. عيّن مديرًا أعلى آخر أولًا."
            : "The last Super Admin cannot be removed. Assign another Super Admin first."
          : access_error ===
              "sensitive_role_confirmation_required"
            ? isArabic
              ? "تغيير مستوى صلاحية «مدير أعلى» يتطلب تأكيدًا صريحًا من نافذة الحماية."
              : "Crossing the Super Admin privilege boundary requires explicit confirmation from the security dialog."
          : access_error ===
              "super_admin_change_busy"
            ? isArabic
              ? "يوجد تغيير حساس آخر على صلاحيات المدير الأعلى قيد التنفيذ. تم منع العملية مؤقتًا لحماية الوصول؛ حاول مرة أخرى بعد ثوانٍ."
              : "Another sensitive Super Admin change is already in progress. This action was temporarily blocked to protect access; try again in a few seconds."
          : access_error ===
                "admin_not_found"
            ? isArabic
              ? "تعذر العثور على حساب الإدارة المطلوب."
              : "The requested admin account could not be found."
            : access_error ===
                  "role_permission_denied"
              ? isArabic
                ? "تغيير أدوار المشرفين يتطلب صلاحية إدارة الأدوار."
                : "Changing admin roles requires the roles.manage permission."
              : access_error ===
                  "role_not_found"
              ? isArabic
                ? "الدور المحدد غير متاح."
                : "The selected role is unavailable."
              : access_error
                ? isArabic
                  ? "تعذر تحديث صلاحيات الإدارة. لم يتم اعتماد التغيير."
                  : "Admin access could not be updated. The change was not applied."
                : null;

  return (
    <div
      dir={
        isArabic ? "rtl" : "ltr"
      }
    >
      <AdminPageContainer>
        <AdminPageHeader
          title={
            isArabic
              ? "المشرفون والصلاحيات"
              : "Admins & Access"
          }
          description={
            isArabic
              ? "مركز موحّد لمراجعة حسابات الإدارة، الأدوار، والصلاحيات الفعلية في المنصة."
              : "A unified access center for reviewing admin accounts, roles, and effective platform permissions."
          }
          actions={
            <>
              <AdminInviteDialog
                locale={locale}
                canManage={
                  effectiveCanManage
                }
              />
              <Link
                href={`/admin/audit-log?lang=${locale}&target=admin`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2 text-[11px] font-medium text-white/55 transition hover:border-gold/20 hover:text-gold"
              >
                <History className="h-3.5 w-3.5" />
                {isArabic
                  ? "سجل العمليات"
                  : "Audit log"}
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-[11px] font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isArabic
                  ? "MFA / AAL2 مفعّل"
                  : "MFA / AAL2 enforced"}
              </div>
            </>
          }
        />

        {!rbacDataHealthy ||
        !permissionSnapshotHealthy ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {isArabic
                  ? "تعذر تحميل بعض بيانات الصلاحيات بدقة"
                  : "Some access-control data could not be loaded reliably"}
              </p>
              <p className="mt-1 text-xs leading-6 text-amber-100/65">
                {isArabic
                  ? `المصادر المتأثرة: ${degradedDataSources.join("، ")}. تم تعطيل تغييرات الوصول مؤقتًا، ولن تُعرض القيم المفقودة على أنها أصفار حقيقية.`
                  : `Affected sources: ${degradedDataSources.join(", ")}. Access mutations are temporarily disabled, and missing values are not being presented as real zeros.`}
              </p>
            </div>
          </div>
        ) : null}

        {effectiveSuperAdminCount !== null &&
        effectiveSuperAdminCount <= 1 ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
            <Crown className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {effectiveSuperAdminCount ===
                0
                  ? isArabic
                    ? "لم يتم اكتشاف مدير أعلى فعّال"
                    : "No effective Super Admin detected"
                  : isArabic
                    ? "يوجد مدير أعلى فعّال واحد فقط"
                    : "Only one effective Super Admin is available"}
              </p>
              <p className="mt-1 text-xs leading-6 text-amber-100/65">
                {effectiveSuperAdminCount ===
                0
                  ? isArabic
                    ? "تم تعطيل التغييرات الحساسة تلقائيًا كلما تعذر التحقق من حالة الوصول. راجع RBAC وسجل الإدارة قبل أي تغيير إضافي."
                    : "Sensitive changes fail closed whenever access state cannot be verified. Review RBAC and the admin registry before making further changes."
                  : isArabic
                    ? "حماية «آخر مدير أعلى» تمنع فقدان الوصول، لكن يوصى بوجود مدير أعلى ثانٍ موثّق للطوارئ واستمرارية الإدارة."
                    : "Last-Super-Admin protection prevents lockout, but a second verified Super Admin is recommended for emergency recovery and administrative continuity."}
              </p>
            </div>
          </div>
        ) : null}

        {staleInviteCount > 0 &&
        accessStateDataHealthy ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
            <History className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {isArabic
                  ? `يوجد ${staleInviteCount} دعوة إدارة معلقة منذ 7 أيام أو أكثر`
                  : `${staleInviteCount} admin invite${staleInviteCount === 1 ? "" : "s"} have been pending for 7 days or more`}
              </p>
              <p className="mt-1 text-xs leading-6 text-amber-100/65">
                {isArabic
                  ? "راجع الدعوات القديمة: أعد إرسال رابط التفعيل إذا كان الوصول ما زال مطلوبًا، أو ألغِ الدعوة لتقليل الحسابات غير المفعلة."
                  : "Review stale invitations: resend activation if access is still needed, or cancel the invitation to reduce unactivated admin identities."}
              </p>
            </div>
          </div>
        ) : null}

        {failedMfaAttempts24h > 0 ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-100">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {isArabic
                  ? `تم تسجيل ${failedMfaAttempts24h} محاولة تحقق ثنائي فاشلة خلال آخر 24 ساعة`
                  : `${failedMfaAttempts24h} failed MFA verification attempt${failedMfaAttempts24h === 1 ? "" : "s"} were recorded in the last 24 hours`}
              </p>
              <p className="mt-1 text-xs leading-6 text-red-100/65">
                {isArabic
                  ? "راجع سجل العمليات وهوية المشرف المستهدف قبل إجراء أي تغيير حساس. لا يتم عرض رمز التحقق أو المفتاح السري في السجل."
                  : "Review the audit log and affected admin identity before making sensitive changes. Verification codes and MFA secrets are never stored in the audit trail."}
              </p>
            </div>
          </div>
        ) : null}

        {inconsistentAdminCount > 0 &&
        accessStateDataHealthy ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-orange-400/20 bg-orange-400/[0.06] px-4 py-3 text-sm text-orange-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {isArabic
                  ? `يوجد ${inconsistentAdminCount} حساب إدارة يحتاج مزامنة سجل الدور`
                  : `${inconsistentAdminCount} admin account${inconsistentAdminCount === 1 ? "" : "s"} need role-registry synchronization`}
              </p>
              <p className="mt-1 text-xs leading-6 text-orange-100/65">
                {isArabic
                  ? "دور RBAC الفعلي يظل مصدر الصلاحيات، لكن قيمة سجل الإدارة لا تطابقه. راجع الحساب المعلّم «عدم تطابق في صلاحية الوصول» واستخدم مزامنة السجل الآمنة عند الحاجة."
                  : "The effective RBAC role remains the permission source of truth, but the admin registry label does not match it. Review accounts marked “Access-role mismatch” and use the safe registry sync when appropriate."}
              </p>
            </div>
          </div>
        ) : null}

        {access_saved === "1" ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تم تحديث دور المشرف وتسجيل العملية في سجل النظام."
                : "The admin role was updated and recorded in the audit log."}
            </p>
          </div>
        ) : null}

        {access_synced === "1" ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تمت مزامنة سجل دور المشرف مع دور RBAC الفعلي دون تغيير الصلاحيات الحالية."
                : "The admin registry role was synchronized with the effective RBAC role without changing current permissions."}
            </p>
          </div>
        ) : null}

        {access_revoked === "1" ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تم سحب وصول الحساب إلى لوحة الإدارة فورًا وتسجيل العملية."
                : "Admin access was revoked immediately and recorded."}
            </p>
          </div>
        ) : null}

        {access_invited === "1" ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تم إنشاء حساب الإدارة وإرسال رابط آمن لتعيين كلمة المرور. لن يتمكن المشرف من الدخول قبل إكمال كلمة المرور والمصادقة الثنائية."
                : "The admin account was created and a secure password-setup link was sent. Access remains blocked until password setup and MFA are completed."}
            </p>
          </div>
        ) : null}

        {access_resent === "1" ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تمت إعادة إرسال رابط تفعيل حساب الإدارة بنجاح."
                : "The admin activation link was resent successfully."}
            </p>
          </div>
        ) : null}

        {access_cancelled === "1" ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تم إلغاء دعوة المشرف وحذف الحساب غير المفعّل."
                : "The admin invitation was cancelled and the unactivated account was removed."}
            </p>
          </div>
        ) : null}

        {accessErrorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm leading-6 text-red-200">
            {accessErrorMessage}
          </div>
        ) : null}

        {accessHealthSummaryUnavailable ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/75">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isArabic
                ? "تعذر تحميل ملخص محاولات الوصول الإدارية خلال آخر 24 ساعة. راجع سجل العمليات عند الحاجة."
                : "The 24-hour admin-access activity summary is temporarily unavailable. Review the audit log if needed."}
            </p>
          </div>
        ) : failedAccessActions24h > 0 ||
          blockedAccessActions24h > 0 ? (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {isArabic
                  ? `آخر 24 ساعة: ${failedAccessActions24h} إجراء فشل و${blockedAccessActions24h} إجراء تم منعه بواسطة ضوابط الحماية.`
                  : `Last 24 hours: ${failedAccessActions24h} failed actions and ${blockedAccessActions24h} actions blocked by safeguards.`}
              </p>
            </div>

            <Link
              href={`/admin/audit-log?lang=${locale}&target=admin`}
              className="shrink-0 text-xs font-medium text-gold transition hover:text-white"
            >
              {isArabic
                ? "عرض السجل الكامل"
                : "View full audit log"}
            </Link>
          </div>
        ) : null}

        <section className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gold/15 bg-gradient-to-b from-gold/[0.08] to-gold/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/45">
                {isArabic
                  ? "حسابات الإدارة"
                  : "Admin accounts"}
              </p>
              <Users className="h-4 w-4 text-gold" />
            </div>
            <p className="mt-4 text-3xl font-light tabular-nums text-white">
              {admins.length}
            </p>
            <p className="mt-1 text-[11px] text-white/30">
              {isArabic
                ? `${activeAdminCount} نشط · ${pendingAdminCount} دعوة معلقة${staleInviteCount > 0 ? ` (${staleInviteCount} قديمة)` : ""} · ${revokedAdminCount} مسحوب${inconsistentAdminCount > 0 ? ` · ${inconsistentAdminCount} غير متطابق` : ""}${unknownAdminCount > 0 ? ` · ${unknownAdminCount} غير متحقق` : ""}`
                : `${activeAdminCount} active · ${pendingAdminCount} pending${staleInviteCount > 0 ? ` (${staleInviteCount} stale)` : ""} · ${revokedAdminCount} revoked${inconsistentAdminCount > 0 ? ` · ${inconsistentAdminCount} inconsistent` : ""}${unknownAdminCount > 0 ? ` · ${unknownAdminCount} unverified` : ""}`}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/45">
                {isArabic
                  ? "الأدوار"
                  : "Roles"}
              </p>
              <UserCog className="h-4 w-4 text-white/45" />
            </div>
            <p className="mt-4 text-3xl font-light tabular-nums text-white">
              {rolesResult.error
                ? "—"
                : roles.length}
            </p>
            <p className="mt-1 text-[11px] text-white/30">
              {rolesResult.error
                ? isArabic
                  ? "البيانات غير متاحة حاليًا"
                  : "Data temporarily unavailable"
                : isArabic
                  ? `${roleOptions.length} قابلة للتعيين الآن من ${systemRoles}`
                  : `${roleOptions.length} assignable now of ${systemRoles}`}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/45">
                {isArabic
                  ? "الصلاحيات الدقيقة"
                  : "Permissions"}
              </p>
              <KeyRound className="h-4 w-4 text-white/45" />
            </div>
            <p className="mt-4 text-3xl font-light tabular-nums text-white">
              {permissionsResult.error
                ? "—"
                : permissions.length}
            </p>
            <p className="mt-1 text-[11px] text-white/30">
              {permissionsResult.error
                ? isArabic
                  ? "البيانات غير متاحة حاليًا"
                  : "Data temporarily unavailable"
                : isArabic
                  ? `${groupedPermissions.length} مجموعات وصول`
                  : `${groupedPermissions.length} access groups`}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/45">
                {isArabic
                  ? "حماية الجلسة"
                  : "Session security"}
              </p>
              <LockKeyhole className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-4 text-2xl font-light text-white">
              AAL2
            </p>
            <p className="mt-1 text-[11px] text-emerald-200/60">
              {isArabic
                ? "مصادقة متعددة العوامل مطلوبة"
                : "Multi-factor authentication required"}
            </p>
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.035] to-white/[0.018] shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
          <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  <h2 className="text-base font-semibold text-white sm:text-lg">
                    {isArabic
                      ? "حسابات الإدارة"
                      : "Admin accounts"}
                  </h2>
                </div>
                <p className="mt-1.5 text-xs leading-6 text-white/35">
                  {isArabic
                    ? "ابحث بالبريد أو المعرّف، وفلتر الحسابات حسب حالة الوصول."
                    : "Search by email or ID and filter accounts by access state."}
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[11px] text-white/40">
                {isArabic
                  ? `${filteredAdmins.length} من ${admins.length}`
                  : `${filteredAdmins.length} of ${admins.length}`}
              </span>
            </div>

            <form
              method="get"
              className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
              <input
                type="hidden"
                name="lang"
                value={locale}
              />

              <label className="relative block">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder={
                    isArabic
                      ? "ابحث بالبريد أو المعرّف..."
                      : "Search email or ID..."
                  }
                  className="h-11 w-full rounded-xl border border-white/[0.09] bg-black/25 ps-10 pe-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-gold/30"
                />
              </label>

              <select
                name="status"
                defaultValue={
                  statusFilter
                }
                className="h-11 rounded-xl border border-white/[0.09] bg-black/25 px-3 text-xs text-white/65 outline-none transition focus:border-gold/30"
              >
                <option value="all">
                  {isArabic
                    ? "كل الحالات"
                    : "All states"}
                </option>
                <option value="active">
                  {isArabic
                    ? "نشط"
                    : "Active"}
                </option>
                <option value="pending">
                  {isArabic
                    ? "دعوة معلقة"
                    : "Pending invite"}
                </option>
                <option value="revoked">
                  {isArabic
                    ? "الوصول مسحوب"
                    : "Revoked"}
                </option>
                <option value="inconsistent">
                  {isArabic
                    ? "عدم تطابق في الوصول"
                    : "Access mismatch"}
                </option>
                <option value="stale">
                  {isArabic
                    ? "دعوات قديمة"
                    : "Stale invites"}
                </option>
              </select>

              <button
                type="submit"
                className="h-11 rounded-xl border border-gold/20 bg-gold/[0.08] px-4 text-xs font-medium text-gold transition hover:bg-gold hover:text-black"
              >
                {isArabic
                  ? "تطبيق"
                  : "Apply"}
              </button>
            </form>
          </div>

          {filteredAdmins.length === 0 ? (
            <p className="p-10 text-center text-sm text-white/40">
              {admins.length === 0
                ? isArabic
                  ? "لا توجد حسابات إدارة."
                  : "No admin accounts found."
                : isArabic
                  ? "لا توجد نتائج مطابقة للبحث أو الفلتر الحالي."
                  : "No admin accounts match the current search or filter."}
            </p>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {filteredAdmins.map(
                (admin) => {
                  const mappedRoleIds =
                    roleIdsByUser.get(
                      admin.id,
                    ) ?? [];

                  const mappedRoleKeys =
                    mappedRoleIds
                      .map(
                        (roleId) =>
                          roleById.get(
                            roleId,
                          )?.key,
                      )
                      .filter(
                        (
                          roleKey,
                        ): roleKey is string =>
                          Boolean(
                            roleKey,
                          ),
                      );

                  const effectiveRoleKeys =
                    mappedRoleKeys;

                  const rawHasActiveAccess =
                    hasConsistentActiveAdminRole(
                      admin.role,
                      effectiveRoleKeys,
                    );

                  const hasInconsistentAccess =
                    (
                      isAssignableAdminRole(
                        admin.role,
                      ) &&
                      !rawHasActiveAccess
                    ) ||
                    (
                      !isAssignableAdminRole(
                        admin.role,
                      ) &&
                      effectiveRoleKeys.some(
                        isAssignableAdminRole,
                      )
                    );

                  const authState =
                    adminAuthStateById.get(
                      admin.id,
                    );
                  const authStateKnown =
                    authState !== null &&
                    authState !== undefined;
                  const accessStateKnown =
                    accessStateDataHealthy &&
                    authStateKnown;
                  const hasActiveAccess =
                    accessStateKnown &&
                    rawHasActiveAccess;

                  const pendingInvite =
                    accessStateKnown &&
                    rawHasActiveAccess &&
                    Boolean(
                      authState?.invitedAt,
                    ) &&
                    !authState?.lastSignInAt;

                  const invitedAtMs =
                    authState?.invitedAt
                      ? Date.parse(
                          authState.invitedAt,
                        )
                      : Number.NaN;

                  const staleInvite =
                    pendingInvite &&
                    Number.isFinite(
                      invitedAtMs,
                    ) &&
                    Date.now() -
                        invitedAtMs >=
                      STALE_ADMIN_INVITE_MS;

                  const initial =
                    admin.email
                      .charAt(0)
                      .toUpperCase() ||
                    "A";

                  return (
                    <div
                      key={admin.id}
                      className="grid gap-4 px-5 py-5 sm:px-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(180px,0.65fr)_140px_minmax(260px,0.9fr)] xl:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08] text-sm font-medium text-gold">
                          {initial}
                        </div>

                        <div className="min-w-0">
                          <p
                            dir="ltr"
                            className="truncate text-sm font-medium text-white/85"
                          >
                            {admin.email}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-white/28">
                            <span className={`inline-flex items-center gap-1.5 ${
                              !accessStateKnown
                                ? "text-amber-200/70"
                                : hasInconsistentAccess
                                  ? "text-orange-200/80"
                                  : pendingInvite
                                    ? "text-amber-200/70"
                                    : hasActiveAccess
                                      ? "text-emerald-300/75"
                                      : "text-red-200/55"
                            }`}>
                              {!accessStateKnown ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : hasInconsistentAccess ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : pendingInvite ? (
                                <History className="h-3 w-3" />
                              ) : hasActiveAccess ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <LockKeyhole className="h-3 w-3" />
                              )}
                              {!accessStateKnown
                                ? isArabic
                                  ? "تعذر التحقق من حالة الوصول"
                                  : "Access state unavailable"
                                : hasInconsistentAccess
                                  ? isArabic
                                    ? "عدم تطابق في صلاحية الوصول"
                                    : "Access-role mismatch"
                                  : staleInvite
                                    ? isArabic
                                      ? "دعوة معلقة قديمة"
                                      : "Stale pending invite"
                                  : pendingInvite
                                  ? isArabic
                                    ? "دعوة معلقة"
                                    : "Invite pending"
                                  : hasActiveAccess
                                    ? isArabic
                                      ? "نشط"
                                      : "Active"
                                    : isArabic
                                      ? "الوصول مسحوب"
                                      : "Access revoked"}
                            </span>
                            <span aria-hidden="true">
                              •
                            </span>
                            <span
                              dir="ltr"
                              className="font-mono"
                            >
                              {admin.id.slice(
                                0,
                                8,
                              )}
                              …
                            </span>
                            <span aria-hidden="true">
                              •
                            </span>
                            <Link
                              href={`/admin/audit-log?lang=${locale}&actor=${encodeURIComponent(
                                admin.id,
                              )}`}
                              className="text-gold/55 transition hover:text-gold"
                            >
                              {isArabic
                                ? "نشاط المشرف"
                                : "Admin activity"}
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!accessStateKnown ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/15 bg-amber-400/[0.04] px-2.5 py-1.5 text-[11px] text-amber-100/65">
                            <AlertTriangle className="h-3 w-3" />
                            {isArabic
                              ? "بيانات الدور غير متاحة"
                              : "Role data unavailable"}
                          </span>
                        ) : effectiveRoleKeys.length >
                          0 ? (
                          effectiveRoleKeys.map(
                            (roleKey) => (
                              <span
                                key={
                                  roleKey
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium ${getRoleTone(
                                  roleKey,
                                )}`}
                              >
                                {roleKey ===
                                "super_admin" ? (
                                  <Crown className="h-3 w-3" />
                                ) : null}
                                {formatRoleKey(
                                  roleKey,
                                  isArabic,
                                )}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-white/35">
                            {isArabic
                              ? "بدون دور وصول فعّال"
                              : "No active access role"}
                          </span>
                        )}
                      </div>

                      <div className="xl:text-end">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                          {!authStateKnown
                            ? isArabic
                              ? "حالة الدخول"
                              : "Sign-in state"
                            : authState?.lastSignInAt
                              ? isArabic
                                ? "آخر دخول"
                                : "Last sign-in"
                              : isArabic
                                ? "تاريخ الإضافة"
                                : "Added"}
                        </p>
                        <p className="mt-1.5 text-xs text-white/55">
                          {!authStateKnown
                            ? isArabic
                              ? "غير متاحة حاليًا"
                              : "Temporarily unavailable"
                            : authState?.lastSignInAt
                              ? formatDateTime(
                                  authState.lastSignInAt,
                                  isArabic,
                                )
                              : formatDate(
                                  admin.created_at,
                                  isArabic,
                                )}
                        </p>
                      </div>

                      <AdminRoleControls
                        adminId={admin.id}
                        currentRoleKey={
                          effectiveRoleKeys[0] ??
                          admin.role
                        }
                        roles={roleOptions}
                        locale={locale}
                        isSelf={
                          admin.id ===
                          currentAdmin.id
                        }
                        canManage={
                          effectiveCanManage &&
                          accessStateKnown
                        }
                        canManageRoles={
                          effectiveCanManageRoles &&
                          accessStateKnown
                        }
                        pendingInvite={
                          pendingInvite
                        }
                        roleMismatch={
                          accessStateKnown &&
                          hasInconsistentAccess
                        }
                        registryActive={
                          isAssignableAdminRole(
                            admin.role,
                          )
                        }
                      />
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
                {isArabic
                  ? "نموذج الوصول"
                  : "Access Model"}
              </p>
              <h2 className="mt-2 text-xl font-light text-white sm:text-2xl">
                {isArabic
                  ? "الأدوار المعتمدة"
                  : "Defined roles"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">
                {isArabic
                  ? "كل دور يحدد نطاقًا واضحًا من الصلاحيات وفق مبدأ أقل قدر من الوصول."
                  : "Each role defines a clear permission scope following least-privilege access."}
              </p>
            </div>
          </div>

          {!canViewRoles ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm text-white/40">
              {isArabic
                ? "تفاصيل نموذج الأدوار تتطلب صلاحية عرض الأدوار."
                : "Role-model details require the roles.view permission."}
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm text-white/40">
              {isArabic
                ? "تعذر تحميل الأدوار حاليًا."
                : "Roles could not be loaded."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roles.map(
                (role) => {
                  const permissionCount =
                    permissionIdsByRole.get(
                      role.id,
                    )?.size ?? 0;

                  const assignedCount =
                    userCountByRole.get(
                      role.id,
                    ) ?? 0;

                  const assignable =
                    isAssignableAdminRole(
                      role.key,
                    );

                  return (
                    <div
                      key={role.id}
                      className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.04] to-white/[0.018] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.16)]"
                    >
                      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-white/90">
                              {formatRoleKey(
                                role.key,
                                isArabic,
                              )}
                            </h3>
                            {role.is_system ? (
                              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/32">
                                {isArabic
                                  ? "نظامي"
                                  : "System"}
                              </span>
                            ) : null}

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                                assignable
                                  ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
                                  : "border-amber-400/20 bg-amber-400/[0.05] text-amber-100/70"
                              }`}
                            >
                              {assignable
                                ? isArabic
                                  ? "قابل للتعيين"
                                  : "Assignable"
                                : isArabic
                                  ? "محضّر"
                                  : "Prepared"}
                            </span>
                          </div>
                          <p
                            dir="ltr"
                            className="mt-1 font-mono text-[10px] text-white/24"
                          >
                            {role.key}
                          </p>
                        </div>

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${getRoleTone(
                            role.key,
                          )}`}
                        >
                          {role.key ===
                          "super_admin" ? (
                            <Crown className="h-4 w-4" />
                          ) : (
                            <UserCog className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      <p className="mt-4 min-h-12 text-xs leading-6 text-white/38">
                        {ROLE_DESCRIPTIONS[
                          role.key
                        ]
                          ? isArabic
                            ? ROLE_DESCRIPTIONS[
                                role.key
                              ].ar
                            : ROLE_DESCRIPTIONS[
                                role.key
                              ].en
                          : role.description ||
                            (isArabic
                              ? "دور وصول إداري ضمن منظومة الصلاحيات."
                              : "Administrative access role in the permission system.")}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
                        <div>
                          <p className="text-[10px] text-white/28">
                            {isArabic
                              ? "الصلاحيات"
                              : "Permissions"}
                          </p>
                          <p className="mt-1 text-lg font-light tabular-nums text-white/80">
                            {rolePermissionsResult.error
                              ? "—"
                              : permissionCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/28">
                            {isArabic
                              ? "المعيّنون"
                              : "Assigned"}
                          </p>
                          <p className="mt-1 text-lg font-light tabular-nums text-white/80">
                            {userRolesResult.error
                              ? "—"
                              : assignedCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <section className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.02]">
          <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gold" />
              <h2 className="text-base font-semibold text-white sm:text-lg">
                {isArabic
                  ? "مصفوفة الصلاحيات"
                  : "Permission matrix"}
              </h2>
            </div>
            <p className="mt-1.5 max-w-3xl text-xs leading-6 text-white/35">
              {isArabic
                ? "توضح تغطية كل دور لمجموعات الصلاحيات المسجلة في النظام."
                : "Shows how each role covers the permission groups registered in the system."}
            </p>
          </div>

          {!canViewRoles ? (
            <div className="flex items-start gap-3 p-6 text-sm text-white/45">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
              <p>
                {isArabic
                  ? "عرض مصفوفة الصلاحيات يتطلب صلاحية عرض الأدوار."
                  : "Viewing the permission matrix requires the roles.view permission."}
              </p>
            </div>
          ) : rolesResult.error ||
          permissionsResult.error ||
          rolePermissionsResult.error ? (
            <div className="flex items-start gap-3 p-6 text-sm text-amber-100/75">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {isArabic
                  ? "تعذر التحقق من مصفوفة الصلاحيات بشكل كامل. تم إخفاء القيم غير المؤكدة بدل عرض أرقام صفرية مضللة."
                  : "The permission matrix could not be verified completely. Uncertain values are hidden instead of being shown as misleading zeros."}
              </p>
            </div>
          ) : roles.length === 0 ||
            groupedPermissions.length ===
              0 ? (
            <p className="p-8 text-center text-sm text-white/40">
              {isArabic
                ? "لا توجد بيانات كافية لعرض مصفوفة الصلاحيات."
                : "There is not enough data to render the permission matrix."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-start">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-black/20">
                    <th className="px-5 py-3.5 text-start text-[10px] font-medium uppercase tracking-[0.16em] text-white/28 sm:px-6">
                      {isArabic
                        ? "الدور"
                        : "Role"}
                    </th>
                    {groupedPermissions.map(
                      ([
                        groupName,
                        groupPermissions,
                      ]) => (
                        <th
                          key={
                            groupName
                          }
                          className="px-4 py-3.5 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/28"
                        >
                          <span className="block">
                            {formatGroupName(
                              groupName,
                              isArabic,
                            )}
                          </span>
                          <span className="mt-1 block font-normal tracking-normal text-white/18">
                            {
                              groupPermissions.length
                            }
                          </span>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {roles.map(
                    (role) => {
                      const rolePermissionIds =
                        permissionIdsByRole.get(
                          role.id,
                        ) ??
                        new Set<number>();

                      return (
                        <tr
                          key={
                            role.id
                          }
                          className="transition-colors hover:bg-white/[0.018]"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`h-2 w-2 rounded-full border ${getRoleTone(
                                  role.key,
                                )}`}
                              />
                              <span className="text-xs font-medium text-white/70">
                                {formatRoleKey(
                                  role.key,
                                  isArabic,
                                )}
                              </span>
                            </div>
                          </td>

                          {groupedPermissions.map(
                            ([
                              groupName,
                              groupPermissions,
                            ]) => {
                              const covered =
                                groupPermissions.filter(
                                  (
                                    permission,
                                  ) =>
                                    rolePermissionIds.has(
                                      permission.id,
                                    ),
                                )
                                  .length;

                              const complete =
                                covered ===
                                  groupPermissions.length &&
                                groupPermissions.length >
                                  0;

                              return (
                                <td
                                  key={`${role.id}-${groupName}`}
                                  className="px-4 py-4 text-center"
                                >
                                  <span
                                    className={`inline-flex min-w-14 items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-medium tabular-nums ${
                                      complete
                                        ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
                                        : covered >
                                            0
                                          ? "border-gold/20 bg-gold/[0.06] text-gold"
                                          : "border-white/[0.07] bg-white/[0.02] text-white/25"
                                    }`}
                                  >
                                    {covered}/
                                    {
                                      groupPermissions.length
                                    }
                                  </span>
                                </td>
                              );
                            },
                          )}
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.02]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-gold" />
                <h2 className="text-base font-semibold text-white sm:text-lg">
                  {isArabic
                    ? "آخر تغييرات الوصول"
                    : "Recent access changes"}
                </h2>
              </div>
              <p className="mt-1.5 text-xs leading-6 text-white/35">
                {isArabic
                  ? "سجل مختصر لأحدث عمليات الوصول، بما فيها النجاحات والإجراءات المحظورة والفاشلة ومحاولات بلا تغيير."
                  : "A concise trail of recent access activity, including successful, blocked, failed, and no-op actions."}
              </p>
            </div>
          </div>

          {accessEventsUnavailable ? (
            <div className="flex items-start gap-3 p-6 text-sm text-amber-100/75">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {isArabic
                  ? "تعذر تحميل سجل تغييرات الوصول حاليًا. لم يتم افتراض أن السجل فارغ."
                  : "The access-change audit trail is temporarily unavailable. The UI is not treating it as an empty history."}
              </p>
            </div>
          ) : accessEvents.length === 0 ? (
            <p className="p-8 text-center text-sm text-white/35">
              {isArabic
                ? "لا توجد تغييرات وصول مسجلة حتى الآن."
                : "No access changes have been recorded yet."}
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {accessEvents.map(
                (event) => {
                  const metadata =
                    event.metadata ?? {};
                  const targetEmail =
                    typeof metadata.target_email ===
                    "string"
                      ? metadata.target_email
                      : typeof metadata.invited_email ===
                          "string"
                        ? metadata.invited_email
                        : event.target_id
                          ? `${event.target_id.slice(
                              0,
                              8,
                            )}…`
                          : "-";

                  const actorLabel =
                    typeof metadata.actor_email ===
                    "string"
                      ? metadata.actor_email
                      : event.actor_id
                        ? `${event.actor_id.slice(
                            0,
                            8,
                          )}…`
                        : "-";

                  const actionLabel =
                    typeof metadata.action ===
                    "string"
                      ? metadata.action
                      : null;

                  const reasonLabel =
                    typeof metadata.reason ===
                    "string"
                      ? metadata.reason
                      : null;

                  const outcomeLabel =
                    typeof metadata.outcome ===
                    "string"
                      ? metadata.outcome
                      : null;

                  return (
                    <div
                      key={event.id}
                      className="grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.55fr)_190px] lg:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white/75">
                          {getAccessEventLabel(
                            event.event_type,
                            isArabic,
                          )}
                        </p>
                        <p
                          dir={
                            targetEmail.includes(
                              "@",
                            )
                              ? "ltr"
                              : undefined
                          }
                          className="mt-1 truncate text-[11px] text-white/35"
                        >
                          {targetEmail}
                        </p>

                        {actionLabel ||
                        reasonLabel ||
                        outcomeLabel ? (
                          <p
                            dir="ltr"
                            className="mt-1.5 truncate font-mono text-[10px] text-white/25"
                          >
                            {[
                              actionLabel,
                              outcomeLabel,
                              reasonLabel,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/22">
                          {isArabic
                            ? "المنفذ"
                            : "Actor"}
                        </p>
                        <p
                          dir="ltr"
                          className="mt-1 truncate font-mono text-[10px] text-white/38"
                        >
                          {actorLabel}
                        </p>
                      </div>

                      <p className="text-xs text-white/38 lg:text-end">
                        {formatDateTime(
                          event.created_at,
                          isArabic,
                        )}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-br from-gold/[0.045] via-white/[0.02] to-transparent p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08] text-gold">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/85">
                {isArabic
                  ? "ضوابط الوصول"
                  : "Access safeguards"}
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/40">
                {isArabic
                  ? "الدخول إلى لوحة الإدارة يتطلب حسابًا مسجلًا في سجل الإدارة، ودور وصول فعّالًا، وجلسة مصادقًا عليها بمستوى AAL2. كل إجراء حساس في إدارة الوصول يُسجل بنتيجته: ناجح أو محظور أو فاشل أو بلا تغيير، مع هوية المنفذ والمستهدف والسبب وحالة التراجع عند الحاجة. لا يتم تسجيل كلمات المرور أو رموز التفعيل."
                  : "Admin access requires an explicit registry entry, an active access role, and an AAL2-authenticated session. Every sensitive access-management action is audited with its outcome—success, blocked, failed, or no-op—plus actor, target, reason, and rollback status when relevant. Passwords and activation tokens are never logged."}
              </p>
            </div>
          </div>
        </section>
      </AdminPageContainer>
    </div>
  );
}
