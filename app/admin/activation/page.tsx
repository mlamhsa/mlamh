import Link from "next/link";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Activation — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ lang?: string; type?: string; state?: string }>;
};

type ProfileRow = {
  id: number | string;
  user_id: string;
  account_type: string | null;
  display_name: string | null;
  phone: string | null;
  status: string | null;
  onboarding_status: string | null;
  onboarding_step: string | null;
  approval_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TalentPrivacyRow = {
  id: number;
  user_id: string | null;
  profile_visibility: "public" | "verified_publishers" | "private";
  photo_visibility: "public" | "verified_publishers" | "private";
  allow_search_indexing: boolean;
  require_private_share_approval: boolean;
};

function fmtDate(value: string | null, arabic: boolean) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(arabic ? "ar-SA" : "en-US", {
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function stateLabel(value: string | null, arabic: boolean) {
  const labels: Record<string, [string, string]> = {
    email_verification_required: ["بانتظار تأكيد البريد", "Email verification"],
    profile_in_progress: ["الملف قيد الاستكمال", "Profile in progress"],
    account_created: ["الحساب منشأ", "Account created"],
    completed: ["اكتمل الإعداد", "Setup completed"],
    submitted: ["تم الإرسال", "Submitted"],
  };
  if (!value) return arabic ? "غير محدد" : "Not set";
  return labels[value]?.[arabic ? 0 : 1] ?? value;
}

function visibilityLabel(value: TalentPrivacyRow["profile_visibility"] | null, arabic: boolean) {
  if (!value) return "—";
  if (value === "public") return arabic ? "عام" : "Public";
  if (value === "verified_publishers") return arabic ? "للناشرين الموثقين" : "Verified publishers";
  return arabic ? "خاص" : "Private";
}

export default async function AdminActivationPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const query = await searchParams;
  const arabic = query.lang !== "en";
  const typeFilter = query.type === "talent" || query.type === "publisher" ? query.type : "all";
  const stateFilter = query.state?.trim() || "all";
  const admin = createAdminClient();

  let profilesQuery = admin
    .from("profiles")
    .select("id,user_id,account_type,display_name,phone,status,onboarding_status,onboarding_step,approval_status,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(300);

  if (typeFilter !== "all") profilesQuery = profilesQuery.eq("account_type", typeFilter);
  if (stateFilter !== "all") profilesQuery = profilesQuery.eq("onboarding_status", stateFilter);

  const { data: rawProfiles, error: profilesError } = await profilesQuery;
  const profiles = (rawProfiles ?? []) as ProfileRow[];

  // Privacy columns are Build 11 schema. Production may intentionally not have them yet,
  // so this secondary read must fail closed without breaking the Admin activation page.
  const { data: rawPrivacy, error: privacyError } = await admin
    .from("talents")
    .select("id,user_id,profile_visibility,photo_visibility,allow_search_indexing,require_private_share_approval")
    .in("user_id", profiles.filter((item) => item.account_type === "talent").map((item) => item.user_id));

  const privacyByUser = new Map<string, TalentPrivacyRow>();
  if (!privacyError) {
    for (const row of (rawPrivacy ?? []) as TalentPrivacyRow[]) {
      if (row.user_id) privacyByUser.set(row.user_id, row);
    }
  }

  const withPhone = profiles.filter((item) => Boolean(item.phone?.trim())).length;
  const incomplete = profiles.filter((item) => item.onboarding_status !== "completed").length;
  const talents = profiles.filter((item) => item.account_type === "talent").length;
  const publishers = profiles.filter((item) => item.account_type === "publisher").length;

  const href = (params: Record<string, string>) => {
    const next = new URLSearchParams({ lang: arabic ? "ar" : "en", type: typeFilter, state: stateFilter, ...params });
    return `/admin/activation?${next.toString()}`;
  };

  return (
    <main dir={arabic ? "rtl" : "ltr"} className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{arabic ? "رحلة المستخدم" : "USER JOURNEY"}</p>
            <h1 className="mt-2 text-3xl font-light text-white">{arabic ? "التسجيل والتفعيل" : "Registration & Activation"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">{arabic ? "متابعة الحسابات من إنشاء الحساب إلى اكتمال الإعداد، مع رقم الجوال وخطوة التوقف وحالة الخصوصية عند توفر مخطط Build 11." : "Track accounts from creation through onboarding completion, including canonical phone, last step and Build 11 privacy status when available."}</p>
          </div>
          <Link href={href({ lang: arabic ? "en" : "ar" })} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:border-gold/30 hover:text-gold">{arabic ? "English" : "العربية"}</Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [arabic ? "الحسابات المعروضة" : "Accounts shown", profiles.length],
            [arabic ? "موهبة / ناشر" : "Talent / Publisher", `${talents} / ${publishers}`],
            [arabic ? "لديهم رقم جوال" : "Phone captured", `${withPhone} / ${profiles.length}`],
            [arabic ? "لم يكملوا الإعداد" : "Incomplete onboarding", incomplete],
          ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-xs text-white/40">{label}</p><p className="mt-2 text-2xl text-gold" dir="ltr">{value}</p></div>)}
        </section>

        <section className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
          {(["all", "talent", "publisher"] as const).map((type) => <Link key={type} href={href({ type })} className={`rounded-full border px-4 py-2 text-xs ${typeFilter === type ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{type === "all" ? (arabic ? "الكل" : "All") : type === "talent" ? (arabic ? "المواهب" : "Talents") : (arabic ? "الناشرون" : "Publishers")}</Link>)}
          <Link href={href({ state: "profile_in_progress" })} className={`rounded-full border px-4 py-2 text-xs ${stateFilter === "profile_in_progress" ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{arabic ? "قيد الاستكمال" : "In progress"}</Link>
          <Link href={href({ state: "completed" })} className={`rounded-full border px-4 py-2 text-xs ${stateFilter === "completed" ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{arabic ? "مكتمل" : "Completed"}</Link>
          {stateFilter !== "all" ? <Link href={href({ state: "all" })} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/45">{arabic ? "إزالة فلتر الحالة" : "Clear state"}</Link> : null}
        </section>

        {profilesError ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-300">{arabic ? "تعذر تحميل حالات الحسابات." : "Unable to load account states."}</div> : null}
        {privacyError ? <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-6 text-amber-100/70">{arabic ? "حالة الخصوصية غير متاحة في قاعدة البيانات المتصلة حاليًا. هذا متوقع قبل نشر مخطط Privacy إلى Production، ولن يؤثر على بقية لوحة التفعيل." : "Privacy status is unavailable in the currently connected database. This is expected before the Privacy schema reaches Production and does not affect the activation dashboard."}</div> : null}

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-white/[0.08] bg-black/20 text-[11px] text-white/35">
                <tr>{[
                  arabic ? "المستخدم" : "User", arabic ? "النوع" : "Type", arabic ? "الجوال" : "Phone", arabic ? "حالة الإعداد" : "Onboarding", arabic ? "آخر خطوة" : "Last step", arabic ? "الاعتماد" : "Approval", arabic ? "الخصوصية" : "Privacy", arabic ? "آخر تحديث" : "Updated",
                ].map((head) => <th key={head} className="px-4 py-3 text-start font-medium">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {profiles.map((profile) => {
                  const privacy = privacyByUser.get(profile.user_id) ?? null;
                  return <tr key={profile.user_id} className="text-white/65 hover:bg-white/[0.02]">
                    <td className="px-4 py-4"><p className="font-medium text-white/85">{profile.display_name || (arabic ? "بدون اسم" : "Unnamed")}</p><p dir="ltr" className="mt-1 max-w-[180px] truncate text-[10px] text-white/25">{profile.user_id}</p></td>
                    <td className="px-4 py-4">{profile.account_type === "talent" ? (arabic ? "موهبة" : "Talent") : profile.account_type === "publisher" ? (arabic ? "ناشر" : "Publisher") : "—"}</td>
                    <td dir="ltr" className="px-4 py-4 text-start">{profile.phone || <span className="text-amber-300/70">{arabic ? "غير موجود" : "Missing"}</span>}</td>
                    <td className="px-4 py-4">{stateLabel(profile.onboarding_status, arabic)}</td>
                    <td dir="ltr" className="px-4 py-4 text-xs text-white/45">{profile.onboarding_step || "—"}</td>
                    <td dir="ltr" className="px-4 py-4 text-xs">{profile.approval_status || "—"}</td>
                    <td className="px-4 py-4">{profile.account_type === "talent" ? visibilityLabel(privacy?.profile_visibility ?? null, arabic) : "—"}</td>
                    <td className="px-4 py-4 text-xs">{fmtDate(profile.updated_at || profile.created_at, arabic)}</td>
                  </tr>;
                })}
                {!profiles.length && !profilesError ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-white/35">{arabic ? "لا توجد حسابات مطابقة للفلاتر." : "No accounts match these filters."}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
