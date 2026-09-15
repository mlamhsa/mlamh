import Link from "next/link";
import { Bell } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Notification = {
  id: number;
  message: string;
  created_at: string;
};

export default async function TalentNotificationsPage() {
  const locale = "ar";
  const isRtl = true;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>{isRtl ? "يرجى تسجيل الدخول أولاً" : "Please login first"}</p>
      </main>
    );
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,message,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items: Notification[] = notifications ?? [];

  return (
    <main className="min-h-screen bg-black px-5 pb-28 pt-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-7">
        <header className="border-b border-white/10 pb-7">
          <div className="flex items-center gap-3 text-gold">
            <Bell size={20} />
            <p className="text-xs uppercase tracking-[0.3em]">MLAMH Talent</p>
          </div>
          <h1 className="mt-3 text-4xl font-light">الإشعارات</h1>
          <p className="mt-3 text-sm leading-7 text-white/45">
            آخر تحديثات طلباتك وفرصك وحسابك في ملامح.
          </p>
        </header>

        {items.length > 0 ? (
          <section className="space-y-3">
            {items.map((notification) => (
              <article
                key={notification.id}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
              >
                <p className="text-sm leading-7 text-white/80">{notification.message}</p>
                <p className="mt-3 text-xs text-white/35">
                  {new Date(notification.created_at).toLocaleString("ar-SA")}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <Bell className="mx-auto text-white/25" size={30} />
            <h2 className="mt-4 text-lg font-medium">لا توجد إشعارات جديدة</h2>
            <p className="mt-2 text-sm leading-7 text-white/40">
              ستظهر هنا تحديثات التقديمات والفرص المهمة عند توفرها.
            </p>
            <Link
              href={`/${locale}/opportunities`}
              className="mt-6 inline-flex rounded-full border border-gold/40 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
            >
              استعراض الفرص
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
