import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type Notification = {
  id: string;
  type: string;
  message: string;
  reference_id: string | null;
  read: boolean | null;
  created_at: string;
};

export default async function TalentNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-8" dir={isRtl ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold">
          {isRtl ? "غير مصرح" : "Unauthorized"}
        </h1>
        <p className="mt-4 text-red-600">
          {isRtl
            ? "يجب تسجيل الدخول للوصول إلى الإشعارات."
            : "You must be signed in to view notifications."}
        </p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notifications = (data ?? []) as Notification[];

  return (
    <main className="p-6 md:p-10" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {isRtl ? "الإشعارات" : "Notifications"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isRtl
            ? "تابع آخر تحديثات طلباتك وفرصك."
            : "Track the latest updates for your applications and opportunities."}
        </p>
      </div>

      {error ? (
        <p className="text-red-600">
          {isRtl ? "تعذر تحميل الإشعارات." : "Failed to load notifications."}
        </p>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground">
            {isRtl ? "لا توجد إشعارات حالياً." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl border bg-background p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{notification.message}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString(
                      isRtl ? "ar-SA" : "en-US"
                    )}
                  </p>
                </div>

                {!notification.read && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
                    {isRtl ? "جديد" : "New"}
                  </span>
                )}
              </div>

              {notification.reference_id && (
                <Link
                  href={`/${locale}/talent-dashboard/applications`}
                  className="mt-4 inline-block text-sm underline"
                >
                  {isRtl ? "عرض الطلبات" : "View applications"}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}