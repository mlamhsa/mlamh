"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !user) {
        setErrorMessage("Invalid admin credentials.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setErrorMessage("Unable to sign in. Check Supabase configuration.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-white/10 bg-white/5 p-8"
      >
        <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-gold">
          MLAMH Admin
        </p>

        <h1 className="mb-6 text-2xl font-light">Admin Login</h1>

        {errorMessage ? (
          <p className="mb-4 border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </p>
        ) : null}

        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="mb-4 w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-gold/50"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mb-5 w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-gold/50"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border border-gold px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}