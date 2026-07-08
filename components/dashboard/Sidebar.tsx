import Link from "next/link";

export default function Sidebar({ role }: { role: string | null }) {
  return (
    <aside className="w-64 border-r border-white/10 p-4">

      <h2 className="mb-6 text-lg font-bold">
        Dashboard
      </h2>

      <nav className="flex flex-col gap-3 text-sm">

        <Link href="/dashboard">Home</Link>

        {role === "talent" && (
          <>
            <Link href="/dashboard/profile">Profile</Link>
            <Link href="/dashboard/applications">Applications</Link>
          </>
        )}

        {role === "publisher" && (
          <>
            <Link href="/dashboard/opportunities">Opportunities</Link>
            <Link href="/dashboard/applicants">Applicants</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link href="/dashboard/admin">Admin Panel</Link>
            <Link href="/dashboard/users">Users</Link>
          </>
        )}

        <Link href="/">Back to site</Link>
      </nav>
    </aside>
  );
}