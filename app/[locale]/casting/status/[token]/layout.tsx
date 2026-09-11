import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

import ClientFilesAnchor from "./client-files-anchor";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale?: string; token: string }>;
};

function fileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function money(value: unknown) {
  const parsed = Number(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number.isFinite(parsed) ? parsed : 0);
}

const categoryLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: "ملف مشروع", en: "Project file" },
  call_sheet: { ar: "Call Sheet", en: "Call sheet" },
  brief: { ar: "Brief", en: "Brief" },
  reference: { ar: "مرجع", en: "Reference" },
  contract: { ar: "عقد", en: "Contract" },
  invoice: { ar: "فاتورة", en: "Invoice" },
  deliverable: { ar: "ملف تسليم", en: "Deliverable" },
  other: { ar: "ملف", en: "File" },
};

export default async function CastingClientWorkspaceLayout({ children, params }: Props) {
  const { locale = "ar", token } = await params;
  const language = locale === "en" ? "en" : "ar";
  const ar = language === "ar";
  const cleanToken = token.trim();
  if (!cleanToken || cleanToken.length > 100) return children;

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("casting_projects")
    .select("id,service_mode,launch_offer_slot,payment_plan,quoted_amount,currency,package_code,status")
    .eq("client_access_token", cleanToken)
    .maybeSingle();

  if (!project || project.service_mode !== "managed") return children;

  const [{ data: files, error }, { data: payments }] = await Promise.all([
    admin
      .from("casting_project_files")
      .select("id,file_name,storage_path,mime_type,size_bytes,category,created_at")
      .eq("casting_project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false }),
    admin
      .from("casting_payments")
      .select("id,status,amount,currency,milestone_code,milestone_sequence,due_percent")
      .eq("casting_project_id", project.id)
      .order("milestone_sequence", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  if (error) console.error("[CastingClientWorkspaceLayout files]", error);

  const rows = await Promise.all((files ?? []).map(async (file) => {
    const { data } = await admin.storage.from("casting-project-files").createSignedUrl(file.storage_path, 60 * 60);
    return { ...file, signedUrl: data?.signedUrl ?? null };
  }));

  const paymentRows = payments ?? [];
  const duePayments = paymentRows.filter((item) => item.status === "pending" && Number(item.amount) > 0);
  const freeLaunch = Boolean(project.launch_offer_slot) || project.payment_plan === "launch_free";

  return <>
    <style>{`main section#files{display:none}`}</style>

    {(freeLaunch || duePayments.length > 0) ? <div dir={ar ? "rtl" : "ltr"} className="bg-black px-4 pt-20 text-white sm:px-6 lg:pt-28">
      <div className="mx-auto max-w-6xl">
        {freeLaunch ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-200">{ar ? "عرض الإطلاق — مشروعك الأول بدون رسوم خدمة" : "Launch offer — your first project has no service fee"}</p>
              <p className="mt-1 text-xs leading-6 text-white/40">{ar ? `تم حجز مقعدكم ضمن أول 5 عملاء${project.launch_offer_slot ? ` · العميل #${project.launch_offer_slot}` : ""}.` : `Your place is reserved in the first 5 clients${project.launch_offer_slot ? ` · client #${project.launch_offer_slot}` : ""}.`}</p>
            </div>
            <span className="w-fit rounded-full border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-200">FREE LAUNCH PROJECT</span>
          </div>
        </div> : <div className="rounded-2xl border border-gold/25 bg-gold/[0.05] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gold">{ar ? "دفعة مطلوبة للمشروع" : "Project payment required"}</p>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-white/45">{project.payment_plan === "pro_50_50" ? (ar ? "Managed Pro يعمل بنظام 50% لبدء الكاستينغ و50% قبل تأكيد المواهب والحجز." : "Managed Pro uses 50% to activate casting and 50% before talent confirmation and booking.") : (ar ? "تبدأ ملامح مرحلة التشغيل المطلوبة بعد إتمام الدفعة بأمان عبر Tap." : "MLAMH starts the required operating stage after secure payment through Tap.")}</p>
            </div>
            <div className="flex flex-wrap gap-2">{duePayments.map((payment) => <Link key={payment.id} href={`/api/casting/payment/checkout?token=${encodeURIComponent(cleanToken)}&payment=${payment.id}&locale=${language}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110">{ar ? "ادفع" : "Pay"} {money(payment.amount)} {payment.currency}{payment.due_percent ? ` · ${money(payment.due_percent)}%` : ""}</Link>)}</div>
          </div>
        </div>}
      </div>
    </div> : null}

    {children}
    <ClientFilesAnchor />
    <section data-managed-client-files dir={ar ? "rtl" : "ltr"} className="bg-background px-4 pb-24 text-white sm:px-6">
      <div className="mx-auto max-w-6xl scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">FILES & DELIVERABLES</p>
        <h2 className="mt-2 text-2xl font-light text-white">{ar ? "ملفات المشروع" : "Project files"}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">{ar ? "الملفات التي شاركها فريق ملامح معكم، مثل Call Sheet والتعليمات والعقود وملفات التسليم." : "Files shared with you by MLAMH, including call sheets, instructions, contracts, and deliverables."}</p>

        {rows.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6"><p className="text-sm text-white/45">{ar ? "لا توجد ملفات مشتركة حاليًا." : "No shared files yet."}</p><p className="mt-2 text-xs leading-6 text-white/30">{ar ? "عند مشاركة أي ملف مرتبط بالمشروع سيظهر هنا تلقائيًا." : "Any project file shared by MLAMH will appear here automatically."}</p></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{rows.map((file) => {
          const label = categoryLabels[file.category] ?? categoryLabels.other;
          return <article key={file.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className="rounded-full border border-gold/20 px-2.5 py-1 text-[10px] text-gold">{ar ? label.ar : label.en}</span><p className="mt-3 break-words text-sm font-medium text-white/80">{file.file_name}</p><p className="mt-2 text-xs text-white/30">{fileSize(file.size_bytes)}</p></div>{file.signedUrl ? <a href={file.signedUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-2.5 text-xs text-gold">{ar ? "فتح الملف" : "Open file"}</a> : null}</div></article>;
        })}</div>}

        <p className="mt-5 text-xs leading-6 text-white/25">{ar ? "روابط الملفات مؤقتة وآمنة. إذا انتهت صلاحية رابط، أعد فتح مساحة المشروع للحصول على رابط جديد." : "File links are temporary and secure. Reopen this workspace to generate a fresh link if one expires."}</p>
      </div>
    </section>
  </>;
}
