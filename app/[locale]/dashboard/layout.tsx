"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/ar/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.account_type) {
        await supabase.auth.signOut();
        router.replace("/ar/login");
        return;
      }
    };

    getUser();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white">
      {children}
    </main>
  );
}