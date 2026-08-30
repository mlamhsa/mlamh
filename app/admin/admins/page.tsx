import { ShieldCheck, UserCog } from "lucide-react";

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

export const metadata = {
  title: "Admins & Roles — MLAMH Admin",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = lang !== "en";
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("admin_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load admins: ${error.message}`);
  }

  const admins = (data ?? []) as AdminUserRow[];

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="mx-auto max-w-6xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10">
      <section className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH ADMIN</p>
        <h1 className="mt-3 text-3xl font-light md:text-5xl">
          {isArabic ? "المشرفون والصلاحيات" : "Admins & Roles"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
          {isArabic
            ? "عرض حسابات الإدارة المسجلة والأدوار المرتبطة بها."
            : "Review registered admin accounts and their assigned roles."}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-gold/15 bg-gold/[0.035] p-5">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <ShieldCheck className="h-4 w-4 text-gold" />
            {isArabic ? "إجمالي المشرفين" : "Total admins"}
          </div>
          <p className="mt-3 text-3xl font-light">{admins.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <UserCog className="h-4 w-4" />
            {isArabic ? "إدارة الصلاحيات" : "Role management"}
          </div>
          <p className="mt-3 text-sm leading-6 text-white/55">
            {isArabic
              ? "الصفحة تعرض الصلاحيات الحالية. إضافة وتعديل الأدوار ستُربط لاحقًا بسياسة صلاحيات دقيقة قبل فتحها من الواجهة."
              : "This page shows current roles. Role editing will be enabled after granular permissions are finalized."}
          </p>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-medium">{isArabic ? "حسابات الإدارة" : "Admin accounts"}</h2>
        </div>
        {admins.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/40">
            {isArabic ? "لا توجد حسابات إدارة." : "No admin accounts found."}
          </p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {admins.map((admin) => (
              <div key={admin.id} className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p dir="ltr" className="truncate text-sm text-white/80">{admin.email}</p>
                  <p className="mt-1 truncate font-mono text-[10px] text-white/25">{admin.id}</p>
                </div>
                <span className="w-fit rounded-full border border-gold/20 bg-gold/[0.08] px-3 py-1 text-xs text-gold">
                  {admin.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
