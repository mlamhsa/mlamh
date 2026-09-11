import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CastingClientLoginPage({ params, searchParams }: { params: Promise<{ locale?: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [{ locale: rawLocale = "ar" }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale === "en" ? "en" : "ar";
  const ar = locale === "ar";

  const errorText = query.error === "expired_link"
    ? (ar ? "انتهت صلاحية رابط الدخول. اطلب رابطًا جديدًا." : "That sign-in link has expired. Request a new one.")
    : query.error
      ? (ar ? "تعذر تسجيل الدخول بهذا الرابط. اطلب رابطًا جديدًا." : "We could not sign you in with that link. Request a new one.")
      : null;

  return <main dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 py-24 text-white sm:px-6 lg:py-32">
    <div className="mx-auto max-w-xl">
      <Link href={`/${locale}/casting`} className="text-xs text-gold hover:underline">{ar ? "← العودة إلى Managed Casting" : "← Back to Managed Casting"}</Link>
      <section className="mt-6 rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">MLAMH CLIENT ACCESS</p>
        <h1 className="mt-4 text-3xl font-light">{ar ? "الدخول إلى مشاريعك" : "Access your projects"}</h1>
        <p className="mt-3 text-sm leading-7 text-white/45">{ar ? "إذا سبق أن حفظت مشروع Managed Casting في حسابك، أدخل نفس البريد المسجل في المشروع وسنرسل لك رابط دخول آمن بدون كلمة مرور." : "If you previously saved a Managed Casting project to your account, enter the same project email and we will send you a secure passwordless sign-in link."}</p>

        {query.sent === "1" ? <div className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4 text-sm leading-7 text-emerald-100">{ar ? "إذا كان البريد مرتبطًا بحساب عميل، ستصلك رسالة دخول خلال لحظات. تحقق أيضًا من البريد غير المرغوب فيه." : "If that email is linked to a client account, a sign-in message will arrive shortly. Check spam as well."}</div> : null}
        {errorText ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100">{errorText}</div> : null}

        <form action="/api/casting/client/login" method="post" className="mt-6 grid gap-4">
          <input type="hidden" name="locale" value={locale}/>
          <label className="grid gap-2"><span className="text-xs text-white/45">{ar ? "البريد الإلكتروني للمشروع" : "Project email"}</span><input required type="email" name="email" autoComplete="email" maxLength={320} className="min-h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-gold/45" placeholder="name@company.com"/></label>
          <button className="min-h-12 rounded-xl bg-gold px-5 text-sm font-medium text-black">{ar ? "أرسل رابط الدخول" : "Send sign-in link"}</button>
        </form>

        <p className="mt-5 text-xs leading-6 text-white/30">{ar ? "لا ننشئ كلمة مرور تلقائيًا. الوصول يتم عبر رابط آمن يرسل إلى بريد المشروع." : "We do not generate a password. Access is granted through a secure link sent to the project email."}</p>
      </section>
    </div>
  </main>;
}
