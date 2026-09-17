import {
  CheckCircle2,
  Crown,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import {
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
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
  await requireAdminAccess();

  const { lang } = await searchParams;
  const isArabic = lang !== "en";
  const adminClient = createAdminClient();

  const [
    adminsResult,
    rolesResult,
    permissionsResult,
    rolePermissionsResult,
    userRolesResult,
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

  const admins =
    (adminsResult.data ??
      []) as AdminUserRow[];

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

  const privilegedAdmins =
    admins.filter(
      (admin) =>
        admin.role ===
          "super_admin" ||
        admin.role === "admin",
    ).length;

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
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-[11px] font-medium text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isArabic
                ? "MFA / AAL2 مفعّل"
                : "MFA / AAL2 enforced"}
            </div>
          }
        />

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
                ? `${privilegedAdmins} بصلاحيات إدارية عليا`
                : `${privilegedAdmins} privileged accounts`}
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
              {roles.length}
            </p>
            <p className="mt-1 text-[11px] text-white/30">
              {isArabic
                ? `${systemRoles} أدوار نظامية`
                : `${systemRoles} system roles`}
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
              {permissions.length}
            </p>
            <p className="mt-1 text-[11px] text-white/30">
              {isArabic
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
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
                  ? "الحسابات المسجلة حاليًا مع دور الوصول وتاريخ الإضافة."
                  : "Currently registered accounts with access role and creation date."}
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[11px] text-white/40">
              {isArabic
                ? `${admins.length} حساب`
                : `${admins.length} accounts`}
            </span>
          </div>

          {admins.length === 0 ? (
            <p className="p-10 text-center text-sm text-white/40">
              {isArabic
                ? "لا توجد حسابات إدارة."
                : "No admin accounts found."}
            </p>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {admins.map(
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
                    mappedRoleKeys.length >
                    0
                      ? mappedRoleKeys
                      : admin.role
                        ? [admin.role]
                        : [];

                  const initial =
                    admin.email
                      .charAt(0)
                      .toUpperCase() ||
                    "A";

                  return (
                    <div
                      key={admin.id}
                      className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.8fr)_180px] lg:items-center"
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
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-300/70" />
                              {isArabic
                                ? "نشط"
                                : "Active"}
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
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {effectiveRoleKeys.length >
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
                          <span className="text-xs text-white/30">
                            {isArabic
                              ? "لا يوجد دور"
                              : "No role"}
                          </span>
                        )}
                      </div>

                      <div className="lg:text-end">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                          {isArabic
                            ? "تاريخ الإضافة"
                            : "Added"}
                        </p>
                        <p className="mt-1.5 text-xs text-white/55">
                          {formatDate(
                            admin.created_at,
                            isArabic,
                          )}
                        </p>
                      </div>
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

          {roles.length === 0 ? (
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
                        {role.description ||
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
                            {
                              permissionCount
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/28">
                            {isArabic
                              ? "المعيّنون"
                              : "Assigned"}
                          </p>
                          <p className="mt-1 text-lg font-light tabular-nums text-white/80">
                            {
                              assignedCount
                            }
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

          {roles.length === 0 ||
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
                  ? "الدخول إلى لوحة الإدارة يتطلب حساب إدارة صالحًا وجلسة مصادقًا عليها بمستوى AAL2. هذه الصفحة تعرض بنية الأدوار والصلاحيات الحالية دون تنفيذ تغييرات مباشرة على التعيينات."
                  : "Admin access requires a valid admin account and an AAL2-authenticated session. This page presents the current role and permission structure without directly changing assignments."}
              </p>
            </div>
          </div>
        </section>
      </AdminPageContainer>
    </div>
  );
}
