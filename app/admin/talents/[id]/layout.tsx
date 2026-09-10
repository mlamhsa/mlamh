import type { ReactNode } from "react";

import { AdminTalentEntitlementsPanel } from "@/components/admin/talents/AdminTalentEntitlementsPanel";
import { AdminTalentResidenceCountryPanel } from "@/components/admin/talents/AdminTalentResidenceCountryPanel";
import { requireAdminAccess } from "@/lib/auth/require-admin";

export default async function AdminTalentWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();
  const { id } = await params;
  const talentId = Number(id);
  const validTalentId = Number.isInteger(talentId) && talentId > 0;

  return (
    <>
      {validTalentId ? (
        <>
          <AdminTalentEntitlementsPanel talentId={talentId} language="ar" />
          <AdminTalentResidenceCountryPanel talentId={talentId} language="ar" />
        </>
      ) : null}
      {children}
    </>
  );
}
