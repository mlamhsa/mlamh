import type { ReactNode } from "react";

import { AdminTalentDataQualityShortcut } from "@/components/admin/talents/AdminTalentDataQualityShortcut";

export default function AdminTalentsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminTalentDataQualityShortcut />
      {children}
    </>
  );
}
