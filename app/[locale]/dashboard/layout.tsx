"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accountType, setAccountType] = useState<string | null>(null);
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

      setAccountType(profile.account_type);
    };

    getUser();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar role={accountType} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}