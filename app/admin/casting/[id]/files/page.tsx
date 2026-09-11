import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteCastingProjectFileAction,
  updateCastingProjectFileVisibilityAction,
  uploadCastingProjectFileAction,
} from "@/lib/actions/admin-casting-files";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const labels: Record<string, { ar: string; en: string }> = {
  general: { ar: "عام", en: "General" },
  call_sheet: { ar: "Call Sheet", en: "Call sheet" },
  brief: { ar: "Brief", en: "Brief" },
  reference: { ar: "مرجع", en: "Reference" },
  contract: { ar: "عقد", en: "Contract" },
  invoice: { ar: "فاتورة", en: "Invoice" },
  deliverable: { ar: "تسليم", en: "Deliverable" },
  other: { ar: "أخرى", en: "Other" },
};

function fileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function CastingFilesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requireAdminAccess();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  const language = query.lang === "en" ? "en" : "ar";
  const ar = language === "ar";
  const admin = createAdminClient();

  const [{ data: project }, { data: files, error: filesError }] = await Promise.all([
    admin.from("casting_projects").select("id,project_title,service_mode,client_access_token").eq("id", projectId).maybeSingle(),
    admin.from("casting_project_files").select("id,file_name,storage_path,mime_type,size_bytes,category,visible_to_client,created_at").eq("casting_project_id", projectId).order("created_at", { ascending: false }),
  ]);
  if (!project || project.service_mode !== "managed") notFound();
  if (filesError) throw new Error(filesError.message);

  const rows = await Promise.all((files ?? []).map(async (file) => {
    const { data } = await admin.storage.from("casting-project-files").createSignedUrl(file.storage_path, 60 * 60);
    return { ...file, signedUrl: data?.signedUrl ?? null };
  }));

  return <div dir={ar ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><Link href={`/admin/casting/${projectId}?lang=${language}`} className="text-xs text-gold hover:underline">{ar ? "← العودة للمشروع" : "← Back to project"}</Link><p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">PROJECT FILES</p><h1 className="mt-2 text-3xl font-light text-white">{project.project_title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">{ar ? "ارفع ملفات المشروع وحدد ما يظهر للعميل في مساحة المشروع الخاصة به." : "Upload project files and control which ones appear in the private client workspace."}</p></div><div className="flex gap-2"><Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60">{ar ? "مركز الفرز" : "Screening"}</Link>{project.client_access_token ? <Link target="_blank" href={`/${language}/casting/status/${project.client_access_token}#files`} className="rounded-xl border border-gold/25 px-4 py-2.5 text-sm text-gold">{ar ? "عرض ملفات العميل" : "Client files"}</Link> : null}</div></div>

    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><h2 className="text-xl font-light text-white">{ar ? "رفع ملف" : "Upload file"}</h2><form action={uploadCastingProjectFileAction} className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end"><input type="hidden" name="project_id" value={projectId}/><label className="block"><span className="mb-2 block text-xs text-white/40">{ar ? "الملف" : "File"}</span><input required type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className="block min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-2 file:text-black"/></label><label><span className="mb-2 block text-xs text-white/40">{ar ? "التصنيف" : "Category"}</span><select name="category" defaultValue="general" className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white/70">{Object.entries(labels).map(([key,value]) => <option key={key} value={key}>{ar ? value.ar : value.en}</option>)}</select></label><label><span className="mb-2 block text-xs text-white/40">{ar ? "ظهور للعميل" : "Client visibility"}</span><select name="visible_to_client" defaultValue="true" className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white/70"><option value="true">{ar ? "ظاهر" : "Visible"}</option><option value="false">{ar ? "داخلي فقط" : "Internal only"}</option></select></label><button className="min-h-12 rounded-xl bg-gold px-6 text-sm font-medium text-black">{ar ? "رفع الملف" : "Upload"}</button></form><p className="mt-3 text-xs text-white/25">PDF, JPG, PNG, WEBP, DOC/DOCX, XLS/XLSX · Max 20 MB</p></section>

    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-light text-white">{ar ? "ملفات المشروع" : "Project files"}</h2><span className="text-sm text-white/35">{rows.length}</span></div>{rows.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/35">{ar ? "لا توجد ملفات حتى الآن." : "No project files yet."}</div> : <div className="mt-5 space-y-3">{rows.map((file) => <div key={file.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="truncate text-sm text-white/80">{file.file_name}</p><p className="mt-1 text-xs text-white/30">{labels[file.category] ? (ar ? labels[file.category].ar : labels[file.category].en) : file.category} · {fileSize(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString(ar ? "ar-SA" : "en-US")}</p><p className={`mt-1 text-[11px] ${file.visible_to_client ? "text-emerald-300" : "text-amber-200"}`}>{file.visible_to_client ? (ar ? "ظاهر للعميل" : "Visible to client") : (ar ? "داخلي فقط" : "Internal only")}</p></div><div className="flex flex-wrap gap-2">{file.signedUrl ? <a href={file.signedUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">{ar ? "فتح" : "Open"}</a> : null}<form action={updateCastingProjectFileVisibilityAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="file_id" value={file.id}/><input type="hidden" name="visible_to_client" value={file.visible_to_client ? "false" : "true"}/><button className="rounded-lg border border-gold/20 px-3 py-2 text-xs text-gold">{file.visible_to_client ? (ar ? "اجعله داخلي" : "Make internal") : (ar ? "إظهار للعميل" : "Share with client")}</button></form><form action={deleteCastingProjectFileAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="file_id" value={file.id}/><button className="rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200">{ar ? "حذف" : "Delete"}</button></form></div></div></div>)}</div>}</section>
  </div></div>;
}
