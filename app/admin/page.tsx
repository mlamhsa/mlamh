import { PendingTalentCard } from "@/components/admin/PendingTalentCard";
import { getPendingTalents } from "@/lib/supabase/pending-talents";

export const metadata = {
  title: "MLAMH Admin — Pending Talents",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const pending = await getPendingTalents();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 text-white">
      <header className="mb-10 border-b border-white/[0.08] pb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
          Internal · No auth
        </p>
        <h1
          className="mt-3 text-3xl font-light tracking-tight text-white md:text-4xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Talent review
        </h1>
        <p className="mt-3 text-sm text-gray-muted">
          {pending.length} pending application
          {pending.length === 1 ? "" : "s"}
        </p>
      </header>

      {pending.length === 0 ? (
        <p className="border border-white/[0.06] bg-gray-elevated/30 px-6 py-12 text-center text-sm text-gray-muted">
          No pending submissions.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {pending.map((talent) => (
            <li key={talent.id}>
              <PendingTalentCard talent={talent} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
