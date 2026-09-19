import type { ReactNode } from "react";

import { requireAdminAccess } from "@/lib/auth/require-admin";

export default async function AdminOpportunityDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminAccess();
  return children;
}
