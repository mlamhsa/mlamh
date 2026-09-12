import type { ReactNode } from "react";

export default function AccountTypeLayout({ children }: { children: ReactNode }) {
  return <div className="bg-[#101010] pt-20 lg:pt-24">{children}</div>;
}
