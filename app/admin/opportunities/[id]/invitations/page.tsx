import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOpportunityInvitationsPage({
  params,
}: PageProps) {
  await requireAdminAccess();

  const { id } = await params;
  const opportunityId = Number(id);

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    notFound();
  }

  const adminClient = createAdminClient();

  const {
    data: opportunity,
    error: opportunityError,
  } = await adminClient
    .from("opportunities")
    .select(`
      id,
      title,
      status,
      published
    `)
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError) {
    throw new Error(
      `[AdminOpportunityInvitationsPage opportunity] ${opportunityError.message}`,
    );
  }

  if (!opportunity) {
    notFound();
  }

  const {
    data: invitations,
    error: invitationsError,
  } = await adminClient
    .from("opportunity_invitations")
    .select(`
      id,
      status,
      created_at,
      read_at,
      applied_at,
      talents (
        id,
        slug,
        image_url,
        name_ar,
        name_en,
        city_ar,
        gender
      )
    `)
    .eq("opportunity_id", opportunityId)
    .order("created_at", {
      ascending: false,
    });

  if (invitationsError) {
    throw new Error(
      `[AdminOpportunityInvitationsPage invitations] ${invitationsError.message}`,
    );
  }

  const invitationList = invitations ?? [];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/admin/opportunities/${opportunity.id}`}
          className="text-sm text-gold"
        >
          ← Back to Opportunity
        </Link>

        <h1 className="mt-8 text-4xl font-light">
          Opportunity Invitations
        </h1>

        <p className="mt-3 text-white/60">
          {opportunity.title || "Untitled Opportunity"}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-sm text-white/60">
            Total invitations: {invitationList.length}
          </p>
        </div>
      </div>
    </main>
  );
}