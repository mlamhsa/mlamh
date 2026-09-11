"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type AccountState = "unclaimed" | "owned" | "claimed";

export default function ClientAccountBanner({ locale, token, accountState, canClaim }: { locale: "ar" | "en"; token: string; accountState: AccountState; canClaim: boolean }) {
  const ar = locale === "ar";
  const search = useSearchParams();
  const claimState = search.get("claim");
  const isOwned = accountState === "owned";
  const isClaimed = accountState === "claimed";

  const feedback = claimState === "sent"
    ? (ar ? "أرسلنا رابط دخول آمن إلى بريد المشروع. افتحه لحفظ المشروع في حسابك." : "A secure sign-in link was sent to the project email. Open it to save this project to your account.")
    : claimState === "already"
      ? (ar ? "هذا المشروع محفوظ في حساب عميل بالفعل." : "This project is already saved to a client account.")
      : claimState === "no_email"
        ? (ar ? "أضف بريدًا للعميل عبر فريق ملامح أولًا لتفعيل حفظ المشروع بالحساب." : "A project email is required before this workspace can be claimed.")
        : claimState === "email_mismatch"
          ? (ar ? "يجب فتح رابط الدخول بالبريد نفسه المسجل في المشروع." : "Use the same email address registered on this project.")
          : claimState === "error" || claimState === "invalid"
            ? (ar ? "تعذر إكمال حفظ المشروع الآن. جرّب مرة أخرى أو تواصل مع فريق ملامح." : "We could not complete the account claim. Try again or contact MLAMH.")
            : null;

  const description = isOwned
    ? (ar ? "هذا المشروع محفوظ في حسابك. يمكنك الرجوع إليه مع مشاريع Managed Casting الأخرى من مكان واحد." : "This project is saved to your account. Return to it alongside your other Managed Casting projects from one place.")
    : isClaimed
      ? (ar ? "هذا المشروع محفوظ مسبقًا في حساب العميل. يظل رابط المشروع الآمن صالحًا للوصول إلى مساحة العمل." : "This project is already saved to its client account. The secure project link remains available for workspace access.")
      : (ar ? "يمكنك متابعة المشروع بهذا الرابط بدون حساب، أو حفظه اختياريًا في حساب عميل عبر رابط دخول بالبريد — بدون كلمة مرور." : "You can keep using this private link without an account, or optionally save the project to a client account using a passwordless email link.");

  return <section dir={ar ? "rtl" : "ltr"} className="bg-background px-4 pt-4 text-white sm:px-6">
    <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">CLIENT ACCOUNT</p>
          <p className="mt-2 text-sm text-white/65">{description}</p>
          {feedback ? <p className="mt-2 text-xs leading-6 text-emerald-200">{feedback}</p> : null}
        </div>
        {isOwned ? <Link href={`/${locale}/casting/client`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 px-4 text-xs text-gold">{ar ? "مشاريعي" : "My projects"}</Link> : accountState === "unclaimed" && canClaim ? <form action="/api/casting/client/claim" method="post" className="shrink-0"><input type="hidden" name="token" value={token}/><input type="hidden" name="locale" value={locale}/><button className="min-h-11 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 text-xs text-gold">{ar ? "احفظ المشروع في حسابي" : "Save project to my account"}</button></form> : null}
      </div>
    </div>
  </section>;
}
