import Link from "next/link";
import {
  signInTalentAction,
  signUpTalentAction,
} from "@/lib/actions/talent-auth";

export const metadata = {
  title: "Talent Login — MLAMH",
};

export default function TalentLoginPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.35em] text-gold transition hover:text-gold-soft"
        >
          ← Back to MLAMH
        </Link>

        <header className="mt-12 mb-10 max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            MLAMH TALENT
          </p>

          <h1
            className="mt-4 text-5xl font-light tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Talent Access
          </h1>

          <p className="mt-5 text-sm leading-7 text-gray-muted">
            Sign in to manage your profile, availability, gallery, and talent
            requests.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h2 className="text-2xl font-light text-white">Sign in</h2>

            <form action={signInTalentAction} className="mt-6 space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <button
                type="submit"
                className="w-full rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
              >
                Sign in
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h2 className="text-2xl font-light text-white">
              Create talent account
            </h2>

            <form action={signUpTalentAction} className="mt-6 space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Password"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <button
                type="submit"
                className="w-full rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:border-gold/40 hover:text-gold"
              >
                Create account
              </button>
            </form>

            <p className="mt-4 text-xs leading-6 text-gray-muted">
              Google, Apple, and mobile OTP login can be added after the first
              dashboard version is stable.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}