import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

async function signOutAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  redirect(`/${locale}/login`);
}

export default async function PublisherSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const { user, publisher } = await requirePublisher(locale);
  const isIndividual = publisher.publisher_type === "individual";

  return (
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "الإعدادات" : "Settings"}
          </p>

          <h1 className="mt-3 text-4xl font-light text-white">
            {isRtl ? "إعدادات الحساب" : "Account Settings"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
            {isRtl
              ? isIndividual
                ? "إدارة حساب الناشر والروابط الأساسية. بياناتك ومعلومات مشروعك موجودة في ملف الناشر."
                : "إدارة حساب الناشر والروابط الأساسية. معلومات الجهة والصور موجودة في ملف الناشر."
              : isIndividual
                ? "Manage publisher account basics and quick links. Your details and project information are managed from the publisher profile."
                : "Manage publisher account basics and quick links. Organization information and images are managed from the publisher profile."}
          </p>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "الحساب" : "Account"}
            </p>

            <div className="mt-6 grid gap-4">
              <InfoRow
                label={isRtl ? "البريد الإلكتروني" : "Email"}
                value={user.email ?? "-"}
              />

              <InfoRow
                label={isRtl ? "نوع الحساب" : "Account Type"}
                value={isRtl ? "ناشر" : "Publisher"}
              />

              <InfoRow
                label={isRtl ? "معرّف المستخدم" : "User ID"}
                value={user.id}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.03] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-red-300">
              {isRtl ? "الخروج" : "Sign Out"}
            </p>

            <h2 className="mt-4 text-2xl font-light text-white">
              {isRtl ? "تسجيل الخروج من الحساب" : "Sign out of your account"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/45">
              {isRtl
                ? "سيتم إنهاء الجلسة الحالية وإعادتك لبوابة دخول الناشر."
                : "This will end your current session and return you to the publisher login portal."}
            </p>

            <form action={signOutAction} className="mt-6">
              <input type="hidden" name="locale" value={locale} />

              <button
                type="submit"
                className="w-full border border-red-400/40 px-5 py-4 text-xs uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-400 hover:text-black"
              >
                {isRtl ? "تسجيل الخروج" : "Sign Out"}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            {isRtl ? "روابط الإدارة" : "Management Links"}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SettingsLink
              href={`/${locale}/publisher-dashboard/profile`}
              title={
                isRtl
                  ? isIndividual
                    ? "ملف الناشر"
                    : "ملف الجهة"
                  : isIndividual
                    ? "Publisher Profile"
                    : "Organization Profile"
              }
              description={
                isRtl
                  ? isIndividual
                    ? "تعديل بياناتك الأساسية ومعلومات مشروعك وصورة الحساب."
                    : "تعديل معلومات الجهة وصورة الحساب والبيانات التعريفية."
                  : isIndividual
                    ? "Edit your core details, project information, and account image."
                    : "Edit organization information, account image, and profile details."
              }
            />

            <SettingsLink
              href={`/${locale}/publisher-dashboard/opportunities`}
              title={isRtl ? "إدارة الفرص" : "Manage Opportunities"}
              description={
                isRtl
                  ? "إدارة الفرص والحالات والأرشفة."
                  : "Manage opportunities, statuses, and archiving."
              }
            />

            <SettingsLink
              href={`/${locale}/publisher-dashboard/applicants`}
              title={isRtl ? "المتقدمون" : "Applicants"}
              description={
                isRtl
                  ? "مراجعة الطلبات واتخاذ قرار القبول أو الرفض، وإدارة الاختيار المبدئي للطلبات السريعة."
                  : "Review applications, accept or reject casting applicants, and manage preliminary selection for Quick Requests."
              }
            />
          </div>
        </section>
      </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-white/35">{label}</span>
      <span className="break-all text-sm text-white/75">{value}</span>
    </div>
  );
}

function SettingsLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition hover:border-gold/40 hover:bg-gold/[0.04]"
    >
      <h3 className="text-lg font-light text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/40">{description}</p>
    </Link>
  );
}
