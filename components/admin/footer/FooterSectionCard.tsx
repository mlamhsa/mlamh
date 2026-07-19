import type { ReactNode } from "react";

import { AdminCard } from "@/components/admin/ui/AdminCard";

type FooterSectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function FooterSectionCard({
  title,
  description,
  actions,
  children,
}: FooterSectionCardProps) {
  return (
    <AdminCard className="overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-2xl font-light text-white"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {title}
            </h2>

            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-gray-muted">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </AdminCard>
  );
}