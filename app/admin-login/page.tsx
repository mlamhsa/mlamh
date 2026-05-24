"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/admin-login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.href = "/admin";
    } else {
      alert("Wrong password");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-white/10 bg-white/5 p-8"
      >
        <h1 className="mb-6 text-2xl">Admin Login</h1>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full border border-white/10 bg-black px-4 py-3"
        />

        <button
          type="submit"
          className="w-full border border-gold px-4 py-3 text-gold"
        >
          Login
        </button>
      </form>
    </main>
  );
}