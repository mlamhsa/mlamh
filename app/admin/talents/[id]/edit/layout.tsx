import type { ReactNode } from "react";
import { AdminNationalityFieldEnhancer } from "@/components/admin/talents/AdminNationalityFieldEnhancer";
import { AdminTalentMarketScopeEnhancer } from "@/components/admin/talents/AdminTalentMarketScopeEnhancer";

export default function EditTalentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNationalityFieldEnhancer />
      <AdminTalentMarketScopeEnhancer />
      {children}
    </>
  );
}
