import Link from "next/link";

import AdminManagedOpportunityForm from "@/components/admin/opportunities/AdminManagedOpportunityForm";
import { requireAdminAccess } from "@/lib/auth/require-admin";

export const metadata = {
  title: "Create Managed Opportunity — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCreateOpportunityPage() {
  await requireAdminAccess();

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c8a45d]">
              MLAMH Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              إنشاء فرصة مُدارة
            </h1>

            <p className="mt-2 text-sm text-white/50">
              انشر فرصة باسم ملامح أو نيابة عن عميل بدون إنشاء حساب ناشر.
            </p>
          </div>

          <Link
            href="/admin/opportunities"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            العودة للفرص
          </Link>
        </div>

        <AdminManagedOpportunityForm />
      </div>
    </main>
  );
}