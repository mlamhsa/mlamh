import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCastingProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("casting_projects")
    .select("id,service_mode")
    .eq("id", projectId)
    .maybeSingle();

  if (error) console.error("[AdminCastingProjectLayout]", error);
  if (!project || project.service_mode !== "managed") notFound();

  return <>
    <div className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#050505]/90 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto" aria-label="Managed casting project navigation">
        <Link href={`/admin/casting/${projectId}`} className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold">المشروع</Link>
        <Link href={`/admin/casting/${projectId}/applications`} className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold">الفرز</Link>
        <Link href={`/admin/casting/${projectId}/supply`} className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold">المطابقة</Link>
        <Link href={`/admin/casting/${projectId}/files`} className="whitespace-nowrap rounded-lg border border-gold/25 bg-gold/[0.05] px-3 py-2 text-xs text-gold transition hover:bg-gold/10">الملفات</Link>
        <Link href={`/admin/casting/${projectId}/sales`} className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold">المبيعات</Link>
      </nav>
    </div>
    {children}
  </>;
}
