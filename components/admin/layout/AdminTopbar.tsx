import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { isFeatureEnabled } from "@/config/features";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-background/90 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
            Platform Control
          </p>

          <p className="mt-1 text-sm text-white/45">
            Manage talents, publishers, opportunities, and applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFeatureEnabled("notifications") ? (
            <Link
              href="/admin/notifications"
              className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Notifications
            </Link>
          ) : null}

          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}