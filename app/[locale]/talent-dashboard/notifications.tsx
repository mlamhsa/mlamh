import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type NotificationRecord = {
  id: string | number;
  message: string | null;
  created_at: string;
};

export default async function TalentNotifications({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-white p-6 bg-black min-h-screen flex items-center justify-center">
        {isRtl ? "يرجى تسجيل الدخول أولاً" : "Please login first"}
      </div>
    );
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-light text-white">
        {isRtl ? "الإشعارات" : "Notifications"}
      </h2>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {(notifications as NotificationRecord[]).map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-white/70"
            >
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-white/40">
                {new Date(notification.created_at).toLocaleString(isRtl ? "ar-SA" : "en-US")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40">{isRtl ? "لا توجد إشعارات." : "No notifications."}</p>
      )}
    </div>
  );
}