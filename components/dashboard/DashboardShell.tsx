"use client";

import { ReactNode } from "react";

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar موحد */}
      <aside className="w-64 border-r border-white/10 p-4">
        <h2 className="mb-6 text-lg font-bold">Dashboard</h2>

        <nav className="space-y-3 text-sm text-white/70">
          <a href="#" className="block hover:text-white">
            Overview
          </a>
          <a href="#" className="block hover:text-white">
            Notifications
          </a>
          <a href="#" className="block hover:text-white">
            Settings
          </a>
        </nav>
      </aside>

      {/* المحتوى */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}