"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { logout } from "@/lib/auth/logout";

export default function NavbarUserMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!user) return null;

  return (
    <div className="relative group">
      {/* USER BUTTON */}
      <button className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 hover:border-gold/40 transition">
        
        <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm">
        {user.email?.[0]?.toUpperCase() ?? "U"}
        </div>

        <div className="text-right hidden md:block">
          <p className="text-xs text-white">{user.email}</p>
          <p className="text-[10px] text-gray-muted">Talent</p>
        </div>

        <span className="text-gold text-xs">⌄</span>
      </button>

      {/* DROPDOWN */}
      <div className="absolute left-0 mt-2 hidden w-44 rounded-xl border border-white/10 bg-[#0b0b0b] p-2 group-hover:block">
        
        <button className="w-full text-right px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg">
          الملف الشخصي
        </button>

        <button className="w-full text-right px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg">
          الإعدادات
        </button>

        <button
          onClick={logout}
          className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
        >
          تسجيل الخروج
        </button>

      </div>
    </div>
  );
}