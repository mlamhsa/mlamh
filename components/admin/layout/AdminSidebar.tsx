import Link from "next/link";
import { adminNavigation } from "./admin-navigation";

export function AdminSidebar() {
  return (
    <aside className="hidden border-r border-white/[0.08] bg-black/40 px-5 py-6 lg:block">
      <Link href="/admin" className="block border-b border-white/[0.08] pb-6">
        <p className="text-[10px] uppercase tracking-[0.45em] text-gold">
          MLAMH
        </p>

        <p className="mt-2 text-xl font-light text-white">Admin Console</p>
      </Link>

      <nav className="mt-6 grid gap-1">
        {adminNavigation.map((item) => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            className="rounded-2xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/[0.04] hover:text-gold"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}