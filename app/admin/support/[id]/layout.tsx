import type { ReactNode } from "react";

import FlashQueryCleanup from "./FlashQueryCleanup";

export default function AdminSupportTicketLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FlashQueryCleanup />
      {children}
    </>
  );
}
