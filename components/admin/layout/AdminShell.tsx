import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      lang="en"
      dir="ltr"
      className="relative z-[2] min-h-screen bg-background text-white"
    >
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <AdminSidebar />

        <div className="min-w-0">
          <AdminTopbar />

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}