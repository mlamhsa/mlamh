import Link from "next/link";
import { CheckCircle2, Phone, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";

type AccountType = "talent" | "publisher";
type SignupIntent = "actor" | "model" | "publisher";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    type?: string;
    intent?: string;
    provider?: string;
    error?: string;
  }>;
};

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return "";
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function validPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function resolveAccountType(value?: string): AccountType {
  return value === "publisher" ? "publisher" : "talent";
}

function resolveIntent(value?: string, accountType?: AccountType): SignupIntent | null {
  if (value === "actor" || value === "model" || value === "publisher") return value;
  return accountType === "publisher" ? "publisher" : null;
}

async function completeSocialAccount(formData: FormData) {
  "use server";

  const rawLocale = String(formData.get("locale") ?? "ar");
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ar";
  const accountType = resolveAccountType(String(formData.get("account_type") ?? ""));
  const intent = resolveIntent(String(formData.get("intent") ?? ""), accountType);
  const provider = String(formData.get("provider") ?? "social").slice(0, 32);
  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const accepted = String(formData.get("accept_terms") ?? "") === "accepted";

  const baseQuery = new URLSearchParams({ type: accountType, provider });
  if (intent) baseQuery.set("intent", intent);

  if (fullName.length < 2 || fullName.length > 100) {
    baseQuery.set("error", "name");
    redirect(`/${locale}/join/complete-account?${baseQuery.toString()}`);
  }
  if (!validPhone(phone)) {
    baseQuery.set("error", "phone");
    redirect(`/${locale}/join/complete-account?${baseQuery.toString()}`);
  }
  if (!accepted) {
    baseQuery.set("error", "terms");
    redirect(`/${locale}/join/complete-account?${baseQuery.toString()}`);
  }

  const authClient = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) redirect(`/${locale}/join`);

  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id,account_type,phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[completeSocialAccount.lookup]", lookupError);
    baseQuery.set("error", "save");
    redirect(`/${locale}/join/complete-account?${baseQuery.toString()}`);
  }

  const profilePayload = {
    account_type: accountType,
    display_name: fullName,
    phone,
    status: "active",
    onboarding_status: "account_created",
    onboarding_step: accountType === "talent" ? "talent_profile" : "publisher_profile",
    approval_status: "not_submitted",
  };

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      console.error("[completeSocialAccount.update]", error);
      baseQuery.set("error", "save");
      redirect(`/${locale}/join/complete-account?${baseQuery.toString()}`);
    }
  } else {
    const { error } = await admin.from("profiles").insert({ user_id: user.id, ...profilePayload });
    if (error) {
      console.error("[completeSocialAccount.insert]", error);
      baseQuery.set("error", "save");
      redirect(`/${locale}/join/complete-account?${baseQuery.toString()}`);
    }
  }

  const metadata = {
    ...(user.user_metadata ?? {}),
    full_name: fullName,
    display_name: accountType === "talent" ? fullName : user.user_metadata?.display_name ?? null,
    contact_name: accountType === "publisher" ? fullName : user.user_metadata?.contact_name ?? null,
    phone,
    phone_verified: false,
    account_type: accountType,
    signup_intent: intent,
    preferred_locale: locale,
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
  };

  const { error: metadataError } = await authClient.auth.updateUser({ data: metadata });
  if (metadataError) console.error("[completeSocialAccount.metadata]", metadataError);

  if (accountType === "publisher") redirect(`/${locale}/join/publisher`);
  const intentQuery = intent === "actor" || intent === "model" ? `?intent=${intent}` : "";
  redirect(`/${locale}/join/talent${intentQuery}`);
}

function errorCopy(code: string | undefined, isRtl: boolean) {
  if (code === "name") return isRtl ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.";
  if (code === "phone") return isRtl ? "أدخل رقم جوال صحيحًا مع مفتاح الدولة، مثال: +9665XXXXXXXX." : "Enter a valid mobile number with country code, for example +9665XXXXXXXX.";
  if (code === "terms") return isRtl ? "يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة." : "Accept the Terms and Privacy Policy to continue.";
  if (code === "save") return isRtl ? "تعذر حفظ بيانات الحساب الآن. حاول مرة أخرى." : "We could not save your account details. Please try again.";
  return null;
}

export default async function CompleteAccountPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const isRtl = locale === "ar";
  const query = searchParams ? await searchParams : {};
  const accountType = resolveAccountType(query.type);
  const intent = resolveIntent(query.intent, accountType);
  const provider = query.provider === "apple" ? "apple" : query.provider === "google" ? "google" : "social";

  const authClient = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) redirect(`/${locale}/join`);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type,phone,onboarding_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.account_type && profile.phone?.trim()) redirect(`/${locale}/dashboard-router`);

  const suggestedName = String(
    user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.user_metadata?.display_name ??
      user.email?.split("@")[0] ??
      "",
  ).trim();
  const errorMessage = errorCopy(query.error, isRtl);
  const providerLabel = provider === "apple" ? "Apple" : provider === "google" ? "Google" : (isRtl ? "الحساب الاجتماعي" : "social account");

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 py-16 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold">
              <CheckCircle2 size={25} />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">{isRtl ? "خطوة أخيرة" : "ONE LAST STEP"}</p>
            <h1 className="mt-3 text-3xl font-light sm:text-4xl">{isRtl ? "أكمل بيانات حسابك" : "Complete your account"}</h1>
            <p className="mt-3 text-sm leading-7 text-white/50">
              {isRtl
                ? `تم تسجيل دخولك عبر ${providerLabel}. نحتاج اسمك ورقم جوالك حتى نستطيع التواصل معك واستكمال ملفك.`
                : `You're signed in with ${providerLabel}. Add your name and mobile number so we can keep your MLAMH account complete and reachable.`}
            </p>
          </div>

          {errorMessage ? <div role="alert" className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">{errorMessage}</div> : null}

          <form action={completeSocialAccount} className="space-y-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="account_type" value={accountType} />
            <input type="hidden" name="intent" value={intent ?? ""} />
            <input type="hidden" name="provider" value={provider} />

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium"><UserRound size={16} className="text-gold" />{isRtl ? "الاسم" : "Name"}<span className="text-gold">*</span></span>
              <input name="full_name" defaultValue={suggestedName} autoComplete="name" required minLength={2} maxLength={100} className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-gold/60" />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium"><Phone size={16} className="text-gold" />{isRtl ? "رقم الجوال" : "Mobile number"}<span className="text-gold">*</span></span>
              <input name="phone" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="+9665XXXXXXXX" required className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-left text-white outline-none transition focus:border-gold/60" />
              <p className={`mt-2 text-xs leading-5 text-white/40 ${isRtl ? "text-right" : "text-left"}`}>{isRtl ? "سيتم استخدام الرقم للتواصل معك، وسيصبح قابلاً للتحقق عبر SMS OTP مستقبلًا." : "Used to contact you and ready for SMS OTP verification in a future release."}</p>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-white/65">
              <input type="checkbox" name="accept_terms" value="accepted" required className="mt-1 h-4 w-4 accent-[#C9A962]" />
              <span>
                {isRtl ? "أوافق على " : "I agree to the "}
                <Link href={`/${locale}/terms`} className="text-gold hover:underline">{isRtl ? "الشروط" : "Terms"}</Link>
                {isRtl ? " و" : " and "}
                <Link href={`/${locale}/privacy`} className="text-gold hover:underline">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.
              </span>
            </label>

            <p className={`text-xs text-white/40 ${isRtl ? "text-right" : "text-left"}`}><span className="text-gold">*</span> {isRtl ? "حقل مطلوب" : "Required field"}</p>

            <button type="submit" className="min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-black text-black transition hover:bg-gold-soft">
              {isRtl ? "حفظ ومتابعة" : "Save & continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
