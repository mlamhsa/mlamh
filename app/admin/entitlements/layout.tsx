import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldOff, Sparkles } from "lucide-react";

import AdminEntitlementActions from "@/components/admin/entitlements/AdminEntitlementActions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type EntitlementRow = {
  id: number;
  entitlement_code: string;
  target_type: string | null;
  target_id: string | null;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

type TalentRow = { id: number; name_ar: string | null; name_en: string | null };

function isActive(row: EntitlementRow) {
  const now = Date.now();
  if (row.status !== "active" || row.revoked_at) return false;
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  return !row.expires_at || new Date(row.expires_at).getTime() > now;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export default async function AdminEntitlementsLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("entitlements")
    .select("id, entitlement_code, target_type, target_id, status, starts_at, expires_at, revoked_at")
    .eq("status", "active")
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) console.error("[AdminEntitlementsLayout]", error);

  const activeRows = ((data ?? []) as EntitlementRow[]).filter(isActive);
  const talentIds = [...new Set(activeRows.filter((row) => row.target_type === "talent" && row.target_id).map((row) => Number(row.target_id)).filter((id) => Number.isInteger(id) && id > 0))];
  const talents = new Map<number, TalentRow>();

  if (talentIds.length) {
    const { data: talentData } = await adminClient.from("talents").select("id, name_ar, name_en").in("id", talentIds);
    for (const talent of (talentData ?? []) as TalentRow[]) talents.set(talent.id, talent);
  }

  return (
    <>
      {children}
      <section dir="rtl" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-red-400/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl border border-gold/20 bg-gold/[0.06] p-2 text-gold"><ShieldOff className="h-4 w-4" /></span>
            <div>
              <h2 className="text-lg font-medium text-white">إدارة المزايا النشطة</h2>
              <p className="mt-1 text-xs leading-6 text-white/40">إيقاف الميزة ينهي الاستحقاق فورًا مع الاحتفاظ بسجل الدفع والإيراد التاريخي. لا يتم تنفيذ أي استرجاع مالي تلقائيًا.</p>
            </div>
          </div>

          {activeRows.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-sm text-white/40">لا توجد مزايا نشطة حاليًا.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {activeRows.map((row) => {
                const talent = row.target_type === "talent" && row.target_id ? talents.get(Number(row.target_id)) : null;
                const targetName = talent?.name_ar || talent?.name_en || (row.target_type === "talent" ? `موهبة #${row.target_id}` : `${row.target_type ?? "account"} #${row.target_id ?? "—"}`);
                return (
                  <div key={row.id} className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-gold"><Sparkles className="h-3.5 w-3.5" /><span className="text-xs">{row.entitlement_code === "featured_talent" ? "موهبة مميزة" : row.entitlement_code}</span></div>
                      {talent && row.target_id ? (
                        <Link href={`/admin/talents/${row.target_id}?lang=ar`} className="mt-1 block truncate text-sm text-white/80 hover:text-gold">{targetName}</Link>
                      ) : (
                        <p className="mt-1 truncate text-sm text-white/70">{targetName}</p>
                      )}
                      <p className="mt-1 text-[11px] text-white/30">من {formatDate(row.starts_at)} إلى {formatDate(row.expires_at)}</p>
                    </div>
                    <AdminEntitlementActions entitlementId={row.id} locale="ar" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
