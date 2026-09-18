import { redirect } from "next/navigation";

import { AdminMfaGate } from "@/components/admin/security/AdminMfaGate";
import { hasConsistentActiveAdminRole } from "@/lib/rbac/admin-access-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminMfaPage() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect("/ar/login");
  }

  const adminClient = createAdminClient();

  const [
    { data: profile, error: profileError },
    { data: adminRegistry, error: adminRegistryError },
    { data: roleAssignments, error: roleAssignmentsError },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("admin_users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle(),
    adminClient
      .from("user_roles")
      .select(`
        role_id,
        roles (
          key
        )
      `)
      .eq("user_id", user.id),
  ]);

  if (
    profileError ||
    adminRegistryError ||
    roleAssignmentsError ||
    !profile ||
    profile.account_type !== "admin" ||
    !adminRegistry ||
    !roleAssignments ||
    !hasConsistentActiveAdminRole(
      adminRegistry.role,
      roleAssignments.map(
        (assignment) => {
          const role =
            Array.isArray(
              assignment.roles,
            )
              ? assignment.roles[0]
              : assignment.roles;

          return role?.key;
        },
      ),
    )
  ) {
    redirect("/ar/login");
  }

  const assurance = await authClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!assurance.error && assurance.data.currentLevel === "aal2") {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">MLAMH SECURITY</p>
          <h1 className="mt-2 text-2xl font-semibold">التحقق بخطوتين لحساب الإدارة</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">
            هذه الخطوة مطلوبة فقط لحسابات إدارة ملامح، ولا تنطبق على المواهب أو الناشرين. لن يتم عرض بيانات الإدارة قبل إكمال جلسة المصادقة المحمية بمستوى AAL2.
          </p>
        </div>

        <AdminMfaGate />
      </section>
    </main>
  );
}
