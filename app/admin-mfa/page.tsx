import { redirect } from "next/navigation";

import { AdminMfaGate } from "@/components/admin/security/AdminMfaGate";
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
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== "admin") {
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
          <h1 className="mt-2 text-2xl font-semibold">دخول الإدارة المحمي</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">
            تتطلب لوحة الإدارة جلسة مصادقة بمستوى AAL2. لن يتم عرض بيانات الإدارة قبل إكمال التحقق بخطوتين.
          </p>
        </div>

        <AdminMfaGate />
      </section>
    </main>
  );
}
