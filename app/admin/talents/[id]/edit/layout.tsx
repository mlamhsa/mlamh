import type { ReactNode } from "react";
import { AdminNationalityFieldEnhancer } from "@/components/admin/talents/AdminNationalityFieldEnhancer";

export default function EditTalentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNationalityFieldEnhancer />
      {children}
    </>
  );
}
