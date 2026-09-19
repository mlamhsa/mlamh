import { notFound } from "next/navigation";

import { CastingProjectNav } from "@/components/admin/casting/CastingProjectNav";

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
    <CastingProjectNav projectId={projectId} />
    {children}
  </>;
}
