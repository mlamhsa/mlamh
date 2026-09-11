import { createAdminClient } from "@/lib/supabase/admin";

import ClientAccountBanner from "./client-account-banner";
import ClientFilesAnchor from "./client-files-anchor";
import PaymentReturnBanner from "./payment-return-banner";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale?: string; token: string }>;
};

function fileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const replacementLabels: Record<string, { ar: string; en: string }> = {
  replacement_started: { ar: "بدأ الاستبدال", en: "Replacement started" },
  replacement_confirming: { ar: "جاري تأكيد البديل", en: "Confirming replacement" },
  replacement_confirmed: { ar: "تم تأكيد البديل", en: "Replacement confirmed" },
  replacement_failed: { ar: "يحتاج متابعة من ملامح", en: "Needs MLAMH follow-up" },
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
    .select("id,service_mode,contact_email,client_user_id")
    .eq("client_access_token", cleanToken)
    .maybeSingle();

  if (!project || project.service_mode !== "managed") return children;

  const [{ data: files, error }, { data: latestReplacement }] = await Promise.all([
    admin
      .from("casting_project_files")
      .select("id,file_name,storage_path,mime_type,size_bytes,category,created_at")
      .eq("casting_project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false }),
    admin
      .from("managed_casting_replacements")
      .select("id,status,replacement_talent_id,reason,created_at")
      .eq("casting_project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) console.error("[CastingClientWorkspaceLayout files]", error);

  const rows = await Promise.all((files ?? []).map(async (file) => {
    const { data } = await admin.storage.from("casting-project-files").createSignedUrl(file.storage_path, 60 * 60);
    return { ...file, signedUrl: data?.signedUrl ?? null };
  }));

  let replacementTalentName: string | null = null;
  if (latestReplacement?.replacement_talent_id) {
    const { data: talent } = await admin
      .from("talents")
      .select("display_name_ar,display_name_en,name_ar,name_en")
      .eq("id", latestReplacement.replacement_talent_id)
      .maybeSingle();
    replacementTalentName = ar
      ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en || null
      : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar || null;
  }
  const replacementLabel = latestReplacement
    ? replacementLabels[latestReplacement.status] ?? { ar: latestReplacement.status, en: latestReplacement.status }
    : null;

  return <>
    <style>{`main section#files{display:none}`}</style>
    <PaymentReturnBanner locale={language} />
    <ClientAccountBanner locale={language} token={cleanToken} claimed={Boolean(project.client_user_id)} canClaim={Boolean(project.contact_email?.trim())} />
    {children}
    {latestReplacement && replacementLabel ? <section dir={ar ? "rtl" : "ltr"} className="bg-background px-4 pt-2 text-white sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.04] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200">MLAMH CASTING GUARANTEE</p>
            <h2 className="mt-2 text-2xl font-light text-white">{ar ? "ضمان الاستبدال مفعل" : "Replacement guarantee active"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/50">{ar
              ? `عند تعذر استمرار إحدى المواهب المختارة، فعّلت ملامح موهبة احتياط بديلة${replacementTalentName ? ` (${replacementTalentName})` : ""} بدون إعادة دورة الاختيار أو رسوم إدارة إضافية.`
              : `When a selected talent could no longer proceed, MLAMH activated a reserve replacement${replacementTalentName ? ` (${replacementTalentName})` : ""} without restarting your selection cycle or adding another management fee.`}</p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-300/20 bg-black/20 px-4 py-2 text-xs text-amber-100">{ar ? replacementLabel.ar : replacementLabel.en}</span>
        </div>
      </div>
    </section> : null}
    <ClientFilesAnchor />
    <section data-managed-client-files dir={ar ? "rtl" : "ltr"} className="bg-background px-4 pb-24 pt-6 text-white sm:px-6">
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
