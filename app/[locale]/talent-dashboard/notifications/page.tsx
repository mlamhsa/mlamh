import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TalentNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-black p-8 text-white" dir={isRtl ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold">{isRtl ? "غير مصرح" : "Unauthorized"}</h1>
      </main>
    );
  }

  await adminClient
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .or("read.eq.false,read.is.null");

  const { data: talent } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: storedNotifications } = await adminClient
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: applications } = talent
    ? await adminClient
        .from("opportunity_applications")
        .select(`
          id,
          status,
          created_at,
          opportunities (
            title,
            opportunity_type
          )
        `)
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const generatedNotifications =
    applications?.map((application: any) => {
      const opportunity = Array.isArray(application.opportunities)
        ? application.opportunities[0]
        : application.opportunities;

      const title = opportunity?.title ?? (isRtl ? "فرصة" : "Opportunity");

      let message = isRtl
        ? `تم تحديث طلبك على فرصة "${title}".`
        : `Your application for "${title}" was updated.`;

      if (application.status === "accepted") {
        message = isRtl
          ? `تم قبول طلبك في فرصة "${title}".`
          : `Your application for "${title}" was accepted.`;
      }

      if (application.status === "shortlisted") {
        message = isRtl
          ? `تمت إضافة طلبك إلى القائمة المختصرة في فرصة "${title}".`
          : `Your application for "${title}" was shortlisted.`;
      }

      if (application.status === "rejected") {
        message = isRtl
          ? `تم رفض طلبك في فرصة "${title}".`
          : `Your application for "${title}" was rejected.`;
      }

      return {
        id: application.id,
        message,
        read: true,
        created_at: application.created_at,
        reference_id: application.id,
      };
    }) ?? [];

  const notifications =
    storedNotifications && storedNotifications.length > 0
      ? storedNotifications
      : generatedNotifications;

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black px-6 py-8 text-white md:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "مركز الإشعارات" : "Notification Center"}
            </p>

            <h1 className="mt-3 text-4xl font-light md:text-5xl">
              {isRtl ? "الإشعارات" : "Notifications"}
            </h1>

            <p className="mt-3 text-sm text-white/45">
              {isRtl
                ? "تابع آخر تحديثات طلباتك وفرصك في مكان واحد."
                : "Track your latest application and opportunity updates in one place."}
            </p>
          </div>

          <Link
            href={`/${locale}/talent-dashboard`}
            className="rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Link>
        </div>

        {notifications.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.025] p-12 text-center">
            <p className="text-2xl font-light text-white">
              {isRtl ? "لا توجد إشعارات حالياً" : "No notifications yet"}
            </p>
            <p className="mt-3 text-sm text-white/40">
              {isRtl
                ? "عند تحديث طلباتك أو فرصك ستظهر التنبيهات هنا."
                : "When your applications or opportunities update, notifications will appear here."}
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {notifications.map((notification: any) => (
              <article
                key={notification.id}
                className="group rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 transition hover:border-gold/30 hover:bg-gold/[0.03]"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                      !
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-light leading-8 text-white">
                          {notification.message}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-white/40">
                        {new Date(notification.created_at).toLocaleString(
                          isRtl ? "ar-SA" : "en-US"
                        )}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/talent-dashboard/requests`}
                    className="shrink-0 rounded-full border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isRtl ? "عرض الطلبات" : "View applications"}
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}