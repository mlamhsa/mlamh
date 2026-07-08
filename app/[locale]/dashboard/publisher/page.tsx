import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/getUserRole";

export default async function PublisherPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole(user.id);

  if (role !== "publisher") {
    redirect("/dashboard");
  }

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold">Publisher Dashboard</h1>
      <p className="text-white/70">Welcome Publisher</p>
    </div>
  );
}